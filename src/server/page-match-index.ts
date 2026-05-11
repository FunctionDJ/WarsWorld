import { safeRemoveFromArray } from "shared/types/throw-helper";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { MatchInSetup } from "shared/wrappers/match/match-in-setup";

class PageMatchIndex {
  /**
   * a list of matches sorted by createMatchAndStore call order
   * (should always be from oldest created to newest)
   */
  private readonly list: MatchWrapper[] = [];

  getPage(pageNumber: number): readonly MatchWrapper[] {
    //this.list is a list of matches, it returns 50 matches
    const start = pageNumber * 50;
    return this.list.slice(start, start + 50);
  }

  addMatch(match: MatchWrapper): void {
    this.list.push(match);
  }

  removeMatch(match: MatchWrapper | MatchInSetup): void {
    safeRemoveFromArray(this.list, (m) => m.id === match.id);
  }
}

export const pageMatchIndex = new PageMatchIndex();
