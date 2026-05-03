import type { Army } from "shared/schemas/army";
import type { CO } from "shared/schemas/co";
import { PlayerFriendLink } from "../PlayerFriendLink";

interface Player {
  name: string;
  favArmy: Army;
  favCO: CO;
}

const friends: Player[] = [
  {
    name: "Master Chief",
    favArmy: "orange-star",
    favCO: "adder",
  },
  {
    name: "Alm",
    favArmy: "green-earth",
    favCO: "andy",
  },
  {
    name: "Professor Layton",
    favArmy: "blue-moon",
    favCO: "grit",
  },
  {
    name: "Griffith",
    favArmy: "yellow-comet",
    favCO: "kanbei",
  },
  {
    name: "Yukimura204254 Echoes and Knuckles",
    favArmy: "black-hole",
    favCO: "lash",
  },
  {
    name: "The Arbiter",
    favArmy: "blue-moon",
    favCO: "javier",
  },
  {
    name: "Grimm Guy",
    favArmy: "yellow-comet",
    favCO: "grimm",
  },
];

export function PlayerFriendSection() {
  return (
    <section className="tw:w-full tw:min-h-full tw:bg-black/60 tw:pb-8 tw:p-6 tw:my-4">
      <h3 className="@font-russoOne tw:uppercase tw:text-2xl tw:smallscreen:text-3xl">Friends</h3>
      <div className="tw:flex tw:flex-col tw:w-full tw:py-6 tw:space-y-1">
        {friends.map((friend) => {
          return (
            <PlayerFriendLink
              key={friend.name}
              friendName={friend.name}
              friendFavArmy={friend.favArmy}
              friendFavCO={friend.favCO}
            />
          );
        })}
      </div>
    </section>
  );
}
