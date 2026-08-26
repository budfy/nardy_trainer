import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  AIDifficulty,
  AvailableMoveOption,
  BoardState,
  CoachingMode,
  CoachMasteryLevel,
  DiceState,
  PlayerColor,
  SingleStepMove,
  TurnHistoryItem,
} from '../../types/backgammon';
import { BackgammonBoard } from '../Board/BackgammonBoard';
import { DiceRoller } from '../Board/DiceRoller';
import { PipCounter } from '../Board/PipCounter';
import { CoachDrawer } from '../Coach/CoachDrawer';
import {
  applyMove,
  calculatePipCount,
  checkWinCondition,
  cloneBoard,
  createInitialBoard,
  getAvailableMoves,
} from '../../utils/backgammonEngine';
import {
  evaluatePlayerMoveQuality,
  findBestTurnMoves,
} from '../../utils/aiOpponent';
import {
  playCheckerSound,
  playDiceRollSound,
  playHitBlotSound,
  playSuccessSound,
} from '../../utils/audioFx';
import {
  Bot,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Lightbulb,
  Award,
  History,
  Eye,
  Sliders,
  ChevronRight,
  GraduationCap,
  Flame,
  Zap,
  Crown,
} from 'lucide-react';

const GAME_STORAGE_KEY = 'backgammon_game_state_v2';

interface SavedGameState {
  boardState?: BoardState;
  turnHistory?: TurnHistoryItem[];
  playerTurn?: PlayerColor;
  difficulty?: AIDifficulty;
  diceState?: DiceState;
  selectedPoint?: number | 'bar' | null;
  movesInCurrentTurn?: SingleStepMove[];
  boardAtTurnStart?: BoardState;
  showRisks?: boolean;
  showHints?: boolean;
  isCoachOpen?: boolean;
  lastMoveAnalysis?: TurnHistoryItem['analysis'];
  coachHint?: string | null;
  coachingMode?: CoachingMode;
  bestMoveStreak?: number;
  totalEvaluatedMoves?: number;
  optimalMovesCount?: number;
  gameOverInfo?: {
    isGameOver: boolean;
    winner: PlayerColor | null;
    winType: string | null;
    description: string;
  };
}

const getSavedGameState = (): SavedGameState | null => {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedGameState;
  } catch {
    return null;
  }
};

export const GameView: React.FC = () => {
  const savedState = useRef(getSavedGameState()).current;

  const [boardState, setBoardState] = useState<BoardState>(() => savedState?.boardState || createInitialBoard());
  const [turnHistory, setTurnHistory] = useState<TurnHistoryItem[]>(() => savedState?.turnHistory || []);
  const [playerTurn, setPlayerTurn] = useState<PlayerColor>(() => savedState?.playerTurn || 'white');
  const [difficulty, setDifficulty] = useState<AIDifficulty>(() => savedState?.difficulty || 'intermediate');

  const [diceState, setDiceState] = useState<DiceState>(() => savedState?.diceState || {
    currentDice: [],
    remainingDice: [],
    hasRolled: false,
    isRolling: false,
  });

  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(() => savedState?.selectedPoint ?? null);
  const [movesInCurrentTurn, setMovesInCurrentTurn] = useState<SingleStepMove[]>(() => savedState?.movesInCurrentTurn || []);
  const [boardAtTurnStart, setBoardAtTurnStart] = useState<BoardState>(() => savedState?.boardAtTurnStart || createInitialBoard());

  // Assistant, Coaching & Mastery Toggles
  const [coachingMode, setCoachingMode] = useState<CoachingMode>(() => savedState?.coachingMode || 'adaptive');
  const [bestMoveStreak, setBestMoveStreak] = useState<number>(() => savedState?.bestMoveStreak || 0);
  const [totalEvaluatedMoves, setTotalEvaluatedMoves] = useState<number>(() => savedState?.totalEvaluatedMoves || 0);
  const [optimalMovesCount, setOptimalMovesCount] = useState<number>(() => savedState?.optimalMovesCount || 0);
  const [levelUpToast, setLevelUpToast] = useState<string | null>(null);

  const [showRisks, setShowRisks] = useState<boolean>(() => savedState?.showRisks ?? true);
  const [showHints, setShowHints] = useState<boolean>(() => savedState?.showHints ?? false);
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(() => savedState?.isCoachOpen ?? false);
  const [lastMoveAnalysis, setLastMoveAnalysis] = useState<TurnHistoryItem['analysis']>(() => savedState?.lastMoveAnalysis);
  const [coachHint, setCoachHint] = useState<string | null>(() => savedState?.coachHint ?? null);

  // Computed player mastery stage based on performance
  const accuracyPercent = totalEvaluatedMoves > 0
    ? Math.round((optimalMovesCount / totalEvaluatedMoves) * 100)
    : 100;

  const masteryLevel: CoachMasteryLevel =
    bestMoveStreak >= 5 || (totalEvaluatedMoves >= 5 && accuracyPercent >= 85)
      ? 'master'
      : bestMoveStreak >= 2 || (totalEvaluatedMoves >= 2 && accuracyPercent >= 65)
      ? 'tactician'
      : 'beginner';

  // Game over state
  const [gameOverInfo, setGameOverInfo] = useState<{
    isGameOver: boolean;
    winner: PlayerColor | null;
    winType: string | null;
    description: string;
  }>(() => savedState?.gameOverInfo || {
    isGameOver: false,
    winner: null,
    winType: null,
    description: '',
  });

  // Persist game state on change
  useEffect(() => {
    try {
      const stateToSave: SavedGameState = {
        boardState,
        turnHistory,
        playerTurn,
        difficulty,
        diceState,
        selectedPoint,
        movesInCurrentTurn,
        boardAtTurnStart,
        showRisks,
        showHints,
        isCoachOpen,
        lastMoveAnalysis,
        coachHint,
        coachingMode,
        bestMoveStreak,
        totalEvaluatedMoves,
        optimalMovesCount,
        gameOverInfo,
      };
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore localStorage write quota errors
    }
  }, [
    boardState,
    turnHistory,
    playerTurn,
    difficulty,
    diceState,
    selectedPoint,
    movesInCurrentTurn,
    boardAtTurnStart,
    showRisks,
    showHints,
    isCoachOpen,
    lastMoveAnalysis,
    coachHint,
    coachingMode,
    bestMoveStreak,
    totalEvaluatedMoves,
    optimalMovesCount,
    gameOverInfo,
  ]);

  const isAiTurn = playerTurn === 'black';

  // Compute available legal moves for current player and remaining dice
  const availableMoves = !isAiTurn && diceState.hasRolled
    ? getAvailableMoves(boardState, diceState.remainingDice, 'white')
    : [];

  // Roll dice for player
  const handleRollDice = () => {
    if (diceState.isRolling || diceState.hasRolled || isAiTurn) return;

    setDiceState((prev) => ({ ...prev, isRolling: true }));
    playDiceRollSound();

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const isDouble = d1 === d2;
      const remaining = isDouble ? [d1, d1, d1, d1] : [d1, d2];

      setDiceState({
        currentDice: [d1, d2],
        remainingDice: remaining,
        hasRolled: true,
        isRolling: false,
      });

      setBoardAtTurnStart(cloneBoard(boardState));
      setMovesInCurrentTurn([]);

      // Check if player has any moves
      const moves = getAvailableMoves(boardState, remaining, 'white');
      if (moves.length === 0) {
        // No legal moves, pass turn after brief moment
        setTimeout(() => {
          endTurn('white', []);
        }, 1500);
      }
    }, 600);
  };

  // Select target to execute checker move (handles single or compound moves)
  const handleSelectTarget = (
    to: number | 'off',
    dieUsed: number,
    moveOption?: AvailableMoveOption
  ) => {
    if (!selectedPoint || isAiTurn) return;

    if (moveOption?.isCombined && moveOption.steps && moveOption.steps.length > 0) {
      // Execute multi-step atomic sequence for 2+ dice at once
      let currentBoard = boardState;
      let anyHit = false;
      const nextDice = [...diceState.remainingDice];
      const newlyAddedMoves: SingleStepMove[] = [];

      for (const step of moveOption.steps) {
        const { newBoard, hit } = applyMove(currentBoard, step, 'white');
        if (hit) anyHit = true;
        currentBoard = newBoard;
        newlyAddedMoves.push(step);

        const dIdx = nextDice.indexOf(step.dieUsed);
        if (dIdx !== -1) nextDice.splice(dIdx, 1);
      }

      if (anyHit) {
        playHitBlotSound();
      } else {
        playCheckerSound();
      }

      const newMovesInTurn = [...movesInCurrentTurn, ...newlyAddedMoves];

      setBoardState(currentBoard);
      setDiceState((prev) => ({
        ...prev,
        remainingDice: nextDice,
      }));
      setSelectedPoint(null);
      setMovesInCurrentTurn(newMovesInTurn);

      // Check if game won
      const winCheck = checkWinCondition(currentBoard);
      if (winCheck.isGameOver) {
        setGameOverInfo(winCheck);
        playSuccessSound();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        return;
      }

      // Check if turn ended
      const nextAvailable = getAvailableMoves(currentBoard, nextDice, 'white');
      if (nextDice.length === 0 || nextAvailable.length === 0) {
        setTimeout(() => {
          endTurn('white', newMovesInTurn);
        }, 500);
      }
      return;
    }

    const move: SingleStepMove = {
      from: selectedPoint,
      to,
      dieUsed,
    };

    const { newBoard, hit } = applyMove(boardState, move, 'white');
    if (hit) {
      playHitBlotSound();
    } else {
      playCheckerSound();
    }

    const nextDice = [...diceState.remainingDice];
    const dieIdx = nextDice.indexOf(dieUsed);
    if (dieIdx !== -1) nextDice.splice(dieIdx, 1);

    const newMovesInTurn = [...movesInCurrentTurn, move];

    setBoardState(newBoard);
    setDiceState((prev) => ({
      ...prev,
      remainingDice: nextDice,
    }));
    setSelectedPoint(null);
    setMovesInCurrentTurn(newMovesInTurn);

    // Check if game won
    const winCheck = checkWinCondition(newBoard);
    if (winCheck.isGameOver) {
      setGameOverInfo(winCheck);
      playSuccessSound();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      return;
    }

    // Check if turn ended (no remaining dice OR no legal moves left)
    const nextAvailable = getAvailableMoves(newBoard, nextDice, 'white');
    if (nextDice.length === 0 || nextAvailable.length === 0) {
      setTimeout(() => {
        endTurn('white', newMovesInTurn);
      }, 500);
    }
  };

  // End turn & trigger AI evaluation + switch turn + update progressive mastery
  const endTurn = async (
    player: PlayerColor,
    turnMoves: SingleStepMove[]
  ) => {
    const pipBefore = calculatePipCount(boardAtTurnStart);
    const pipAfter = calculatePipCount(boardState);

    let analysis: TurnHistoryItem['analysis'] = undefined;

    if (player === 'white' && turnMoves.length > 0) {
      // Evaluate player move quality
      const qualityEval = evaluatePlayerMoveQuality(
        boardAtTurnStart,
        diceState.currentDice,
        turnMoves,
        'white'
      );

      analysis = {
        quality: qualityEval.quality,
        summary: qualityEval.summary,
        aiAdvice: qualityEval.advice,
      };

      setLastMoveAnalysis(analysis);

      // Update progressive mastery tracker
      setTotalEvaluatedMoves((prev) => prev + 1);
      if (qualityEval.quality === 'best' || qualityEval.quality === 'great') {
        setOptimalMovesCount((prev) => prev + 1);
        setBestMoveStreak((prev) => {
          const nextStreak = prev + 1;
          if (nextStreak === 3 && coachingMode === 'adaptive') {
            setLevelUpToast('⚡ Рівень Майстерності: Тактик! Підказки тепер переходять у стратегічні орієнтири.');
            setTimeout(() => setLevelUpToast(null), 5000);
          } else if (nextStreak === 6 && coachingMode === 'adaptive') {
            setLevelUpToast('👑 Рівень Майстерності: Гросмейстер! Прямі підказки згорнуто для самостійної гри.');
            setTimeout(() => setLevelUpToast(null), 5000);
          }
          return nextStreak;
        });
      } else if (qualityEval.quality === 'good') {
        // Keep streak
      } else {
        // Reset streak on blunder/inaccuracy
        setBestMoveStreak(0);
      }

      // Async fetch deeper Gemini explanation if user wants
      fetch('/api/coach/analyze-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardState: boardState.points,
          dice: diceState.currentDice,
          moveMade: turnMoves,
          isWhiteTurn: true,
          pipCounts: pipAfter,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.analysis) {
            setLastMoveAnalysis((prev) =>
              prev ? { ...prev, aiAdvice: data.analysis } : prev
            );
          }
        })
        .catch(() => {});
    }

    const historyItem: TurnHistoryItem = {
      player,
      dice: [...diceState.currentDice],
      steps: turnMoves.map((m) => ({
        from: m.from,
        to: m.to,
        dieUsed: m.dieUsed,
        hitOpponentBlot: !!m.isHit,
      })),
      timestamp: Date.now(),
      pipBefore,
      pipAfter,
      analysis,
    };

    setTurnHistory((prev) => [historyItem, ...prev]);

    // Reset dice state
    setDiceState({
      currentDice: [],
      remainingDice: [],
      hasRolled: false,
      isRolling: false,
    });
    setMovesInCurrentTurn([]);
    setSelectedPoint(null);
    setCoachHint(null);

    // Switch turn to opponent
    const nextPlayer = player === 'white' ? 'black' : 'white';
    setPlayerTurn(nextPlayer);
  };

  // AI Turn handler (Black)
  useEffect(() => {
    if (playerTurn !== 'black' || gameOverInfo.isGameOver) return;

    let isMounted = true;

    const runAiTurn = async () => {
      // 1. Roll dice for AI
      setDiceState((prev) => ({ ...prev, isRolling: true }));
      playDiceRollSound();
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const isDouble = d1 === d2;
      const dice = isDouble ? [d1, d1, d1, d1] : [d1, d2];

      setDiceState({
        currentDice: [d1, d2],
        remainingDice: [...dice],
        hasRolled: true,
        isRolling: false,
      });

      setBoardAtTurnStart(cloneBoard(boardState));

      // 2. Find best moves
      const aiDecision = findBestTurnMoves(boardState, dice, 'black', difficulty);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // 3. Play each move step sequentially with animation
      let curr = cloneBoard(boardState);
      const playedSteps: SingleStepMove[] = [];

      for (const move of aiDecision.moves) {
        const res = applyMove(curr, move, 'black');
        curr = res.newBoard;
        playedSteps.push(move);
        if (res.hit) {
          playHitBlotSound();
        } else {
          playCheckerSound();
        }
        setBoardState(cloneBoard(curr));
        await new Promise((r) => setTimeout(r, 450));
        if (!isMounted) return;
      }

      // Check win for black
      const winCheck = checkWinCondition(curr);
      if (winCheck.isGameOver) {
        setGameOverInfo(winCheck);
        return;
      }

      // 4. End AI Turn
      endTurn('black', playedSteps);
    };

    runAiTurn();

    return () => {
      isMounted = false;
    };
  }, [playerTurn, gameOverInfo.isGameOver, difficulty]);

  // Request Coach Hint (Adaptive depending on mastery stage)
  const handleRequestHint = () => {
    if (!diceState.hasRolled || diceState.remainingDice.length === 0) return;
    const best = findBestTurnMoves(boardState, diceState.remainingDice, 'white', 'master');
    if (best.moves.length === 0) {
      setCoachHint('Немає можливих ходів для цього кидка.');
      return;
    }

    if (coachingMode === 'minimal') {
      setCoachHint(
        '🏆 Турнірний режим (без підказок): спробуйте знайти найкращий хід самостійно! Тренер оцінить ваше рішення після завершення ходу.'
      );
      return;
    }

    if (coachingMode === 'full') {
      setCoachHint(
        `💡 Рекомендований хід: ${best.moves
          .map((m) => `${m.from === 'bar' ? 'Бар' : m.from}/${m.to === 'off' ? 'Зняти' : m.to}`)
          .join(', ')} • ${best.summary}`
      );
      return;
    }

    // Adaptive Mode: hints fade progressively as mastery grows
    if (masteryLevel === 'beginner') {
      setCoachHint(
        `🌱 Повна підказка: ${best.moves
          .map((m) => `${m.from === 'bar' ? 'Бар' : m.from}/${m.to === 'off' ? 'Зняти' : m.to}`)
          .join(', ')} • ${best.summary}`
      );
    } else if (masteryLevel === 'tactician') {
      setCoachHint(
        `⚡ Тактичний орієнтир: ${best.summary} (Підказки стають концептуальними через ваш прогрес: знайдіть точні пункти самостійно!)`
      );
    } else {
      setCoachHint(
        `👑 Рівень Майстра (серія: ${bestMoveStreak} точних ходів): Прямі координати вимкнено. Стратегічний вектор: ${best.summary.split('.')[0] || 'посилення позиції'}. Довіртеся інтуїції!`
      );
    }
  };

  // Undo turn moves
  const handleUndoTurn = () => {
    if (movesInCurrentTurn.length === 0 || isAiTurn) return;
    setBoardState(cloneBoard(boardAtTurnStart));
    const isDouble =
      diceState.currentDice[0] === diceState.currentDice[1];
    setDiceState((prev) => ({
      ...prev,
      remainingDice: isDouble
        ? [diceState.currentDice[0], diceState.currentDice[0], diceState.currentDice[0], diceState.currentDice[0]]
        : [...diceState.currentDice],
    }));
    setMovesInCurrentTurn([]);
    setSelectedPoint(null);
  };

  // Reset / New Game
  const handleNewGame = () => {
    try {
      localStorage.removeItem(GAME_STORAGE_KEY);
    } catch {}
    const freshBoard = createInitialBoard();
    setBoardState(freshBoard);
    setBoardAtTurnStart(freshBoard);
    setTurnHistory([]);
    setPlayerTurn('white');
    setDiceState({
      currentDice: [],
      remainingDice: [],
      hasRolled: false,
      isRolling: false,
    });
    setMovesInCurrentTurn([]);
    setSelectedPoint(null);
    setGameOverInfo({
      isGameOver: false,
      winner: null,
      winType: null,
      description: '',
    });
    setLastMoveAnalysis(undefined);
    setCoachHint(null);
    setBestMoveStreak(0);
    setTotalEvaluatedMoves(0);
    setOptimalMovesCount(0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Bar: Pip counter & Game Controls */}
      <PipCounter board={boardState} playerTurn={playerTurn} />

      {/* Level-up notification toast */}
      <AnimatePresence>
        {levelUpToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl flex items-center justify-between border-2 border-amber-200"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin text-stone-950" />
              <span>{levelUpToast}</span>
            </div>
            <button
              onClick={() => setLevelUpToast(null)}
              className="px-2.5 py-1 bg-stone-950 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Зрозуміло
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Arena + Optional Coach Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Side: Game Board & Action Bar */}
        <div className="flex-1 w-full space-y-4">
          {/* Board Card */}
          <BackgammonBoard
            board={boardState}
            selectedPoint={selectedPoint}
            availableMoves={availableMoves}
            onSelectPoint={(p) => setSelectedPoint(p)}
            onSelectTarget={handleSelectTarget}
            playerTurn={playerTurn}
            showRisks={showRisks}
            isInteractive={!isAiTurn && diceState.hasRolled && !gameOverInfo.isGameOver}
          />

          {/* Progressive Coaching & Difficulty Control Bar */}
          <div className="p-3 bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-800 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Coach Adaptation Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-200">Рівень супроводу:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-black text-[11px] flex items-center gap-1 ${
                      masteryLevel === 'master'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : masteryLevel === 'tactician'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {masteryLevel === 'master' && <Crown className="w-3 h-3 text-purple-400" />}
                    {masteryLevel === 'tactician' && <Zap className="w-3 h-3 text-blue-400" />}
                    {masteryLevel === 'beginner' && <Sparkles className="w-3 h-3 text-emerald-400" />}
                    {masteryLevel === 'master'
                      ? 'Майстер (самостійна гра)'
                      : masteryLevel === 'tactician'
                      ? 'Тактик (орієнтири)'
                      : 'Учень (повні підказки)'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                  {bestMoveStreak > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {bestMoveStreak} точних підряд
                    </span>
                  )}
                  <span>
                    Точність: <strong className="text-stone-200">{accuracyPercent}%</strong>
                  </span>
                  {coachingMode === 'adaptive' && (
                    <span className="text-stone-400 hidden sm:inline">
                      • Підказки поступово зменшуються по мірі покращення гри
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Coaching Mode Selector */}
            <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setCoachingMode('adaptive')}
                title="Підказки поступово згасають при покращенні вашої гри"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  coachingMode === 'adaptive'
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Адаптивний (розумний)
              </button>
              <button
                onClick={() => setCoachingMode('full')}
                title="Завжди показувати повні підказки"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  coachingMode === 'full'
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Повний
              </button>
              <button
                onClick={() => setCoachingMode('minimal')}
                title="Турнірний режим без підказок"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  coachingMode === 'minimal'
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Турнір
              </button>
            </div>
          </div>

          {/* Action Bar & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-800 shadow-lg">
            {/* Dice and Roll button */}
            <DiceRoller
              diceState={diceState}
              onRoll={handleRollDice}
              playerTurn={playerTurn}
              isAiTurn={isAiTurn}
              disabled={gameOverInfo.isGameOver}
            />

            {/* Assistant Tools & Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Request hint */}
              <button
                onClick={handleRequestHint}
                disabled={!diceState.hasRolled || isAiTurn}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-stone-700 shadow-sm cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>
                  {coachingMode === 'minimal'
                    ? 'Підказки вимкнено'
                    : masteryLevel === 'master' && coachingMode === 'adaptive'
                    ? 'Порада Майстра'
                    : 'Підказка ходу'}
                </span>
              </button>

              {/* Undo move in current turn */}
              <button
                onClick={handleUndoTurn}
                disabled={movesInCurrentTurn.length === 0 || isAiTurn}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-stone-700 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Хід назад</span>
              </button>

              {/* Blot Risk Overlay Toggle */}
              <button
                onClick={() => setShowRisks(!showRisks)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border shadow-sm cursor-pointer ${
                  showRisks
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Аналіз ризику %</span>
              </button>

              {/* AI Coach Drawer Toggle */}
              <button
                onClick={() => setIsCoachOpen(!isCoachOpen)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isCoachOpen
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>ШІ-Тренер</span>
              </button>

              {/* AI Opponent Difficulty Selector */}
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}
                className="px-2.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                <option value="beginner">Суперник: Новачок</option>
                <option value="intermediate">Суперник: Клубний</option>
                <option value="master">Суперник: Гросмейстер</option>
              </select>

              {/* Restart game */}
              <button
                onClick={handleNewGame}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-bold transition-colors border border-stone-700 cursor-pointer"
              >
                Нова гра
              </button>
            </div>
          </div>

          {/* Coach Hint banner if triggered */}
          {coachHint && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-200 font-medium flex items-center justify-between"
            >
              <span>{coachHint}</span>
              <button
                onClick={() => setCoachHint(null)}
                className="text-amber-400 text-xs font-bold hover:underline ml-2"
              >
                Закрити
              </button>
            </motion.div>
          )}

          {/* Turn History Table (Accordion / List) */}
          {turnHistory.length > 0 && (
            <div className="bg-stone-900/70 rounded-2xl p-4 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Історія ходів та оцінки ШІ ({turnHistory.length})</span>
                </div>
                <span className="text-[11px] text-stone-500">Останні ходи</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {turnHistory.slice(0, 8).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-stone-950/60 rounded-xl border border-stone-800/80 flex flex-wrap items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.player === 'white' ? 'bg-amber-100' : 'bg-stone-700'
                        }`}
                      />
                      <span className="font-bold text-stone-300">
                        {item.player === 'white' ? 'Ви' : 'Компʼютер'}:
                      </span>
                      <span className="font-mono text-amber-400">
                        [{item.dice.join('-')}]
                      </span>
                      <span className="text-stone-300">
                        {item.steps.length > 0
                          ? item.steps
                              .map(
                                (s) =>
                                  `${s.from === 'bar' ? 'Бар' : s.from}/${
                                    s.to === 'off' ? 'Зняти' : s.to
                                  }${s.hitOpponentBlot ? '*' : ''}`
                              )
                              .join(', ')
                          : 'Пропуск'}
                      </span>
                    </div>

                    {item.analysis && (
                      <div className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            item.analysis.quality === 'best'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.analysis.quality === 'great'
                              ? 'bg-blue-500/20 text-blue-400'
                              : item.analysis.quality === 'good'
                              ? 'bg-amber-500/20 text-amber-400'
                              : item.analysis.quality === 'inaccurate'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.analysis.quality === 'best'
                            ? 'Найкращий'
                            : item.analysis.quality === 'great'
                            ? 'Сильний'
                            : item.analysis.quality === 'good'
                            ? 'Хороший'
                            : item.analysis.quality === 'inaccurate'
                            ? 'Неточність'
                            : 'Помилка'}
                        </span>
                        <span className="text-stone-400 hidden sm:inline">
                          {item.analysis.summary}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: AI Coach Assistant Drawer */}
        <CoachDrawer
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          lastMoveAnalysis={lastMoveAnalysis}
          gameContext={{
            pipCounts: calculatePipCount(boardState),
            playerTurn,
            difficulty,
            off: boardState.off,
            bar: boardState.bar,
          }}
        />
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOverInfo.isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl text-stone-100"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-amber-300">
                  {gameOverInfo.winner === 'white' ? '🎉 Вітаємо з перемогою!' : 'Компʼютер переміг'}
                </h3>
                <p className="text-sm text-stone-300 mt-1">{gameOverInfo.description}</p>
              </div>

              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-xs text-stone-400 space-y-1">
                <div>Знято шашок: Білі {boardState.off.white}/15 • Чорні {boardState.off.black}/15</div>
                <div>Загальна кількість ходів: {turnHistory.length}</div>
              </div>

              <button
                onClick={handleNewGame}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
              >
                Зіграти ще раз
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
