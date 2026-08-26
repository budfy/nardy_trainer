import { AvailableMoveOption, BoardState, PlayerColor, Point, SingleStepMove } from '../types/backgammon';

export type { AvailableMoveOption };

export function createInitialBoard(): BoardState {
  const points: Point[] = Array.from({ length: 24 }, (_, i) => ({
    index: i + 1,
    count: 0,
    color: null,
  }));

  // Standard Backgammon Starting Setup:
  // Points are indexed 1 to 24.
  // White moves: 24 -> 1 (Home: 1..6)
  // Black moves: 1 -> 24 (Home: 19..24)

  // White checkers (15 total)
  points[23] = { index: 24, count: 2, color: 'white' };
  points[12] = { index: 13, count: 5, color: 'white' };
  points[7] = { index: 8, count: 3, color: 'white' };
  points[5] = { index: 6, count: 5, color: 'white' };

  // Black checkers (15 total)
  points[0] = { index: 1, count: 2, color: 'black' };
  points[11] = { index: 12, count: 5, color: 'black' };
  points[16] = { index: 17, count: 3, color: 'black' };
  points[18] = { index: 19, count: 5, color: 'black' };

  return {
    points,
    bar: { white: 0, black: 0 },
    off: { white: 0, black: 0 },
  };
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    points: board.points.map((p) => ({ ...p })),
    bar: { ...board.bar },
    off: { ...board.off },
  };
}

export function areBoardsEqual(b1: BoardState, b2: BoardState): boolean {
  if (b1.bar.white !== b2.bar.white || b1.bar.black !== b2.bar.black) return false;
  if (b1.off.white !== b2.off.white || b1.off.black !== b2.off.black) return false;
  for (let i = 0; i < 24; i++) {
    const p1 = b1.points[i];
    const p2 = b2.points[i];
    if (p1.count !== p2.count) return false;
    if (p1.count > 0 && p1.color !== p2.color) return false;
  }
  return true;
}

export function calculatePipCount(board: BoardState): { white: number; black: number } {
  let white = board.bar.white * 25;
  let black = board.bar.black * 25;

  for (const point of board.points) {
    if (point.color === 'white') {
      white += point.count * point.index;
    } else if (point.color === 'black') {
      black += point.count * (25 - point.index);
    }
  }

  return { white, black };
}

export function canBearOff(board: BoardState, color: PlayerColor): boolean {
  if (color === 'white') {
    if (board.bar.white > 0) return false;
    for (const point of board.points) {
      if (point.color === 'white' && point.index > 6) {
        return false;
      }
    }
    return true;
  } else {
    if (board.bar.black > 0) return false;
    for (const point of board.points) {
      if (point.color === 'black' && point.index < 19) {
        return false;
      }
    }
    return true;
  }
}

export function getLegalDestinations(
  board: BoardState,
  from: number | 'bar',
  die: number,
  color: PlayerColor
): { to: number | 'off'; isHit: boolean }[] {
  const destinations: { to: number | 'off'; isHit: boolean }[] = [];
  const opponentColor = color === 'white' ? 'black' : 'white';

  // If player has checkers on bar, they MUST move from bar first
  const checkersOnBar = color === 'white' ? board.bar.white : board.bar.black;
  if (checkersOnBar > 0 && from !== 'bar') {
    return [];
  }

  if (from === 'bar') {
    const targetIndex = color === 'white' ? 24 - die + 1 : die;
    const targetPoint = board.points[targetIndex - 1];

    if (!targetPoint.color || targetPoint.color === color) {
      destinations.push({ to: targetIndex, isHit: false });
    } else if (targetPoint.color === opponentColor && targetPoint.count === 1) {
      destinations.push({ to: targetIndex, isHit: true });
    }
    return destinations;
  }

  // From normal point
  const currentPoint = board.points[from - 1];
  if (!currentPoint || currentPoint.color !== color || currentPoint.count === 0) {
    return [];
  }

  if (color === 'white') {
    const targetIndex = from - die;
    if (targetIndex >= 1) {
      const targetPoint = board.points[targetIndex - 1];
      if (!targetPoint.color || targetPoint.color === color) {
        destinations.push({ to: targetIndex, isHit: false });
      } else if (targetPoint.color === opponentColor && targetPoint.count === 1) {
        destinations.push({ to: targetIndex, isHit: true });
      }
    } else {
      // Bearing off
      if (canBearOff(board, 'white')) {
        if (targetIndex === 0) {
          // Exact roll
          destinations.push({ to: 'off', isHit: false });
        } else if (targetIndex < 0) {
          // Check if there are white checkers on higher points in home board (points from+1 to 6)
          let hasHigherCheckers = false;
          for (let p = from + 1; p <= 6; p++) {
            if (board.points[p - 1].color === 'white' && board.points[p - 1].count > 0) {
              hasHigherCheckers = true;
              break;
            }
          }
          if (!hasHigherCheckers) {
            destinations.push({ to: 'off', isHit: false });
          }
        }
      }
    }
  } else {
    // Black player
    const targetIndex = from + die;
    if (targetIndex <= 24) {
      const targetPoint = board.points[targetIndex - 1];
      if (!targetPoint.color || targetPoint.color === color) {
        destinations.push({ to: targetIndex, isHit: false });
      } else if (targetPoint.color === opponentColor && targetPoint.count === 1) {
        destinations.push({ to: targetIndex, isHit: true });
      }
    } else {
      // Bearing off
      if (canBearOff(board, 'black')) {
        if (targetIndex === 25) {
          // Exact roll
          destinations.push({ to: 'off', isHit: false });
        } else if (targetIndex > 25) {
          // Check if there are black checkers on lower points (points from 19 to from-1)
          let hasLowerCheckers = false;
          for (let p = 19; p < from; p++) {
            if (board.points[p - 1].color === 'black' && board.points[p - 1].count > 0) {
              hasLowerCheckers = true;
              break;
            }
          }
          if (!hasLowerCheckers) {
            destinations.push({ to: 'off', isHit: false });
          }
        }
      }
    }
  }

  return destinations;
}

export function applyMove(
  board: BoardState,
  move: SingleStepMove,
  color: PlayerColor
): { newBoard: BoardState; hit: boolean } {
  const newBoard = cloneBoard(board);
  const opponentColor = color === 'white' ? 'black' : 'white';
  let hit = false;

  // Remove checker from source
  if (move.from === 'bar') {
    if (color === 'white') {
      newBoard.bar.white = Math.max(0, newBoard.bar.white - 1);
    } else {
      newBoard.bar.black = Math.max(0, newBoard.bar.black - 1);
    }
  } else {
    const srcPoint = newBoard.points[move.from - 1];
    srcPoint.count -= 1;
    if (srcPoint.count === 0) {
      srcPoint.color = null;
    }
  }

  // Place checker on target
  if (move.to === 'off') {
    if (color === 'white') {
      newBoard.off.white += 1;
    } else {
      newBoard.off.black += 1;
    }
  } else {
    const dstPoint = newBoard.points[move.to - 1];
    if (dstPoint.color === opponentColor && dstPoint.count === 1) {
      // Hit opponent blot!
      hit = true;
      if (opponentColor === 'white') {
        newBoard.bar.white += 1;
      } else {
        newBoard.bar.black += 1;
      }
      dstPoint.count = 1;
      dstPoint.color = color;
    } else {
      dstPoint.count += 1;
      dstPoint.color = color;
    }
  }

  return { newBoard, hit };
}

export function getAvailableMoves(
  board: BoardState,
  remainingDice: number[],
  color: PlayerColor
): AvailableMoveOption[] {
  if (remainingDice.length === 0) return [];

  const uniqueDice = Array.from(new Set(remainingDice));
  const options: AvailableMoveOption[] = [];
  const checkersOnBar = color === 'white' ? board.bar.white : board.bar.black;

  // 1. Single Die Moves
  if (checkersOnBar > 0) {
    for (const die of uniqueDice) {
      const dests = getLegalDestinations(board, 'bar', die, color);
      for (const dest of dests) {
        options.push({
          from: 'bar',
          to: dest.to,
          dieUsed: die,
          isHit: dest.isHit,
          isCombined: false,
          steps: [{ from: 'bar', to: dest.to, dieUsed: die, isHit: dest.isHit }],
        });
      }
    }
  } else {
    // Normal points
    for (const point of board.points) {
      if (point.color === color && point.count > 0) {
        for (const die of uniqueDice) {
          const dests = getLegalDestinations(board, point.index, die, color);
          for (const dest of dests) {
            options.push({
              from: point.index,
              to: dest.to,
              dieUsed: die,
              isHit: dest.isHit,
              isCombined: false,
              steps: [{ from: point.index, to: dest.to, dieUsed: die, isHit: dest.isHit }],
            });
          }
        }
      }
    }
  }

  // 2. Compound / Multi-Die Combined Moves (if player has 2+ dice remaining)
  if (remainingDice.length >= 2) {
    const validSources: (number | 'bar')[] = [];
    if (checkersOnBar > 0) {
      validSources.push('bar');
    } else {
      for (const pt of board.points) {
        if (pt.color === color && pt.count > 0) {
          validSources.push(pt.index);
        }
      }
    }

    const isDouble = remainingDice.length >= 2 && remainingDice.every((d) => d === remainingDice[0]);

    if (isDouble) {
      const d = remainingDice[0];
      const maxCount = remainingDice.length; // 2, 3, or 4

      for (const src of validSources) {
        let currentBoard = cloneBoard(board);
        let currentPos: number | 'bar' | 'off' = src;
        const accumulatedSteps: SingleStepMove[] = [];
        let anyHit = false;

        for (let stepIdx = 0; stepIdx < maxCount; stepIdx++) {
          if (currentPos === 'off') break;
          const posForMove: number | 'bar' = currentPos;
          const stepDests = getLegalDestinations(currentBoard, posForMove, d, color);
          if (stepDests.length === 0) break;

          const stepDest = stepDests[0]; // unique destination for fixed die
          const stepMove: SingleStepMove = {
            from: posForMove,
            to: stepDest.to,
            dieUsed: d,
            isHit: stepDest.isHit,
          };
          if (stepDest.isHit) anyHit = true;
          accumulatedSteps.push(stepMove);

          const res = applyMove(currentBoard, stepMove, color);
          currentBoard = res.newBoard;
          currentPos = stepDest.to;

          // If we have completed 2, 3, or 4 steps, this is a valid compound move
          const stepsCount = stepIdx + 1;
          if (stepsCount >= 2) {
            const finalTo: number | 'off' = currentPos;
            // Avoid duplicate with single move if to === 'off' and already covered
            const isDuplicateOff =
              finalTo === 'off' && options.some((o) => o.from === src && o.to === 'off' && !o.isCombined);
            if (!isDuplicateOff) {
              const diceList = Array(stepsCount).fill(d);
              options.push({
                from: src,
                to: finalTo,
                dieUsed: d * stepsCount,
                diceUsed: diceList,
                isHit: anyHit,
                isCombined: true,
                steps: [...accumulatedSteps],
              });
            }
          }
        }
      }
    } else if (remainingDice.length === 2) {
      // Non-double 2 dice: [d1, d2]
      const [d1, d2] = remainingDice;

      for (const src of validSources) {
        // Path A: d1 then d2
        let pathAValid = false;
        let pathASteps: SingleStepMove[] = [];
        let pathATo: number | 'off' = 'off';
        let pathAHit = false;

        const destsA1 = getLegalDestinations(board, src, d1, color);
        if (destsA1.length > 0) {
          const destA1 = destsA1[0];
          const moveA1: SingleStepMove = { from: src, to: destA1.to, dieUsed: d1, isHit: destA1.isHit };
          if (destA1.isHit) pathAHit = true;
          const boardA1 = applyMove(board, moveA1, color).newBoard;

          if (destA1.to !== 'off') {
            const destsA2 = getLegalDestinations(boardA1, destA1.to, d2, color);
            if (destsA2.length > 0) {
              const destA2 = destsA2[0];
              const moveA2: SingleStepMove = { from: destA1.to, to: destA2.to, dieUsed: d2, isHit: destA2.isHit };
              if (destA2.isHit) pathAHit = true;
              pathAValid = true;
              pathATo = destA2.to;
              pathASteps = [moveA1, moveA2];
            }
          }
        }

        // Path B: d2 then d1
        let pathBValid = false;
        let pathBSteps: SingleStepMove[] = [];
        let pathBTo: number | 'off' = 'off';
        let pathBHit = false;

        const destsB1 = getLegalDestinations(board, src, d2, color);
        if (destsB1.length > 0) {
          const destB1 = destsB1[0];
          const moveB1: SingleStepMove = { from: src, to: destB1.to, dieUsed: d2, isHit: destB1.isHit };
          if (destB1.isHit) pathBHit = true;
          const boardB1 = applyMove(board, moveB1, color).newBoard;

          if (destB1.to !== 'off') {
            const destsB2 = getLegalDestinations(boardB1, destB1.to, d1, color);
            if (destsB2.length > 0) {
              const destB2 = destsB2[0];
              const moveB2: SingleStepMove = { from: destB1.to, to: destB2.to, dieUsed: d1, isHit: destB2.isHit };
              if (destB2.isHit) pathBHit = true;
              pathBValid = true;
              pathBTo = destB2.to;
              pathBSteps = [moveB1, moveB2];
            }
          }
        }

        if (pathAValid || pathBValid) {
          const chosenSteps = pathAValid && pathAHit ? pathASteps : pathBValid && pathBHit ? pathBSteps : pathAValid ? pathASteps : pathBSteps;
          const finalTo = pathAValid ? pathATo : pathBTo;
          const isHit = pathAHit || pathBHit;

          const isDuplicateOff =
            finalTo === 'off' && options.some((o) => o.from === src && o.to === 'off' && !o.isCombined);

          if (!isDuplicateOff) {
            options.push({
              from: src,
              to: finalTo,
              dieUsed: d1 + d2,
              diceUsed: [d1, d2],
              isHit,
              isCombined: true,
              steps: chosenSteps,
            });
          }
        }
      }
    }
  }

  return options;
}

export function checkWinCondition(board: BoardState): {
  isGameOver: boolean;
  winner: PlayerColor | null;
  winType: 'normal' | 'gammon' | 'backgammon' | null;
  winScore: number;
  description: string;
} {
  if (board.off.white >= 15) {
    // White won
    if (board.off.black === 0) {
      // Did Black still have checkers on White's home board (points 1-6) or Bar?
      let hasInWhiteHomeOrBar = board.bar.black > 0;
      for (let p = 1; p <= 6; p++) {
        if (board.points[p - 1].color === 'black' && board.points[p - 1].count > 0) {
          hasInWhiteHomeOrBar = true;
          break;
        }
      }
      if (hasInWhiteHomeOrBar) {
        return {
          isGameOver: true,
          winner: 'white',
          winType: 'backgammon',
          winScore: 3,
          description: 'Кокс (Backgammon)! Перемога з потрійною кількістю очок (3x).',
        };
      }
      return {
        isGameOver: true,
        winner: 'white',
        winType: 'gammon',
        winScore: 2,
        description: 'Марс (Gammon)! Супротивник не зняв жодної фішки (2x очки).',
      };
    }
    return {
      isGameOver: true,
      winner: 'white',
      winType: 'normal',
      winScore: 1,
      description: 'Звичайна перемога (1 очко).',
    };
  }

  if (board.off.black >= 15) {
    // Black won
    if (board.off.white === 0) {
      let hasInBlackHomeOrBar = board.bar.white > 0;
      for (let p = 19; p <= 24; p++) {
        if (board.points[p - 1].color === 'white' && board.points[p - 1].count > 0) {
          hasInBlackHomeOrBar = true;
          break;
        }
      }
      if (hasInBlackHomeOrBar) {
        return {
          isGameOver: true,
          winner: 'black',
          winType: 'backgammon',
          winScore: 3,
          description: 'Кокс (Backgammon)! Перемога компʼютера з потрійними очками.',
        };
      }
      return {
        isGameOver: true,
        winner: 'black',
        winType: 'gammon',
        winScore: 2,
        description: 'Марс (Gammon)! Компʼютер переміг без жодної знятої вами шашки.',
      };
    }
    return {
      isGameOver: true,
      winner: 'black',
      winType: 'normal',
      winScore: 1,
      description: 'Звичайна перемога компʼютера.',
    };
  }

  return {
    isGameOver: false,
    winner: null,
    winType: null,
    winScore: 0,
    description: '',
  };
}
