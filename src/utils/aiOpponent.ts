import { AIDifficulty, BoardState, PlayerColor, SingleStepMove } from '../types/backgammon';
import { applyMove, areBoardsEqual, calculatePipCount, cloneBoard, getLegalDestinations } from './backgammonEngine';
import { evaluateBlotRisks } from './probabilities';

export interface EvaluatedTurn {
  moves: SingleStepMove[];
  score: number;
  explanation: string;
}

export function evaluateBoardScore(board: BoardState, player: PlayerColor): number {
  const opponent: PlayerColor = player === 'white' ? 'black' : 'white';
  const pip = calculatePipCount(board);
  const pipAdvantage = player === 'white' ? pip.black - pip.white : pip.white - pip.black;

  let score = 0;

  // 1. Pip Count race (1 pip = ~2 points)
  score += pipAdvantage * 2.2;

  // 2. Borne off checkers (huge bonus)
  const myOff = player === 'white' ? board.off.white : board.off.black;
  const oppOff = player === 'white' ? board.off.black : board.off.white;
  score += myOff * 35 - oppOff * 35;

  // 3. Checkers on Bar (huge penalty for me, huge bonus for opponent)
  const myBar = player === 'white' ? board.bar.white : board.bar.black;
  const oppBar = player === 'white' ? board.bar.black : board.bar.white;
  score -= myBar * 50;
  score += oppBar * 45;

  // 4. Points Made (2+ checkers) and Golden/Key points
  let consecutivePrimes = 0;
  let maxPrime = 0;

  for (let i = 0; i < 24; i++) {
    const pt = board.points[i];
    const ptIndex = pt.index;

    if (pt.color === player && pt.count >= 2) {
      score += 15; // Made point
      consecutivePrimes++;
      if (consecutivePrimes > maxPrime) maxPrime = consecutivePrimes;

      // Key points bonus
      if (player === 'white') {
        if (ptIndex === 5) score += 35; // Golden point
        if (ptIndex === 7) score += 25; // Bar point
        if (ptIndex === 4) score += 20;
        if (ptIndex === 20) score += 25; // Advanced anchor in Black home
      } else {
        if (ptIndex === 20) score += 35; // Golden point for Black
        if (ptIndex === 18) score += 25; // Bar point for Black
        if (ptIndex === 21) score += 20;
        if (ptIndex === 5) score += 25; // Anchor in White home
      }

      // Penalty for over-stacking (e.g. 5+ checkers on one point is inflexible)
      if (pt.count > 4) {
        score -= (pt.count - 4) * 8;
      }
    } else {
      consecutivePrimes = 0;
    }
  }

  // Bonus for Prime length (4+ consecutive points is devastating)
  if (maxPrime === 4) score += 30;
  if (maxPrime === 5) score += 65;
  if (maxPrime >= 6) score += 120; // Full 6-prime trap!

  // 5. Blot risk penalty
  const myBlots = evaluateBlotRisks(board, player);
  for (const blot of myBlots) {
    // Penalty proportional to hit risk
    score -= (blot.riskPercent / 100) * 45;
  }

  return score;
}

export function findBestTurnMoves(
  board: BoardState,
  dice: number[],
  player: PlayerColor,
  difficulty: AIDifficulty = 'intermediate'
): { moves: SingleStepMove[]; summary: string } {
  // Generate all legal combinations of moves for the dice
  const allCombinations = searchMoveSequences(board, dice, player);

  if (allCombinations.length === 0) {
    return {
      moves: [],
      summary: 'Немає можливих ходів для поточного кидка кубиків.',
    };
  }

  // Sort by score
  allCombinations.sort((a, b) => b.score - a.score);

  if (difficulty === 'beginner') {
    // Occasionally pick a slightly sub-optimal move to make game fun
    const pickIndex = Math.min(Math.floor(Math.random() * 3), allCombinations.length - 1);
    return {
      moves: allCombinations[pickIndex].moves,
      summary: allCombinations[pickIndex].explanation,
    };
  }

  // Intermediate & Master pick best
  const best = allCombinations[0];
  return {
    moves: best.moves,
    summary: best.explanation,
  };
}

function searchMoveSequences(
  board: BoardState,
  dice: number[],
  player: PlayerColor
): EvaluatedTurn[] {
  const results: EvaluatedTurn[] = [];

  function recurse(
    currBoard: BoardState,
    remainingDice: number[],
    accumulatedMoves: SingleStepMove[]
  ) {
    if (remainingDice.length === 0) {
      const finalScore = evaluateBoardScore(currBoard, player);
      const explanation = generateMoveSequenceExplanation(currBoard, accumulatedMoves, player);
      results.push({
        moves: [...accumulatedMoves],
        score: finalScore,
        explanation,
      });
      return;
    }

    const uniqueDice = Array.from(new Set(remainingDice));
    let hasAnyMove = false;
    const checkersOnBar = player === 'white' ? currBoard.bar.white : currBoard.bar.black;

    for (const die of uniqueDice) {
      if (checkersOnBar > 0) {
        const dests = getLegalDestinations(currBoard, 'bar', die, player);
        for (const dest of dests) {
          hasAnyMove = true;
          const stepMove: SingleStepMove = {
            from: 'bar',
            to: dest.to,
            dieUsed: die,
            isHit: dest.isHit,
          };
          const { newBoard } = applyMove(currBoard, stepMove, player);
          const nextDice = removeOneDie(remainingDice, die);
          recurse(newBoard, nextDice, [...accumulatedMoves, stepMove]);
        }
      } else {
        for (const pt of currBoard.points) {
          if (pt.color === player && pt.count > 0) {
            const dests = getLegalDestinations(currBoard, pt.index, die, player);
            for (const dest of dests) {
              hasAnyMove = true;
              const stepMove: SingleStepMove = {
                from: pt.index,
                to: dest.to,
                dieUsed: die,
                isHit: dest.isHit,
              };
              const { newBoard } = applyMove(currBoard, stepMove, player);
              const nextDice = removeOneDie(remainingDice, die);
              recurse(newBoard, nextDice, [...accumulatedMoves, stepMove]);
            }
          }
        }
      }
    }

    if (!hasAnyMove && accumulatedMoves.length > 0) {
      // Partial turn played (could not use remaining dice)
      const finalScore = evaluateBoardScore(currBoard, player) - remainingDice.length * 15;
      const explanation = generateMoveSequenceExplanation(currBoard, accumulatedMoves, player);
      results.push({
        moves: [...accumulatedMoves],
        score: finalScore,
        explanation,
      });
    }
  }

  recurse(board, dice, []);
  return results;
}

function removeOneDie(dice: number[], dieToRemove: number): number[] {
  const index = dice.indexOf(dieToRemove);
  if (index === -1) return [...dice];
  const copy = [...dice];
  copy.splice(index, 1);
  return copy;
}

function generateMoveSequenceExplanation(
  finalBoard: BoardState,
  moves: SingleStepMove[],
  player: PlayerColor
): string {
  if (moves.length === 0) return 'Пропуск ходу.';

  const hits = moves.filter((m) => m.isHit).length;
  const offCount = moves.filter((m) => m.to === 'off').length;
  const fromBar = moves.filter((m) => m.from === 'bar').length;

  const parts: string[] = [];

  if (fromBar > 0) {
    parts.push(`Успішне повернення з бару (${fromBar} шаш.)`);
  }
  if (hits > 0) {
    parts.push(`Вибито блот супротивника (+${hits} на бар)`);
  }
  if (offCount > 0) {
    parts.push(`Знято ${offCount} фіш. з дошки`);
  }

  // Check if a golden point or prime point was created
  for (const m of moves) {
    if (m.to !== 'off') {
      const pt = finalBoard.points[m.to - 1];
      if (pt && pt.count === 2) {
        if (m.to === 5 || m.to === 20) {
          parts.push(`Створено ключовий Золотий пункт (${m.to})`);
        } else if (m.to === 7 || m.to === 18) {
          parts.push(`Закрито бар-пойнт (${m.to})`);
        }
      }
    }
  }

  if (parts.length === 0) {
    parts.push('Позиційний розвиток та просування шашок вперед');
  }

  return parts.join(' • ');
}

export function evaluatePlayerMoveQuality(
  boardBefore: BoardState,
  dice: number[],
  playedMoves: SingleStepMove[],
  player: PlayerColor
): {
  quality: 'best' | 'great' | 'good' | 'inaccurate' | 'blunder';
  summary: string;
  advice: string;
  bestAlternative?: SingleStepMove[];
} {
  const allOptions = searchMoveSequences(boardBefore, dice, player);
  if (allOptions.length === 0) {
    return {
      quality: 'good',
      summary: 'Немає інших варіантів ходу.',
      advice: 'Хід було пропущено за правилами гри.',
    };
  }

  allOptions.sort((a, b) => b.score - a.score);
  const bestOption = allOptions[0];

  // Apply played moves
  let curr = cloneBoard(boardBefore);
  for (const m of playedMoves) {
    curr = applyMove(curr, m, player).newBoard;
  }
  const playedScore = evaluateBoardScore(curr, player);

  // Check if player's resulting board matches any of the highest-rated move sequences
  const topScore = bestOption.score;
  const isOptimalBoard = allOptions
    .filter((opt) => Math.abs(opt.score - topScore) < 0.01)
    .some((opt) => {
      let optBoard = cloneBoard(boardBefore);
      for (const m of opt.moves) {
        optBoard = applyMove(optBoard, m, player).newBoard;
      }
      return areBoardsEqual(curr, optBoard);
    });

  const delta = isOptimalBoard ? 0 : bestOption.score - playedScore;

  if (delta <= 2 || isOptimalBoard) {
    return {
      quality: 'best',
      summary: 'Чудовий хід! Точна стратегічна гра.',
      advice: 'Ви обрали оптимальний баланс між безпекою, темпом та створенням пунктів.',
    };
  } else if (delta <= 12) {
    return {
      quality: 'great',
      summary: 'Дуже сильний хід.',
      advice: 'Хороша позиційна гра з мінімальним ризиком.',
    };
  } else if (delta <= 25) {
    return {
      quality: 'good',
      summary: 'Прийнятний хід, але був сильніший варіант.',
      advice: 'Звертайте увагу на закриття пунктів у власному домі та захист блотів.',
      bestAlternative: bestOption.moves,
    };
  } else if (delta <= 45) {
    return {
      quality: 'inaccurate',
      summary: 'Неточність: відкриває непотрібний ризик або втрачає темп.',
      advice: 'Супротивник отримує додаткові шанси на прямий удар з дистанції 1-6.',
      bestAlternative: bestOption.moves,
    };
  } else {
    return {
      quality: 'blunder',
      summary: 'Груба помилка (Позіх)!',
      advice: 'Цей хід залишає вразливі одиночні шашки або втрачає контроль над центром дошки.',
      bestAlternative: bestOption.moves,
    };
  }
}
