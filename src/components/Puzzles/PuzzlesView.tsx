import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { BACKGAMMON_PUZZLES } from '../../data/puzzlesData';
import { AvailableMoveOption, BoardState, Puzzle, SingleStepMove } from '../../types/backgammon';
import { BackgammonBoard } from '../Board/BackgammonBoard';
import { DiceRoller } from '../Board/DiceRoller';
import {
  applyMove,
  areBoardsEqual,
  cloneBoard,
  getAvailableMoves,
} from '../../utils/backgammonEngine';
import { evaluatePlayerMoveQuality } from '../../utils/aiOpponent';
import {
  playCheckerSound,
  playHitBlotSound,
  playSuccessSound,
} from '../../utils/audioFx';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

const PUZZLES_STORAGE_KEY = 'backgammon_puzzles_state_v1';

interface SavedPuzzlesState {
  selectedPuzzleIdx?: number;
  boardState?: BoardState;
  remainingDice?: number[];
  selectedPoint?: number | 'bar' | null;
  movesPlayed?: SingleStepMove[];
  evaluationResult?: 'best' | 'blunder' | null;
}

const getSavedPuzzlesState = (): SavedPuzzlesState | null => {
  try {
    const raw = localStorage.getItem(PUZZLES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPuzzlesState;
  } catch {
    return null;
  }
};

export const PuzzlesView: React.FC = () => {
  const savedState = useRef(getSavedPuzzlesState()).current;

  const initialPuzzleIdx =
    typeof savedState?.selectedPuzzleIdx === 'number' &&
    savedState.selectedPuzzleIdx >= 0 &&
    savedState.selectedPuzzleIdx < BACKGAMMON_PUZZLES.length
      ? savedState.selectedPuzzleIdx
      : 0;

  const initialPuzzle = BACKGAMMON_PUZZLES[initialPuzzleIdx];

  const [selectedPuzzleIdx, setSelectedPuzzleIdx] = useState<number>(initialPuzzleIdx);
  const currentPuzzle: Puzzle = BACKGAMMON_PUZZLES[selectedPuzzleIdx] || BACKGAMMON_PUZZLES[0];

  const [boardState, setBoardState] = useState<BoardState>(
    () => savedState?.boardState || cloneBoard(initialPuzzle.boardSetup)
  );
  const [remainingDice, setRemainingDice] = useState<number[]>(
    () => savedState?.remainingDice || [...initialPuzzle.dice]
  );
  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(
    () => savedState?.selectedPoint ?? null
  );
  const [movesPlayed, setMovesPlayed] = useState<SingleStepMove[]>(
    () => savedState?.movesPlayed || []
  );
  const [evaluationResult, setEvaluationResult] = useState<'best' | 'blunder' | null>(
    () => savedState?.evaluationResult ?? null
  );

  // Persist puzzles state to localStorage
  useEffect(() => {
    try {
      const stateToSave: SavedPuzzlesState = {
        selectedPuzzleIdx,
        boardState,
        remainingDice,
        selectedPoint,
        movesPlayed,
        evaluationResult,
      };
      localStorage.setItem(PUZZLES_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore quota errors
    }
  }, [
    selectedPuzzleIdx,
    boardState,
    remainingDice,
    selectedPoint,
    movesPlayed,
    evaluationResult,
  ]);

  const loadPuzzle = (idx: number) => {
    const p = BACKGAMMON_PUZZLES[idx];
    setSelectedPuzzleIdx(idx);
    setBoardState(cloneBoard(p.boardSetup));
    setRemainingDice([...p.dice]);
    setSelectedPoint(null);
    setMovesPlayed([]);
    setEvaluationResult(null);
  };

  const handleReset = () => {
    loadPuzzle(selectedPuzzleIdx);
  };

  const availableMoves = getAvailableMoves(
    boardState,
    remainingDice,
    currentPuzzle.playerTurn
  );

  const evaluateMoveSuccess = (
    played: SingleStepMove[],
    currentBoard: BoardState,
    remainingD: number[]
  ): boolean => {
    // 1. Check exact or permutation match with bestMoves
    const checkCandidateMoves = (targetCandidate: SingleStepMove[]): boolean => {
      if (played.length !== targetCandidate.length) return false;
      const pool = [...targetCandidate];
      for (const m of played) {
        const idx = pool.findIndex(
          (t) => t.from === m.from && t.to === m.to
        );
        if (idx !== -1) {
          pool.splice(idx, 1);
        } else {
          return false;
        }
      }
      return pool.length === 0;
    };

    if (checkCandidateMoves(currentPuzzle.bestMoves)) {
      return true;
    }

    // 2. Check acceptable alternate candidate lists
    if (currentPuzzle.acceptableMoves) {
      for (const alt of currentPuzzle.acceptableMoves) {
        if (checkCandidateMoves(alt)) {
          return true;
        }
      }
    }

    // 3. Fallback: Compare resulting final board state with expected board state
    const checkBoardEqualityAgainst = (candidateMoves: SingleStepMove[]): boolean => {
      let expected = cloneBoard(currentPuzzle.boardSetup);
      for (const m of candidateMoves) {
        expected = applyMove(expected, m, currentPuzzle.playerTurn).newBoard;
      }
      return areBoardsEqual(currentBoard, expected);
    };

    if (checkBoardEqualityAgainst(currentPuzzle.bestMoves)) {
      return true;
    }

    if (currentPuzzle.acceptableMoves) {
      for (const alt of currentPuzzle.acceptableMoves) {
        if (checkBoardEqualityAgainst(alt)) {
          return true;
        }
      }
    }

    // 4. Fallback: AI evaluation quality
    if (remainingD.length === 0) {
      const qualityEval = evaluatePlayerMoveQuality(
        currentPuzzle.boardSetup,
        currentPuzzle.dice,
        played,
        currentPuzzle.playerTurn
      );
      if (qualityEval.quality === 'best' || qualityEval.quality === 'great') {
        return true;
      }
    }

    return false;
  };

  const handleSelectTarget = (to: number | 'off', dieUsed: number, moveOption?: AvailableMoveOption) => {
    if (!selectedPoint) return;

    if (moveOption?.isCombined && moveOption.steps && moveOption.steps.length > 0) {
      let currentBoard = boardState;
      let anyHit = false;
      const nextDice = [...remainingDice];
      const newlyPlayed: SingleStepMove[] = [];

      for (const step of moveOption.steps) {
        const { newBoard, hit } = applyMove(currentBoard, step, currentPuzzle.playerTurn);
        if (hit) anyHit = true;
        currentBoard = newBoard;
        newlyPlayed.push(step);

        const dIdx = nextDice.indexOf(step.dieUsed);
        if (dIdx !== -1) nextDice.splice(dIdx, 1);
      }

      if (anyHit) {
        playHitBlotSound();
      } else {
        playCheckerSound();
      }

      const newMovesPlayed = [...movesPlayed, ...newlyPlayed];
      setBoardState(currentBoard);
      setRemainingDice(nextDice);
      setSelectedPoint(null);
      setMovesPlayed(newMovesPlayed);

      // If turn is finished, evaluate
      if (nextDice.length === 0 || getAvailableMoves(currentBoard, nextDice, currentPuzzle.playerTurn).length === 0) {
        const isBest = evaluateMoveSuccess(newMovesPlayed, currentBoard, nextDice);
        if (isBest) {
          setEvaluationResult('best');
          playSuccessSound();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } else {
          setEvaluationResult('blunder');
        }
      }
      return;
    }

    const move: SingleStepMove = {
      from: selectedPoint,
      to,
      dieUsed,
    };

    const { newBoard, hit } = applyMove(boardState, move, currentPuzzle.playerTurn);
    if (hit) {
      playHitBlotSound();
    } else {
      playCheckerSound();
    }

    const nextDice = [...remainingDice];
    const dieIdx = nextDice.indexOf(dieUsed);
    if (dieIdx !== -1) nextDice.splice(dieIdx, 1);

    const newMovesPlayed = [...movesPlayed, move];
    setBoardState(newBoard);
    setRemainingDice(nextDice);
    setSelectedPoint(null);
    setMovesPlayed(newMovesPlayed);

    // If turn is finished, evaluate
    if (nextDice.length === 0 || getAvailableMoves(newBoard, nextDice, currentPuzzle.playerTurn).length === 0) {
      const isBest = evaluateMoveSuccess(newMovesPlayed, newBoard, nextDice);
      if (isBest) {
        setEvaluationResult('best');
        playSuccessSound();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        setEvaluationResult('blunder');
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Puzzles horizontal selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {BACKGAMMON_PUZZLES.map((puzzle, idx) => {
          const isSelected = selectedPuzzleIdx === idx;
          return (
            <button
              key={puzzle.id}
              onClick={() => loadPuzzle(idx)}
              className={`px-4 py-2 rounded-2xl border font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow scale-105'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
              }`}
            >
              <span>{puzzle.title}</span>
              <span className="px-1.5 py-0.2 bg-stone-950/60 rounded text-[10px] opacity-75">
                {puzzle.difficulty}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Puzzle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between p-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-stone-200">
                {currentPuzzle.title} ({currentPuzzle.category})
              </span>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-stone-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Спробувати знову</span>
            </button>
          </div>

          <BackgammonBoard
            board={boardState}
            selectedPoint={selectedPoint}
            availableMoves={availableMoves}
            onSelectPoint={(p) => setSelectedPoint(p)}
            onSelectTarget={handleSelectTarget}
            playerTurn={currentPuzzle.playerTurn}
            isInteractive={evaluationResult === null}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800">
            <DiceRoller
              diceState={{
                currentDice: currentPuzzle.dice,
                remainingDice,
                hasRolled: true,
                isRolling: false,
              }}
              onRoll={() => {}}
              playerTurn={currentPuzzle.playerTurn}
              isAiTurn={false}
              disabled={true}
            />

            {evaluationResult === 'best' && selectedPuzzleIdx < BACKGAMMON_PUZZLES.length - 1 && (
              <button
                onClick={() => loadPuzzle(selectedPuzzleIdx + 1)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
              >
                <span>Наступна задача</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Puzzle Explanation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl p-5 border border-stone-800 shadow-xl space-y-4">
            <div>
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                Тактична позиція
              </span>
              <h3 className="text-lg font-black text-stone-100 mt-0.5">
                {currentPuzzle.scenario}
              </h3>
            </div>

            {/* Strategic concept */}
            <div className="p-3.5 bg-stone-950/80 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Стратегічна концепція:</span>
              </div>
              <p>{currentPuzzle.strategicConcept}</p>
            </div>

            {/* Result banners */}
            <AnimatePresence>
              {evaluationResult === 'best' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-950/80 border-2 border-emerald-500/50 rounded-2xl text-xs space-y-2"
                >
                  <div className="font-black text-emerald-300 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Блискучий хід! (Best Move)</span>
                  </div>
                  <p className="text-emerald-100 leading-relaxed">
                    {currentPuzzle.explanationBest}
                  </p>
                </motion.div>
              )}

              {evaluationResult === 'blunder' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-950/80 border-2 border-red-500/50 rounded-2xl text-xs space-y-2"
                >
                  <div className="font-black text-red-400 flex items-center gap-2 text-sm">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span>Не найкращий хід (Помилка)</span>
                  </div>
                  <p className="text-red-100 leading-relaxed">
                    {currentPuzzle.blunderExplanation}
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-2 w-full py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-xl transition-colors border border-stone-700"
                  >
                    Спробувати знайти правильний хід ↺
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
