import { ViewTransition } from "react";

/** Navigation types. Pass to <Link transitionTypes> or router.push(..., { transitionTypes }). */
export const FORWARD = ["journey-forward"];
export const BACK = ["journey-back"];

/**
 * Wraps one screen of the main flow. Moving forward pushes the screen off to
 * the left as the next one rolls in from the right; going back reverses it.
 * Navigations without a type (browser back button, refresh) just swap.
 */
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "journey-forward": "journey-forward", "journey-back": "journey-back", default: "none" }}
      exit={{ "journey-forward": "journey-forward", "journey-back": "journey-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
