import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ALL_DICE_ROLLS,
  STANDARD_HIT_TABLE,
  calculateBarEntryOdds,
} from '../../utils/probabilities';
import {
  Calculator,
  Percent,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';

export const ProbabilityLab: React.FC = () => {
  const [selectedDistance, setSelectedDistance] = useState<number>(6);
  const [closedPointsForBar, setClosedPointsForBar] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<'hits' | 'bar' | 'matrix' | 'pip'>('hits');

  const selectedHitData =
    STANDARD_HIT_TABLE.find((d) => d.distance === selectedDistance) || {
      distance: selectedDistance,
      combinationsCount: 0,
      probabilityPercent: 0,
      exactRolls: ['Неможливо вибити одним кидком'],
      isDirect: false,
      tacticalNote: 'Потребує більше одного ходу.',
    };

  const barOdds = calculateBarEntryOdds(closedPointsForBar);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-300 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-400" />
            <span>Лабораторія ймовірностей та Математика кидків</span>
          </h2>
          <p className="text-sm text-stone-300 mt-1">
            Дізнайтеся математичні шанси будь-якого удару, ймовірність входу з бару та 36 комбінацій кубиків.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('hits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'hits'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Шанси удару</span>
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bar'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Вхід з Бару</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Матриця 36 кидків</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Hit Probability by Distance */}
      {activeTab === 'hits' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Distance selector */}
          <div className="lg:col-span-5 bg-stone-900/80 rounded-2xl p-4 border border-stone-800 space-y-4">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Оберіть відстань до блота (1–12 пунктів):</span>
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {STANDARD_HIT_TABLE.map((item) => (
                <button
                  key={item.distance}
                  onClick={() => setSelectedDistance(item.distance)}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all flex flex-col items-center justify-center ${
                    selectedDistance === item.distance
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg scale-105'
                      : item.isDirect
                      ? 'bg-stone-800/80 hover:bg-stone-700 text-stone-200 border-red-500/30'
                      : 'bg-stone-800/50 hover:bg-stone-700 text-stone-300 border-stone-700'
                  }`}
                >
                  <span className="text-base">{item.distance}</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selectedDistance === item.distance
                        ? 'text-stone-950'
                        : item.isDirect
                        ? 'text-red-400'
                        : 'text-stone-400'
                    }`}
                  >
                    {item.probabilityPercent}%
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Головне правило безпеки:</span>
              </div>
              <p>
                Прямі дистанції (<strong>1–6 пунктів</strong>) несуть колосальний ризик (від 30% до 47%). Непрямі (<strong>7+ пунктів</strong>) значно безпечніші (менше 17%). Якщо ви змушені залишити блот — краще на відстані 7 або 8, ніж на 6!
              </p>
            </div>
          </div>

          {/* Detailed analysis card */}
          <div className="lg:col-span-7 bg-stone-900/80 rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Відстань удару
                  </span>
                  <h4 className="text-2xl font-black text-amber-300">
                    {selectedHitData.distance} пунктів ({selectedHitData.isDirect ? 'Прямий удар' : 'Непрямий удар'})
                  </h4>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl font-black text-lg ${
                    selectedHitData.probabilityPercent > 35
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {selectedHitData.probabilityPercent}%
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="my-4 space-y-1">
                <div className="flex justify-between text-xs font-medium text-stone-400">
                  <span>Шанс потрапляння ({selectedHitData.combinationsCount} з 36 комбінацій)</span>
                  <span>{selectedHitData.probabilityPercent}%</span>
                </div>
                <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedHitData.probabilityPercent}%` }}
                    className={`h-full rounded-full ${
                      selectedHitData.probabilityPercent > 35
                        ? 'bg-gradient-to-r from-amber-500 to-red-500'
                        : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Tactical note */}
              <div className="p-3.5 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                <div className="text-xs font-bold text-stone-200">Тактичний аналіз:</div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {selectedHitData.tacticalNote}
                </p>
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-stone-400">Виграшні кидки:</span>
                  {selectedHitData.exactRolls.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-stone-800 rounded text-[11px] font-mono text-amber-300 border border-stone-700"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
              💡 <strong>Порада від Гросмейстера:</strong> Найнебезпечнішою відстанню в нардах є <strong>дистанція 6</strong> (17 з 36 кидків = 47.2% шанс удару). Ніколи не залишайте блот на відстані 6, якщо є інший вибір!
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bar Re-Entry Odds */}
      {activeTab === 'bar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-stone-900/80 rounded-2xl p-4 border border-stone-800 space-y-4">
            <h3 className="text-sm font-bold text-stone-200">
              Скільки пунктів закрито у домі супротивника?
            </h3>

            <div className="grid grid-cols-7 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((closed) => (
                <button
                  key={closed}
                  onClick={() => setClosedPointsForBar(closed)}
                  className={`p-3 rounded-xl text-center border font-bold transition-all flex flex-col items-center ${
                    closedPointsForBar === closed
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow scale-105'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  <span className="text-lg">{closed}</span>
                  <span className="text-[10px] opacity-75">закритих</span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-2">
              <div className="font-bold text-amber-300">Що таке закритий пункт?</div>
              <p>
                Пункт вважається закритим, якщо супротивник має на ньому 2 або більше шашок. На такий пункт не можна зайти з бару.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <span className="text-xs font-semibold text-stone-400">Шанс успішного входу з бару</span>
                <h4 className="text-2xl font-black text-amber-300">
                  {barOdds.openPoints} відкритих пунктів з 6
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">
                  {barOdds.entryChancePercent}%
                </span>
                <div className="text-[10px] text-stone-400 font-medium">успішний вхід</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                <div className="text-xs text-emerald-400 font-bold">Шанс повернутися:</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">
                  {barOdds.entryChancePercent}%
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  ({barOdds.hittingRolls} з 36 комбінацій)
                </div>
              </div>

              <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl">
                <div className="text-xs text-red-400 font-bold">Шанс застрягти на барі:</div>
                <div className="text-2xl font-black text-red-400 mt-1">
                  {barOdds.trapChancePercent}%
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  ({36 - barOdds.hittingRolls} з 36 комбінацій)
                </div>
              </div>
            </div>

            {closedPointsForBar === 6 && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span>
                  <strong>Full Prime (6 закритих пунктів):</strong> Вихід з бару неможливий (0% шанс)! Гравець автоматично пропускає ходи доти, доки суперник не відкриє хоча б один пункт.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Complete 36-Dice Roll Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200">
              Повна таблиця 36 рівноймовірних результатів кидка двох кубиків:
            </h3>
            <span className="text-xs text-amber-300 font-bold">Кожен кидок = 1/36 (~2.78%)</span>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            {ALL_DICE_ROLLS.map((roll, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-transform hover:scale-105 ${
                  roll.isDouble
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-black shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="font-mono text-sm">
                  {roll.d1}-{roll.d2}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">
                  {roll.isDouble ? 'Дубль (4x)' : `Сума: ${roll.sum}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
