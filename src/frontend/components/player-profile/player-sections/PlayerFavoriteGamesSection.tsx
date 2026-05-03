const games = [
  {
    gameName: "Advance Wars",
  },
  {
    gameName: "Advance Wars 2",
  },
  {
    gameName: "Advance Wars Days of Ruin",
  },
  {
    gameName: "Famicom Wars",
  },
];

export function PlayerFavoriteGamesSection() {
  return (
    <section className="tw:pb-8 tw:px-8 tw:h-full tw:w-full tw:bg-black/60 tw:my-4 tw:space-y-2">
      <h1 className="tw:col-span-3 tw:text-center @font-russoOne">Favorite Games</h1>
      <div className="tw:grid tw:smallscreen:grid-cols-2 tw:laptop:grid-cols-4 tw:gap-4">
        {games.map((game) => {
          return (
            <div
              className="tw:w-full tw:h-52 tw:border-primary tw:border-4 tw:bg-bg-secondary"
              key={game.gameName}
            >
              <p className="tw:text-center">{game.gameName}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
