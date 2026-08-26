import React, { useState, useEffect } from 'react';
import { GameMode } from './types/backgammon';
import { Navbar } from './components/Navbar';
import { GameView } from './components/Game/GameView';
import { LessonsView } from './components/Lessons/LessonsView';
import { PuzzlesView } from './components/Puzzles/PuzzlesView';
import { ProbabilityLab } from './components/Probability/ProbabilityLab';
import { RulesGuide } from './components/Rules/RulesGuide';

const TAB_STORAGE_KEY = 'backgammon_active_tab_v1';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (
        saved &&
        ['free_play', 'lessons', 'puzzles', 'probabilities', 'rules'].includes(saved)
      ) {
        return saved as GameMode;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'free_play';
  });

  useEffect(() => {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, currentMode);
    } catch {
      // Ignore localStorage errors
    }
  }, [currentMode]);

  return (
    <div className="min-h-screen bg-[#130b07] bg-radial-[at_top_center] from-[#2a170f] via-[#150c08] to-[#0a0503] text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Header */}
      <Navbar currentMode={currentMode} onSelectMode={setCurrentMode} />

      {/* Main Content Area - keep views mounted to preserve interaction states and UI scroll seamlessly */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 flex flex-col items-center justify-start">
        <div className={currentMode === 'free_play' ? 'w-full' : 'hidden'}>
          <GameView />
        </div>
        <div className={currentMode === 'lessons' ? 'w-full' : 'hidden'}>
          <LessonsView />
        </div>
        <div className={currentMode === 'puzzles' ? 'w-full' : 'hidden'}>
          <PuzzlesView />
        </div>
        <div className={currentMode === 'probabilities' ? 'w-full' : 'hidden'}>
          <ProbabilityLab />
        </div>
        <div className={currentMode === 'rules' ? 'w-full' : 'hidden'}>
          <RulesGuide />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-stone-900 bg-stone-950/80 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Нарди: Навчання та Стратегія • Тренажер та ШІ-Гросмейстер</span>
          <span className="text-stone-400">
            Опановуйте правила, розраховуйте ризики та вигравайте за допомогою теорії ймовірностей!
          </span>
        </div>
      </footer>
    </div>
  );
}
