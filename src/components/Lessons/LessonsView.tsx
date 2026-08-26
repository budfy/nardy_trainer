import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { BACKGAMMON_LESSONS } from '../../data/lessonsData';
import { AvailableMoveOption, BoardState, Lesson, LessonStep, SingleStepMove } from '../../types/backgammon';
import { BackgammonBoard } from '../Board/BackgammonBoard';
import { DiceRoller } from '../Board/DiceRoller';
import {
  applyMove,
  areBoardsEqual,
  cloneBoard,
  getAvailableMoves,
} from '../../utils/backgammonEngine';
import {
  playCheckerSound,
  playHitBlotSound,
  playSuccessSound,
} from '../../utils/audioFx';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Trophy,
  Tag,
} from 'lucide-react';

const LESSONS_STORAGE_KEY = 'backgammon_lessons_state_v1';

interface SavedLessonsState {
  selectedLessonIndex?: number;
  currentStepIndex?: number;
  completedStepIds?: string[];
  boardState?: BoardState;
  remainingDice?: number[];
  selectedPoint?: number | 'bar' | null;
  isStepCompleted?: boolean;
  stepMovesPlayed?: SingleStepMove[];
}

const getSavedLessonsState = (): SavedLessonsState | null => {
  try {
    const raw = localStorage.getItem(LESSONS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedLessonsState;
  } catch {
    return null;
  }
};

export const LessonsView: React.FC = () => {
  const savedState = useRef(getSavedLessonsState()).current;

  const initialLessonIndex =
    typeof savedState?.selectedLessonIndex === 'number' &&
    savedState.selectedLessonIndex >= 0 &&
    savedState.selectedLessonIndex < BACKGAMMON_LESSONS.length
      ? savedState.selectedLessonIndex
      : 0;

  const initialLesson = BACKGAMMON_LESSONS[initialLessonIndex];

  const initialStepIndex =
    typeof savedState?.currentStepIndex === 'number' &&
    savedState.currentStepIndex >= 0 &&
    savedState.currentStepIndex < initialLesson.steps.length
      ? savedState.currentStepIndex
      : 0;

  const initialStep = initialLesson.steps[initialStepIndex];

  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(initialLessonIndex);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    () => new Set(savedState?.completedStepIds || [])
  );

  const currentLesson: Lesson = BACKGAMMON_LESSONS[selectedLessonIndex] || BACKGAMMON_LESSONS[0];
  const currentStep: LessonStep = currentLesson.steps[currentStepIndex] || currentLesson.steps[0];

  // Interactive board state for the current step
  const [boardState, setBoardState] = useState<BoardState>(
    () => savedState?.boardState || cloneBoard(initialStep.boardSetup)
  );
  const [remainingDice, setRemainingDice] = useState<number[]>(
    () => savedState?.remainingDice || [...initialStep.dice]
  );
  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(
    () => savedState?.selectedPoint ?? null
  );
  const [isStepCompleted, setIsStepCompleted] = useState<boolean>(
    () => savedState?.isStepCompleted ?? false
  );
  const [stepMovesPlayed, setStepMovesPlayed] = useState<SingleStepMove[]>(
    () => savedState?.stepMovesPlayed || []
  );

  // Persist lessons state to localStorage
  useEffect(() => {
    try {
      const stateToSave: SavedLessonsState = {
        selectedLessonIndex,
        currentStepIndex,
        completedStepIds: Array.from(completedSteps),
        boardState,
        remainingDice,
        selectedPoint,
        isStepCompleted,
        stepMovesPlayed,
      };
      localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore quota errors
    }
  }, [
    selectedLessonIndex,
    currentStepIndex,
    completedSteps,
    boardState,
    remainingDice,
    selectedPoint,
    isStepCompleted,
    stepMovesPlayed,
  ]);

  // Reset board when changing step or lesson
  const loadStep = (step: LessonStep) => {
    setBoardState(cloneBoard(step.boardSetup));
    setRemainingDice([...step.dice]);
    setSelectedPoint(null);
    setIsStepCompleted(false);
    setStepMovesPlayed([]);
  };

  const handleSelectLesson = (idx: number) => {
    setSelectedLessonIndex(idx);
    setCurrentStepIndex(0);
    loadStep(BACKGAMMON_LESSONS[idx].steps[0]);
  };

  const handleSelectStep = (stepIdx: number) => {
    setCurrentStepIndex(stepIdx);
    loadStep(currentLesson.steps[stepIdx]);
  };

  const handleResetStep = () => {
    loadStep(currentStep);
  };

  const availableMoves = getAvailableMoves(
    boardState,
    remainingDice,
    currentStep.playerTurn
  );

  const handleSelectTarget = (to: number | 'off', dieUsed: number, moveOption?: AvailableMoveOption) => {
    if (!selectedPoint) return;

    if (moveOption?.isCombined && moveOption.steps && moveOption.steps.length > 0) {
      let currentBoard = boardState;
      let anyHit = false;
      const nextDice = [...remainingDice];
      const newlyPlayed: SingleStepMove[] = [];

      for (const step of moveOption.steps) {
        const { newBoard, hit } = applyMove(currentBoard, step, currentStep.playerTurn);
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

      const newMovesPlayed = [...stepMovesPlayed, ...newlyPlayed];
      setBoardState(currentBoard);
      setRemainingDice(nextDice);
      setSelectedPoint(null);
      setStepMovesPlayed(newMovesPlayed);

      // Verify if step goal is met
      if (currentStep.targetMove && !isStepCompleted) {
        let isMatch = false;
        let expectedBoard = cloneBoard(currentStep.boardSetup);
        for (const expMove of currentStep.targetMove) {
          const res = applyMove(expectedBoard, expMove, currentStep.playerTurn);
          expectedBoard = res.newBoard;
        }
        if (areBoardsEqual(currentBoard, expectedBoard)) {
          isMatch = true;
        }

        if (isMatch) {
          setIsStepCompleted(true);
          playSuccessSound();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
          setCompletedSteps((prev) => new Set(prev).add(currentStep.id));
        }
      }
      return;
    }

    const move: SingleStepMove = {
      from: selectedPoint,
      to,
      dieUsed,
    };

    const { newBoard, hit } = applyMove(boardState, move, currentStep.playerTurn);
    if (hit) {
      playHitBlotSound();
    } else {
      playCheckerSound();
    }

    // Update remaining dice
    const nextDice = [...remainingDice];
    const dieIdx = nextDice.indexOf(dieUsed);
    if (dieIdx !== -1) nextDice.splice(dieIdx, 1);

    const newMovesPlayed = [...stepMovesPlayed, move];

    setBoardState(newBoard);
    setRemainingDice(nextDice);
    setSelectedPoint(null);
    setStepMovesPlayed(newMovesPlayed);

    // Verify if step goal is met
    if (currentStep.targetMove && !isStepCompleted) {
      let isMatch = false;

      // 1. Multiset move matching
      const remainingTargets = [...currentStep.targetMove];
      for (const played of newMovesPlayed) {
        const matchIdx = remainingTargets.findIndex(
          (t) =>
            t.from === played.from &&
            t.to === played.to &&
            t.dieUsed === played.dieUsed
        );
        if (matchIdx !== -1) {
          remainingTargets.splice(matchIdx, 1);
        }
      }
      if (remainingTargets.length === 0) {
        isMatch = true;
      }

      // 2. Resulting board state comparison fallback
      if (!isMatch) {
        let expectedBoard = cloneBoard(currentStep.boardSetup);
        for (const expMove of currentStep.targetMove) {
          const res = applyMove(expectedBoard, expMove, currentStep.playerTurn);
          expectedBoard = res.newBoard;
        }
        if (areBoardsEqual(newBoard, expectedBoard)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        setIsStepCompleted(true);
        playSuccessSound();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        setCompletedSteps((prev) => new Set(prev).add(currentStep.id));
      }
    }
  };

  const [showAllCompletedModal, setShowAllCompletedModal] = useState<boolean>(false);
  const [showTacticalLabels, setShowTacticalLabels] = useState<boolean>(true);

  const handleNextStep = () => {
    if (currentStepIndex < currentLesson.steps.length - 1) {
      handleSelectStep(currentStepIndex + 1);
    } else if (selectedLessonIndex < BACKGAMMON_LESSONS.length - 1) {
      handleSelectLesson(selectedLessonIndex + 1);
    } else {
      setShowAllCompletedModal(true);
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  };

  const nextLesson = selectedLessonIndex < BACKGAMMON_LESSONS.length - 1
    ? BACKGAMMON_LESSONS[selectedLessonIndex + 1]
    : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top lesson selector pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {BACKGAMMON_LESSONS.map((lesson, idx) => {
          const isSelected = selectedLessonIndex === idx;
          const isLessonFinished = lesson.steps.every((s) => completedSteps.has(s.id));

          return (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(idx)}
              className={`px-4 py-2.5 rounded-2xl border font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg scale-105'
                  : isLessonFinished
                  ? 'bg-stone-900/90 text-emerald-300 border-emerald-500/40 hover:bg-stone-800'
                  : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:bg-stone-800'
              }`}
            >
              <span>{lesson.level}. {lesson.title}</span>
              {isLessonFinished && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Main Lesson Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Board */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {currentLesson.category}
              </span>
              <span className="text-xs text-stone-500">•</span>
              <span className="text-xs text-stone-300 font-semibold">
                Крок {currentStepIndex + 1} з {currentLesson.steps.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTacticalLabels(!showTacticalLabels)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                  showTacticalLabels
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
                title="Увімкнути/вимкнути наочні підписи елементів"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Підписи позицій: {showTacticalLabels ? 'УВІМК' : 'ВИМК'}</span>
              </button>

              <button
                onClick={handleResetStep}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-stone-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Скинути крок</span>
              </button>
            </div>
          </div>

          {/* Interactive Backgammon Board */}
          <BackgammonBoard
            board={boardState}
            selectedPoint={selectedPoint}
            availableMoves={availableMoves}
            onSelectPoint={(p) => setSelectedPoint(p)}
            onSelectTarget={handleSelectTarget}
            playerTurn={currentStep.playerTurn}
            isInteractive={!isStepCompleted}
            annotations={currentStep.customAnnotations}
            showTacticalLabels={showTacticalLabels}
          />

          {/* Tactical Elements Legend */}
          {showTacticalLabels && (
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-stone-900/60 rounded-xl border border-stone-800/80 text-[11px] text-stone-300">
              <span className="font-bold text-amber-400">Наочні позначки:</span>
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/30">⚓ Анкер (Захист)</span>
              <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-500/30">🎯 Блот (Вразливий)</span>
              <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">🧱 Прайм (Стіна)</span>
              <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-500/30">⭐ Золотий пункт</span>
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">🏁 Зняття / Bear-off</span>
            </div>
          )}

          {/* Dice & Step Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800">
            <div className="flex items-center gap-3">
              <DiceRoller
                diceState={{
                  currentDice: currentStep.dice,
                  remainingDice,
                  hasRolled: true,
                  isRolling: false,
                }}
                onRoll={() => {}}
                playerTurn={currentStep.playerTurn}
                isAiTurn={false}
                disabled={true}
              />
            </div>

            {isStepCompleted && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>
                  {currentStepIndex < currentLesson.steps.length - 1
                    ? `Наступний крок (${currentStepIndex + 2}/${currentLesson.steps.length})`
                    : nextLesson
                    ? `До наступного розділу: ${nextLesson.level}. ${nextLesson.title}`
                    : 'Усі уроки завершено! 🎉'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Right Explanation & Instructions Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Step Task Card */}
          <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl p-5 border border-stone-800 shadow-xl space-y-4">
            <div>
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                Завдання
              </span>
              <h3 className="text-lg font-black text-stone-100 mt-0.5">
                {currentStep.title}
              </h3>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-200 leading-relaxed">
              👉 {currentStep.instruction}
            </div>

            {/* Theory explanation */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Теорія та правила гри:</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed whitespace-pre-line">
                {currentStep.theory}
              </p>
            </div>

            {/* Key rule banner */}
            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ключове правило:</span>
              </div>
              <p className="text-stone-400">{currentStep.keyRule}</p>
            </div>

            {/* Success Feedback Banner */}
            <AnimatePresence>
              {isStepCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-950/70 border-2 border-emerald-500/50 rounded-2xl text-xs space-y-2"
                >
                  <div className="font-black text-emerald-300 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Завдання виконано ідеально!</span>
                  </div>
                  <p className="text-emerald-100 leading-relaxed">
                    {currentStep.explanationOnSuccess}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint toggle */}
            {!isStepCompleted && currentStep.hint && (
              <div className="p-3 bg-stone-950/40 rounded-xl border border-stone-800/80 text-xs text-stone-400 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Підказка:</strong> {currentStep.hint}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grand Completion Modal */}
      <AnimatePresence>
        {showAllCompletedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-amber-400">
                Курс Нард Завершено!
              </h2>

              <p className="text-sm text-stone-300 leading-relaxed">
                Вітаємо! Ви успішно освоїли всі 6 розділів: від базового руху шашок та вибивання блотів до замикання 6-пунктових праймів, побудови золотих точок, зняття шашок та видів перемоги Марс і Кокс!
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setShowAllCompletedModal(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl transition-transform active:scale-95 cursor-pointer shadow-lg"
                >
                  Продовжити практику 🎓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
