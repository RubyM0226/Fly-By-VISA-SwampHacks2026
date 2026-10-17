import { HomeScreen } from "@/components/HomeScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export default function PlacesPage() {
  return (
    <ScreenTransition>
      <HomeScreen />
    </ScreenTransition>
  );
}
