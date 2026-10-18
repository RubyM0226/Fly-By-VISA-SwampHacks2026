"use server";

import { auth0 } from "@/lib/auth0";
import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createHelperLink(label: string = "Helper") {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Find the user's active journey
    const journey = await sql`
      SELECT id FROM journeys 
      WHERE user_id = ${session.user.sub}
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    if (journey.length === 0) throw new Error("No journey found");

    const token = crypto.randomUUID();

    await sql`
      INSERT INTO journey_helpers (journey_id, token, label)
      VALUES (${journey[0].id}, ${token}, ${label})
    `;

    revalidatePath("/account");
    return { success: true, token };
  } catch (error) {
    console.error("Failed to create helper link:", error);
    return { success: false, token: null };
  }
}

export async function revokeHelperLink(token: string) {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await sql`
      UPDATE journey_helpers 
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token = ${token}
    `;
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to revoke helper link:", error);
    return { success: false };
  }
}

export async function getJourneyByHelperToken(token: string) {
  if (!token) return { valid: false, journey: null, label: null };

  try {
    const result = await sql`
      SELECT j.stop_status, j.profile, h.revoked_at, h.label
      FROM journey_helpers h
      JOIN journeys j ON h.journey_id = j.id
      WHERE h.token = ${token}
      LIMIT 1
    `;

    if (result.length === 0 || result[0].revoked_at) {
      return { valid: false, journey: null, label: null };
    }

    return {
      valid: true,
      journey: {
        stop_status: result[0].stop_status,
        profile: result[0].profile,
      },
      label: result[0].label,
    };
  } catch (error) {
    console.error("Helper token lookup error:", error);
    return { valid: false, journey: null, label: null };
  }
}

export async function updateHelperProgress(token: string, stepId: string, status: string) {
  if (!token) return { success: false };

  try {
    const helperCheck = await sql`
      SELECT journey_id, revoked_at FROM journey_helpers WHERE token = ${token} LIMIT 1
    `;

    if (helperCheck.length === 0 || helperCheck[0].revoked_at) {
      throw new Error("Invalid or revoked link");
    }

    const journeyId = helperCheck[0].journey_id;

    await sql`
      UPDATE journeys 
      SET stop_status = stop_status || ${sql.json({ [stepId]: status === "completed" })},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${journeyId}
    `;

    revalidatePath(`/help/${token}`);
    return { success: true };
  } catch (error) {
    console.error("Helper update error:", error);
    return { success: false };
  }
}