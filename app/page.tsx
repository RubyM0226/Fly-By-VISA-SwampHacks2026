import { LandingScreen } from "@/components/LandingScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export default function Home() {
  return (
    <ScreenTransition>
      <LandingScreen />
    </ScreenTransition>
  );
}
