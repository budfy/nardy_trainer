import React from 'react';
import { motion } from 'motion/react';
import { Dices, Sparkles } from 'lucide-react';
import { DiceState, PlayerColor } from '../../types/backgammon';

interface DiceRollerProps {
  diceState: DiceState;
  onRoll: () => void;
  playerTurn: PlayerColor;
  isAiTurn: boolean;
  disabled?: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  diceState,
  onRoll,
  playerTurn,
  isAiTurn,
  disabled,
}) => {
  const isDouble =
    diceState.currentDice.length === 2 &&
    diceState.currentDice[0] === diceState.currentDice[1];

  const renderDieFace = (value: number, isUsed: boolean, key: string | number) => {
    // 3x3 dot grid coordinates
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [2, 6],
      3: [2, 4, 6],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeDots = dotPositions[value] || [];

    return (
      <motion.div
        key={key}
        initial={{ scale: 0.8, rotate: -15 }}
        animate={{
          scale: isUsed ? 0.9 : 1,
          rotate: 0,
          opacity: isUsed ? 0.35 : 1,
        }}
        whileHover={!isUsed ? { scale: 1.08, y: -2 } : {}}
        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl p-1.5 shadow-md flex flex-wrap justify-between items-center transition-all ${
          isUsed
            ? 'bg-stone-300 border border-stone-400 grayscale'
            : playerTurn === 'white'
            ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-amber-900/20'
            : 'bg-gradient-to-br from-stone-800 to-stone-900 border-2 border-amber-600 shadow-black/40'
        }`}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0.5 p-0.5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-center">
              {activeDots.includes(idx) && (
                <div
                  className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-inner ${
                    playerTurn === 'white'
                      ? 'bg-amber-950'
                      : 'bg-amber-200 shadow-amber-300/40'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-stone-900/60 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-lg">
      <div className="flex items-center gap-2">
        {!diceState.hasRolled ? (
          <button
            id="roll-dice-button"
            onClick={onRoll}
            disabled={disabled || isAiTurn || diceState.isRolling}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm md:text-base shadow-md ${
              disabled || isAiTurn || diceState.isRolling
                ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black shadow-amber-500/25 active:scale-95'
            }`}
          >
            <Dices className={`w-5 h-5 ${diceState.isRolling ? 'animate-spin' : ''}`} />
            <span>{diceState.isRolling ? 'Кидаємо...' : 'Кинути кубики'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {diceState.remainingDice.map((dieValue, idx) =>
              renderDieFace(dieValue, false, `active-${idx}-${dieValue}`)
            )}
            {diceState.remainingDice.length === 0 && (
              <span className="text-xs text-stone-400 font-medium px-2 py-1 bg-stone-800 rounded-lg">
                Всі ходи зроблено
              </span>
            )}
          </div>
        )}
      </div>

      {diceState.hasRolled && isDouble && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Дубль ({diceState.remainingDice.length} ходи лишилось)</span>
        </div>
      )}
    </div>
  );
};
