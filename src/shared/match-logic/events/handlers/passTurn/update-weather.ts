import type { Turn } from "shared/types/events";
import type { MutablePlayerInMatch } from "shared/wrappers/player/mutable-player-in-match";

export function updateWeather(
  nextTurnPlayer: MutablePlayerInMatch,
  newWeather: Turn["newWeather"],
): void {
  const { match } = nextTurnPlayer;

  if (newWeather !== undefined) {
    // TODO maybe this gets the previous player instead of next turn player
    //  but if it's the case, i think we should change current turn player before doing all these updates
    match.setWeather(newWeather, 1);
    return;
  }

  if (match.playerToRemoveWeatherEffect?.data.slot === nextTurnPlayer.data.slot) {
    // the weather days left is for olaf awds, since his powers cause snow for TWO days
    match.weatherDaysLeft--;

    if (match.weatherDaysLeft <= 0) {
      match.playerToRemoveWeatherEffect = undefined;
    }
  }
}
