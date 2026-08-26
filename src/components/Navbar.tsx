import React from 'react';
import { GameMode } from '../types/backgammon';
import {
  Gamepad2,
  GraduationCap,
  Brain,
  Calculator,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentMode, onSelectMode }) => {
  const navItems: { mode: GameMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'free_play',
      label: 'Гра з Тренером',
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    {
      mode: 'lessons',
      label: 'Уроки та База',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      mode: 'puzzles',
      label: 'Тактичні Задачі',
      icon: <Brain className="w-4 h-4" />,
    },
    {
      mode: 'probabilities',
      label: 'Ймовірності кидків',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      mode: 'rules',
      label: 'Правила гри',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-950/85 backdrop-blur-xl border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20 font-black text-lg">
            ⚄
          </div>
          <div>
            <h1 className="text-base font-black text-amber-300 tracking-tight flex items-center gap-1.5">
              <span>Нарди: Навчання & Стратегія</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-medium">
              Інтерактивна Академія Коротких Нард
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-2xl border border-stone-800 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = currentMode === item.mode;
            return (
              <button
                key={item.mode}
                id={`nav-tab-${item.mode}`}
                onClick={() => onSelectMode(item.mode)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md scale-105'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
