import { HomeScreen } from "@/components/HomeScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export default function Home() {
  return (
    <ScreenTransition>
      <HomeScreen />
    </ScreenTransition>
  );
}
