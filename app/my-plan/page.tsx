import { redirect } from "next/navigation";

// My Plan merged into Account; keep old links working.
export default function MyPlanPage() {
  redirect("/account");
}
