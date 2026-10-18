import { DEFAULT_TRIP, type Trip } from "./trip";
import { doneFromStatus, tripFromProfile, type JourneyProfile } from "./tripProfile";

/** What a valid helper link shares: the traveler's saved answers and checked-off steps. */
export interface SharedJourney {
  profile: Partial<JourneyProfile> | null;
  stop_status: Record<string, unknown> | null;
}

/**
 * The traveler's trip, for the caregiver's read-only Dashboard copy. Built only
 * from the shared journey, never from this browser's own trip.
 */
export function sharedTrip(journey: SharedJourney): Trip {
  return { ...DEFAULT_TRIP, ...tripFromProfile(journey.profile), done: doneFromStatus(journey.stop_status) };
}

/** "First Last", or "" when the traveler gave no name. */
export function travelerName(profile: Partial<JourneyProfile> | null): string {
  return `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
}
