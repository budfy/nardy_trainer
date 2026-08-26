import { BoardState, BlotRiskInfo, HitProbabilityData, PlayerColor } from '../types/backgammon';

export interface DiceCombination {
  d1: number;
  d2: number;
  sum: number;
  isDouble: boolean;
}

export const ALL_DICE_ROLLS: DiceCombination[] = (() => {
  const rolls: DiceCombination[] = [];
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      rolls.push({
        d1,
        d2,
        sum: d1 + d2,
        isDouble: d1 === d2,
      });
    }
  }
  return rolls;
})();

export const STANDARD_HIT_TABLE: HitProbabilityData[] = [
  {
    distance: 1,
    combinationsCount: 11,
    probabilityPercent: 30.6,
    exactRolls: ['1-1', '1-2', '2-1', '1-3', '3-1', '1-4', '4-1', '1-5', '5-1', '1-6', '6-1'],
    isDirect: true,
    tacticalNote: 'Прямий удар. Будь-яка 1 на кубику або 1-1 бʼє блот.',
  },
  {
    distance: 2,
    combinationsCount: 12,
    probabilityPercent: 33.3,
    exactRolls: ['2-X (11 варіантів)', '1-1'],
    isDirect: true,
    tacticalNote: 'Прямий удар. Будь-яка 2 або дубль 1-1.',
  },
  {
    distance: 3,
    combinationsCount: 14,
    probabilityPercent: 38.9,
    exactRolls: ['3-X (11 вар.)', '1-2', '2-1', '1-1'],
    isDirect: true,
    tacticalNote: 'Дуже небезпечна відстань (14 комбінацій з 36).',
  },
  {
    distance: 4,
    combinationsCount: 15,
    probabilityPercent: 41.7,
    exactRolls: ['4-X (11 вар.)', '1-3', '3-1', '2-2', '1-1'],
    isDirect: true,
    tacticalNote: 'Понад 40% шансу бути вибитим!',
  },
  {
    distance: 5,
    combinationsCount: 15,
    probabilityPercent: 41.7,
    exactRolls: ['5-X (11 вар.)', '1-4', '4-1', '2-3', '3-2', '1-1'],
    isDirect: true,
    tacticalNote: 'Висока небезпека прямого та комбінованого удару.',
  },
  {
    distance: 6,
    combinationsCount: 17,
    probabilityPercent: 47.2,
    exactRolls: ['6-X (11 вар.)', '1-5', '5-1', '2-4', '4-2', '3-3', '2-2'],
    isDirect: true,
    tacticalNote: 'Найнебезпечніша пряма дистанція! Майже 50% імовірність удару (17/36).',
  },
  {
    distance: 7,
    combinationsCount: 6,
    probabilityPercent: 16.7,
    exactRolls: ['6-1', '1-6', '5-2', '2-5', '4-3', '3-4'],
    isDirect: false,
    tacticalNote: 'Непрямий удар. Потребує суми двох кубиків, набагато безпечніше ніж дистанція 6.',
  },
  {
    distance: 8,
    combinationsCount: 6,
    probabilityPercent: 16.7,
    exactRolls: ['6-2', '2-6', '5-3', '3-5', '4-4', '2-2'],
    isDirect: false,
    tacticalNote: 'Непрямий удар через суму кубиків або дублі.',
  },
  {
    distance: 9,
    combinationsCount: 5,
    probabilityPercent: 13.9,
    exactRolls: ['6-3', '3-6', '5-4', '4-5', '3-3'],
    isDirect: false,
    tacticalNote: 'Низька ймовірність (менше 14%).',
  },
  {
    distance: 10,
    combinationsCount: 3,
    probabilityPercent: 8.3,
    exactRolls: ['6-4', '4-6', '5-5'],
    isDirect: false,
    tacticalNote: 'Відносно безпечна відстань (лише 3 комбінації з 36).',
  },
  {
    distance: 11,
    combinationsCount: 2,
    probabilityPercent: 5.6,
    exactRolls: ['6-5', '5-6'],
    isDirect: false,
    tacticalNote: 'Дуже безпечна позиція (лише 2 комбінації).',
  },
  {
    distance: 12,
    combinationsCount: 3,
    probabilityPercent: 8.3,
    exactRolls: ['6-6', '4-4', '3-3'],
    isDirect: false,
    tacticalNote: 'Бʼється лише дублями 6-6, 4-4, 3-3.',
  },
];

export function calculateBarEntryOdds(closedPointsCount: number): {
  openPoints: number;
  hittingRolls: number;
  entryChancePercent: number;
  trapChancePercent: number;
} {
  const open = Math.max(0, Math.min(6, 6 - closedPointsCount));
  const closed = 6 - open;

  // Probability that at least one die lands on an open point
  // Odds both dice land on closed points = (closed/6)^2
  // But wait: exact roll count out of 36
  let failingRolls = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      // If point corresponding to d1 is closed AND point corresponding to d2 is closed:
      const d1Closed = d1 <= closed;
      const d2Closed = d2 <= closed;
      if (d1Closed && d2Closed) {
        failingRolls++;
      }
    }
  }

  const successRolls = 36 - failingRolls;
  const entryChance = Math.round((successRolls / 36) * 1000) / 10;
  const trapChance = Math.round((failingRolls / 36) * 1000) / 10;

  return {
    openPoints: open,
    hittingRolls: successRolls,
    entryChancePercent: entryChance,
    trapChancePercent: trapChance,
  };
}

export function evaluateBlotRisks(board: BoardState, playerColor: PlayerColor): BlotRiskInfo[] {
  const opponentColor: PlayerColor = playerColor === 'white' ? 'black' : 'white';
  const risks: BlotRiskInfo[] = [];

  // Identify all player blots
  for (const point of board.points) {
    if (point.color === playerColor && point.count === 1) {
      const blotIndex = point.index;
      let hitRollCount = 0;
      const threateningOpponents: Set<number> = new Set();

      // Check all 36 possible opponent dice rolls
      for (const roll of ALL_DICE_ROLLS) {
        const canHitWithRoll = checkOpponentCanHitWithRoll(
          board,
          blotIndex,
          roll.d1,
          roll.d2,
          roll.isDouble,
          opponentColor
        );
        if (canHitWithRoll.hit) {
          hitRollCount++;
          if (canHitWithRoll.fromPoint !== null) {
            threateningOpponents.add(canHitWithRoll.fromPoint);
          }
        }
      }

      const riskPercent = Math.round((hitRollCount / 36) * 100);
      risks.push({
        pointIndex: blotIndex,
        color: playerColor,
        riskPercent,
        hitRollCount,
        threateningOpponents: Array.from(threateningOpponents),
      });
    }
  }

  return risks;
}

function checkOpponentCanHitWithRoll(
  board: BoardState,
  targetPointIndex: number,
  d1: number,
  d2: number,
  isDouble: boolean,
  opponentColor: PlayerColor
): { hit: boolean; fromPoint: number | null } {
  const diceSequence = isDouble ? [d1, d1, d1, d1] : [d1, d2];
  const opponentOnBar = opponentColor === 'white' ? board.bar.white : board.bar.black;

  // Case 1: Opponent is on Bar
  if (opponentOnBar > 0) {
    if (opponentColor === 'white') {
      // White enters at 24 - die + 1
      for (const die of [d1, d2]) {
        const entryPoint = 24 - die + 1;
        if (entryPoint === targetPointIndex) return { hit: true, fromPoint: 0 }; // 0 represents bar
      }
    } else {
      // Black enters at die
      for (const die of [d1, d2]) {
        const entryPoint = die;
        if (entryPoint === targetPointIndex) return { hit: true, fromPoint: 0 };
      }
    }
    return { hit: false, fromPoint: null };
  }

  // Case 2: Normal opponent checkers on board
  for (const pt of board.points) {
    if (pt.color === opponentColor && pt.count > 0) {
      const srcIndex = pt.index;

      if (opponentColor === 'white') {
        // White moves downwards (srcIndex - die)
        // Direct single die
        if (srcIndex - d1 === targetPointIndex || srcIndex - d2 === targetPointIndex) {
          return { hit: true, fromPoint: srcIndex };
        }
        // Combined 2 dice: d1 then d2 (intermediate point must not be blocked by 2+ Black checkers)
        const intermediate1 = srcIndex - d1;
        if (intermediate1 >= 1 && srcIndex - (d1 + d2) === targetPointIndex) {
          const interPt = board.points[intermediate1 - 1];
          if (!interPt.color || interPt.color === 'white' || interPt.count <= 1) {
            return { hit: true, fromPoint: srcIndex };
          }
        }
        const intermediate2 = srcIndex - d2;
        if (intermediate2 >= 1 && srcIndex - (d1 + d2) === targetPointIndex) {
          const interPt = board.points[intermediate2 - 1];
          if (!interPt.color || interPt.color === 'white' || interPt.count <= 1) {
            return { hit: true, fromPoint: srcIndex };
          }
        }
        // Doubles 3 or 4 steps
        if (isDouble) {
          if (srcIndex - d1 * 3 === targetPointIndex || srcIndex - d1 * 4 === targetPointIndex) {
            return { hit: true, fromPoint: srcIndex };
          }
        }
      } else {
        // Black moves upwards (srcIndex + die)
        if (srcIndex + d1 === targetPointIndex || srcIndex + d2 === targetPointIndex) {
          return { hit: true, fromPoint: srcIndex };
        }
        // Combined 2 dice
        const intermediate1 = srcIndex + d1;
        if (intermediate1 <= 24 && srcIndex + (d1 + d2) === targetPointIndex) {
          const interPt = board.points[intermediate1 - 1];
          if (!interPt.color || interPt.color === 'black' || interPt.count <= 1) {
            return { hit: true, fromPoint: srcIndex };
          }
        }
        const intermediate2 = srcIndex + d2;
        if (intermediate2 <= 24 && srcIndex + (d1 + d2) === targetPointIndex) {
          const interPt = board.points[intermediate2 - 1];
          if (!interPt.color || interPt.color === 'black' || interPt.count <= 1) {
            return { hit: true, fromPoint: srcIndex };
          }
        }
        if (isDouble) {
          if (srcIndex + d1 * 3 === targetPointIndex || srcIndex + d1 * 4 === targetPointIndex) {
            return { hit: true, fromPoint: srcIndex };
          }
        }
      }
    }
  }

  return { hit: false, fromPoint: null };
}
