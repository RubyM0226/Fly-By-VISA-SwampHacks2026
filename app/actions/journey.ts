"use server";

import { auth0 } from "@/lib/auth0";
import sql from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUserJourney() {
  const session = await auth0.getSession();
  if (!session?.user) return null;

  try {
    const result = await sql`
      SELECT id, current_stop, stop_status 
      FROM journeys 
      WHERE user_id = ${session.user.sub}
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Database read error:", error);
    return null;
  }
}

export async function updateJourneyProgress(newStop: number, stopId: string, status: string) {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const existing = await sql`SELECT id FROM journeys WHERE user_id = ${session.user.sub}`;
    
    if (existing.length === 0) {
      // Create their journey if they don't have one
      await sql`
        INSERT INTO journeys (user_id, current_stop, stop_status)
        VALUES (${session.user.sub}, ${newStop}, ${sql.json({ [stopId]: status })})
      `;
    } else {
      // Update their existing journey (the || operator merges the new JSON status safely)
      await sql`
        UPDATE journeys 
        SET current_stop = ${newStop},
            stop_status = stop_status || ${sql.json({ [stopId]: status })},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${session.user.sub}
      `;
    }
    
    // Tell Next.js to refresh the page to show the new data
    revalidatePath("/location-map");
    return { success: true };
  } catch (error) {
    console.error("Database write error:", error);
    throw new Error("Failed to save progress");
  }
}

export async function createIntakeJourney() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub || null; // Will be null if they aren't logged in yet

  try {
    if (userId) {
      // If they are already signed in, check if they have a journey we can overwrite
      const existing = await sql`SELECT id FROM journeys WHERE user_id = ${userId}`;
      if (existing.length > 0) {
        // Reset their progress for the new trip
        await sql`
          UPDATE journeys 
          SET current_stop = 1, stop_status = '{}'::jsonb, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `;
        return { success: true, id: existing[0].id };
      }
    }

    // Insert a brand new journey (anonymous or new user) and return the UUID
    const result = await sql`
      INSERT INTO journeys (user_id, current_stop, stop_status)
      VALUES (${userId}, 1, '{}'::jsonb)
      RETURNING id
    `;
    
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error("Failed to create intake journey:", error);
    return { success: false, id: null };
  }
}