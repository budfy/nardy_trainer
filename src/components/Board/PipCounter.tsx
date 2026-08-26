import React from 'react';
import { BoardState, PlayerColor } from '../../types/backgammon';
import { calculatePipCount } from '../../utils/backgammonEngine';
import { ShieldAlert, TrendingUp } from 'lucide-react';

interface PipCounterProps {
  board: BoardState;
  playerTurn: PlayerColor;
}

export const PipCounter: React.FC<PipCounterProps> = ({ board, playerTurn }) => {
  const pips = calculatePipCount(board);
  const diff = pips.black - pips.white; // Positive means White is ahead in race (needs fewer pips)

  // Calculate estimated win chance based on simple Ward-Kleinman / Thorpe pip formula
  // In a pure running race: White advantage %
  const totalPips = pips.white + pips.black;
  const whiteAdvantagePercent =
    totalPips > 0
      ? Math.max(10, Math.min(90, Math.round(50 + (diff / (totalPips * 0.15)) * 10)))
      : 50;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800 shadow-md text-stone-200">
      {/* White player info */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br from-amber-50 to-amber-200 border-2 border-amber-300 flex items-center justify-center font-bold text-xs text-stone-900 shadow-sm ${
            playerTurn === 'white' ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900' : ''
          }`}
        >
          ⚪
        </div>
        <div>
          <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
            <span>Ви (Білі)</span>
            {board.bar.white > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] flex items-center gap-0.5 font-bold">
                <ShieldAlert className="w-2.5 h-2.5" /> Бар: {board.bar.white}
              </span>
            )}
          </div>
          <div className="text-sm font-black text-amber-300 flex items-center gap-2">
            <span>{pips.white} піпів</span>
            <span className="text-[11px] text-stone-400 font-normal">
              Знято: {board.off.white}/15
            </span>
          </div>
        </div>
      </div>

      {/* Race lead center pill */}
      <div className="hidden sm:flex flex-col items-center px-3 py-1 bg-stone-950/60 rounded-xl border border-stone-800">
        <div className="flex items-center gap-1 text-[11px] font-medium text-stone-400">
          <TrendingUp className="w-3 h-3 text-amber-400" />
          <span>Гонка (Pip Count)</span>
        </div>
        <div className="text-xs font-bold">
          {diff > 0 ? (
            <span className="text-emerald-400">Білі попереду на +{diff} піпів</span>
          ) : diff < 0 ? (
            <span className="text-amber-400">Чорні попереду на +{Math.abs(diff)} піпів</span>
          ) : (
            <span className="text-stone-400">Рівна гонка (0 піпів)</span>
          )}
        </div>
        <div className="w-32 bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden flex">
          <div
            className="bg-amber-300 h-full transition-all duration-500"
            style={{ width: `${whiteAdvantagePercent}%` }}
          />
          <div
            className="bg-stone-600 h-full transition-all duration-500"
            style={{ width: `${100 - whiteAdvantagePercent}%` }}
          />
        </div>
      </div>

      {/* Black AI player info */}
      <div className="flex items-center gap-2.5 text-right">
        <div>
          <div className="text-xs font-semibold text-stone-300 flex items-center justify-end gap-1.5">
            {board.bar.black > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] flex items-center gap-0.5 font-bold">
                <ShieldAlert className="w-2.5 h-2.5" /> Бар: {board.bar.black}
              </span>
            )}
            <span>Компʼютер (Чорні)</span>
          </div>
          <div className="text-sm font-black text-amber-400 flex items-center justify-end gap-2">
            <span className="text-[11px] text-stone-400 font-normal">
              Знято: {board.off.black}/15
            </span>
            <span>{pips.black} піпів</span>
          </div>
        </div>
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br from-stone-800 to-stone-950 border-2 border-stone-600 flex items-center justify-center font-bold text-xs text-amber-200 shadow-sm ${
            playerTurn === 'black' ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-900' : ''
          }`}
        >
          ⚫
        </div>
      </div>
    </div>
  );
};
