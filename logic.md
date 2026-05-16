terminology:

- AW1: Advance Wars
- AW2: Advance Wars 2: Black Hole Rising
- AWDS: Advance Wars: Dual Strike
- FoW: Fog of war

## formalization / pseudo-code:

```js
function isFoW(match) {
  if (match.permanentFoW) {
    return true;
  }

  if (match.gameMode === "AWDS" && match.currentWeather === "rain") {
    return true;
  }

  return false;
}

function isUnitVisibleToTeamA(match, unit, teamA) {
  if (unit.player.team === teamA) {
    return true;
  }

  if (teamA.hasUnitNextTo(unit) || teamA.ownsPropertyAt(unit.position)) {
    return true;
  }

  if (unit.isSubmergedOrStealthed) {
    return false;
  }

  if (isFow(match)) {
    return teamA.isTileVisibleAt(unit.position);
  }

  return true;
}
```

- if unit is visible to teamA
  - isHPVisibleToTeamA = unit.player.team !== teamA && unit.player.co !== sonja
  - fuel is visible
  - ammo is visible

## funds

- funds of other teams are hidden in FoW
- power charge is _always_ visible
- hidden encounters (e.g. what teamA sees if teamB attacks teamC completely in fog) only notify teamA of power charge changes / values, not funds (e.g. sasha SCOP) because of FoW
- in _non_-FoW, if teamA attacks teamB (teamB is sasha + SCOP, both dived subs), teamC necessarily needs an attack event but it only updates power charge and funds for their perspective

## stealth

- attacker must be optional (e.g. we're teamA, dont see the stealth/sub, and teamB attacks teamC)
- defender must also be optional for the same reason
- let's just not _filter_ attack events for any reason because for teamA, they only have absolutely no effect in only very rare edge-cases (attacker and defender have COP/SCOP active or max power level, none of them is sasha+SCOP active, both units are invisible to teamA etc)

## attack event

attack events necessarily need to be able to carry:

- HP values (not derivable because in FoW or with sonja you may not have the necessary info to isomorphically calculate damage in FE+BE)
- funds updates
- power charge updates
- elimination updates (if last unit eliminated)
