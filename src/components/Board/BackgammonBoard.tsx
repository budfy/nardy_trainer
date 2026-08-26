import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BoardState, PlayerColor, BoardAnnotation } from '../../types/backgammon';
import { AvailableMoveOption } from '../../utils/backgammonEngine';
import { evaluateBlotRisks } from '../../utils/probabilities';
import { ShieldAlert, ArrowDown, ArrowUp, Crown, Sparkles, Shield, Anchor, Target } from 'lucide-react';

interface BackgammonBoardProps {
  board: BoardState;
  selectedPoint: number | 'bar' | null;
  availableMoves: AvailableMoveOption[];
  onSelectPoint: (point: number | 'bar' | null) => void;
  onSelectTarget: (to: number | 'off', dieUsed: number, moveOption?: AvailableMoveOption) => void;
  playerTurn: PlayerColor;
  showRisks?: boolean;
  isInteractive?: boolean;
  annotations?: BoardAnnotation[];
  showTacticalLabels?: boolean;
}

interface MoveArrow {
  id: string;
  from: number | 'bar';
  to: number | 'off';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  controlX: number;
  controlY: number;
  dieUsed: number;
  diceUsed?: number[];
  isHit: boolean;
  isCombined: boolean;
  targetMove: AvailableMoveOption;
}

export const BackgammonBoard: React.FC<BackgammonBoardProps> = ({
  board,
  selectedPoint,
  availableMoves,
  onSelectPoint,
  onSelectTarget,
  playerTurn,
  showRisks = false,
  isInteractive = true,
  annotations = [],
  showTacticalLabels = true,
}) => {
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [moveArrows, setMoveArrows] = useState<MoveArrow[]>([]);

  // Blot risk assessment for white player (or active player)
  const blotRisks = showRisks ? evaluateBlotRisks(board, playerTurn) : [];

  // Filter legal destinations if a point or bar is selected
  const currentLegalDestinations = selectedPoint !== null
    ? availableMoves.filter((m) => m.from === selectedPoint)
    : [];

  // Calculate trajectory arrows from selected point to legal destination targets
  useEffect(() => {
    if (!selectedPoint || currentLegalDestinations.length === 0 || !boardContainerRef.current) {
      setMoveArrows([]);
      return;
    }

    const updateArrows = () => {
      if (!boardContainerRef.current) return;
      const containerRect = boardContainerRef.current.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) return;

      // Get source element
      let srcEl: HTMLElement | null = null;
      if (selectedPoint === 'bar') {
        srcEl = document.getElementById(playerTurn === 'white' ? 'board-bar-top' : 'board-bar-bottom');
      } else {
        srcEl = document.getElementById(`board-point-${selectedPoint}`);
      }

      if (!srcEl) {
        setMoveArrows([]);
        return;
      }

      const srcRect = srcEl.getBoundingClientRect();
      const isSrcTopRow =
        selectedPoint === 'bar'
          ? playerTurn === 'white'
          : typeof selectedPoint === 'number' && selectedPoint >= 13 && selectedPoint <= 24;

      const x1 = srcRect.left + srcRect.width / 2 - containerRect.left;
      const y1 = isSrcTopRow
        ? srcRect.top + srcRect.height * 0.5 - containerRect.top
        : srcRect.top + srcRect.height * 0.5 - containerRect.top;

      const computedArrows: MoveArrow[] = [];

      for (const move of currentLegalDestinations) {
        let targetEl: HTMLElement | null = null;
        let isTargetTopRow = false;

        if (move.to === 'off') {
          targetEl = document.getElementById('white-bear-off-tray');
          isTargetTopRow = false;
        } else {
          targetEl = document.getElementById(`board-point-${move.to}`);
          isTargetTopRow = typeof move.to === 'number' && move.to >= 13 && move.to <= 24;
        }

        if (!targetEl) continue;

        const targetRect = targetEl.getBoundingClientRect();
        const x2 = targetRect.left + targetRect.width / 2 - containerRect.left;
        const y2 =
          move.to === 'off'
            ? targetRect.top + targetRect.height * 0.45 - containerRect.top
            : isTargetTopRow
            ? targetRect.top + targetRect.height * 0.62 - containerRect.top
            : targetRect.top + targetRect.height * 0.38 - containerRect.top;

        // Smooth curved trajectory calculation
        let controlX = (x1 + x2) / 2;
        let controlY = (y1 + y2) / 2;
        const deltaX = Math.abs(x2 - x1);

        if (isSrcTopRow && isTargetTopRow) {
          // Both in top row: curve downward toward center dividing zone
          const curveOffset = Math.min(85, Math.max(30, deltaX * 0.28));
          controlY = Math.max(y1, y2) + curveOffset;
        } else if (!isSrcTopRow && !isTargetTopRow && move.to !== 'off') {
          // Both in bottom row: curve upward toward center dividing zone
          const curveOffset = Math.min(85, Math.max(30, deltaX * 0.28));
          controlY = Math.min(y1, y2) - curveOffset;
        } else {
          // Cross-row or to-tray move: smooth S-like arch
          controlY = (y1 + y2) / 2;
          controlX = (x1 + x2) / 2 + (x2 < x1 ? -20 : 20);
        }

        computedArrows.push({
          id: `arrow-${move.from}-${move.to}-${move.dieUsed}`,
          from: move.from,
          to: move.to,
          x1,
          y1,
          x2,
          y2,
          controlX,
          controlY,
          dieUsed: move.dieUsed,
          diceUsed: move.diceUsed,
          isHit: !!move.isHit,
          isCombined: !!move.isCombined,
          targetMove: move,
        });
      }

      setMoveArrows(computedArrows);
    };

    const rafId = requestAnimationFrame(updateArrows);
    window.addEventListener('resize', updateArrows);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateArrows);
    };
  }, [selectedPoint, availableMoves, board, playerTurn]);

  const canSelectBar =
    isInteractive &&
    ((playerTurn === 'white' && board.bar.white > 0) ||
      (playerTurn === 'black' && board.bar.black > 0));

  // Helper to render checkers on a point
  const renderPointCheckers = (pointIndex: number, isTopRow: boolean) => {
    const point = board.points[pointIndex - 1];
    if (!point || point.count === 0 || !point.color) return null;

    const maxVisible = 5;
    const visibleCount = Math.min(point.count, maxVisible);
    const hasOverflow = point.count > maxVisible;

    const riskInfo = blotRisks.find((r) => r.pointIndex === pointIndex);

    return (
      <div
        className={`absolute inset-x-0 flex flex-col items-center pointer-events-none ${
          isTopRow ? 'top-1 justify-start' : 'bottom-1 justify-end'
        }`}
      >
        {Array.from({ length: visibleCount }).map((_, idx) => {
          const isTopChecker = isTopRow ? idx === visibleCount - 1 : idx === 0;
          return (
            <motion.div
              key={`${pointIndex}-${idx}`}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full shadow-md -my-1 sm:-my-1.5 flex items-center justify-center border transition-transform ${
                point.color === 'white'
                  ? 'bg-gradient-to-b from-stone-100 via-amber-50 to-amber-200 border-amber-300 text-stone-900 shadow-amber-950/30'
                  : 'bg-gradient-to-b from-stone-800 via-stone-900 to-black border-stone-600 text-amber-100 shadow-black/60'
              }`}
            >
              {/* Inner concentric ring for 3D look */}
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full border border-dashed flex items-center justify-center ${
                  point.color === 'white' ? 'border-amber-400/60' : 'border-stone-600/70'
                }`}
              >
                {/* Show number badge if more than 5 checkers */}
                {isTopChecker && hasOverflow && (
                  <span className="text-[10px] sm:text-xs font-black text-amber-500">
                    +{point.count - maxVisible + 1}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Risk % badge if blot is exposed */}
        {riskInfo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute z-20 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-0.5 shadow-lg ${
              isTopRow ? 'top-16' : 'bottom-16'
            } ${
              riskInfo.riskPercent > 40
                ? 'bg-red-600 text-white animate-pulse'
                : riskInfo.riskPercent > 25
                ? 'bg-amber-500 text-stone-950'
                : 'bg-yellow-400 text-stone-950'
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>{riskInfo.riskPercent}%</span>
          </motion.div>
        )}
      </div>
    );
  };

  // Render a triangle point
  const renderPoint = (pointIndex: number, isTopRow: boolean, isEven: boolean) => {
    const point = board.points[pointIndex - 1];
    const isSelected = selectedPoint === pointIndex;
    const isMovableSource =
      isInteractive &&
      availableMoves.some((m) => m.from === pointIndex) &&
      point.color === playerTurn;

    // Check if this point is a legal destination from currently selected point
    const targetMove = currentLegalDestinations.find((m) => m.to === pointIndex);

    // Custom annotation for this specific point
    const customAnn = annotations.find((a) => a.pointIndex === pointIndex);

    // Dynamic tactical element detection
    const isBlot = point.count === 1;
    const isWhiteAnchor = point.count >= 2 && point.color === 'white' && pointIndex >= 19 && pointIndex <= 24;
    const isBlackAnchor = point.count >= 2 && point.color === 'black' && pointIndex >= 1 && pointIndex <= 6;
    const isAnchor = isWhiteAnchor || isBlackAnchor;
    
    // Check if this point belongs to a prime (3+ adjacent made points of same color)
    let isPartOfPrime = false;
    if (point.count >= 2 && point.color) {
      const color = point.color;
      let consecutiveCount = 0;
      // count consecutive backwards & forwards
      for (let i = 0; i < 24; i++) {
        if (board.points[i].count >= 2 && board.points[i].color === color) {
          consecutiveCount++;
          if (consecutiveCount >= 4) {
            // Check if pointIndex is in this cluster
            const startIdx = i - consecutiveCount + 1 + 1;
            const endIdx = i + 1;
            if (pointIndex >= startIdx && pointIndex <= endIdx) {
              isPartOfPrime = true;
              break;
            }
          }
        } else {
          consecutiveCount = 0;
        }
      }
    }

    // Special tactical labels (e.g. Golden point 5, 20; Bar point 7, 18)
    const isGolden = pointIndex === 5 || pointIndex === 20;
    const isBarPoint = pointIndex === 7 || pointIndex === 18;

    return (
      <div
        key={`point-${pointIndex}`}
        id={`board-point-${pointIndex}`}
        onClick={() => {
          if (!isInteractive) return;
          if (targetMove) {
            onSelectTarget(pointIndex, targetMove.dieUsed, targetMove);
          } else if (isSelected) {
            onSelectPoint(null);
          } else if (isMovableSource) {
            onSelectPoint(pointIndex);
          }
        }}
        className={`relative flex-1 h-36 sm:h-44 md:h-56 flex flex-col items-center justify-between cursor-pointer group select-none transition-all rounded-sm ${
          isSelected ? 'bg-amber-500/25 ring-2 ring-amber-400' : ''
        }`}
      >
        {/* The triangle geometric shape */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm"
          preserveAspectRatio="none"
          viewBox="0 0 100 200"
        >
          <polygon
            points={isTopRow ? '0,0 100,0 50,195' : '0,200 100,200 50,5'}
            className={`${
              isEven
                ? 'fill-amber-900/60 stroke-amber-950/40'
                : 'fill-amber-200/50 stroke-amber-300/40'
            } transition-colors duration-150 group-hover:brightness-110`}
          />
        </svg>

        {/* Point number indicator & Tactical Tag */}
        <div
          className={`relative z-10 flex flex-col items-center gap-0.5 px-1 rounded transition-colors ${
            isTopRow ? 'mt-1' : 'mb-1 order-last'
          }`}
        >
          <span
            className={`text-[10px] sm:text-xs font-bold leading-none ${
              isGolden
                ? 'text-amber-300 font-black'
                : isBarPoint
                ? 'text-cyan-300 font-black'
                : isEven
                ? 'text-amber-200/70'
                : 'text-amber-950/80'
            }`}
          >
            {pointIndex}
          </span>

          {/* Visual Tactical Badges */}
          {customAnn ? (
            <span
              className={`px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-tighter whitespace-nowrap shadow-md ${
                customAnn.type === 'golden'
                  ? 'bg-amber-400 text-stone-950 ring-1 ring-amber-200'
                  : customAnn.type === 'blot'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : customAnn.type === 'anchor'
                  ? 'bg-blue-600 text-white'
                  : customAnn.type === 'prime'
                  ? 'bg-purple-600 text-white'
                  : 'bg-emerald-500 text-stone-950'
              }`}
            >
              {customAnn.label}
            </span>
          ) : showTacticalLabels ? (
            <>
              {isGolden && point.count === 0 && (
                <span className="text-[7px] sm:text-[8px] font-extrabold text-amber-400/80 uppercase tracking-tighter hidden sm:inline-block">
                  Золотий
                </span>
              )}
              {isAnchor && (
                <span className="px-1 py-0.2 rounded bg-blue-500/90 text-white text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-0.5">
                  <Anchor className="w-2 h-2" />
                  <span className="hidden sm:inline">Анкер</span>
                </span>
              )}
              {isPartOfPrime && (
                <span className="px-1 py-0.2 rounded bg-purple-500/90 text-white text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-sm hidden sm:inline-block">
                  Прайм
                </span>
              )}
              {isBlot && (
                <span className="px-1 py-0.2 rounded bg-rose-500/80 text-white text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-sm">
                  Блот
                </span>
              )}
            </>
          ) : null}
        </div>

        {/* Checkers Stack */}
        {renderPointCheckers(pointIndex, isTopRow)}

        {/* Legal Target Move Destination Glow & Badge */}
        {targetMove && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative z-30 flex flex-col items-center ${
              isTopRow ? 'mb-2' : 'mt-2'
            }`}
          >
            <div
              className={`px-2 py-1 rounded-lg text-xs font-black shadow-lg flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                targetMove.isHit
                  ? 'bg-rose-500 text-white animate-bounce ring-2 ring-white shadow-rose-950/50'
                  : targetMove.isCombined
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-stone-950 ring-2 ring-cyan-200 shadow-cyan-500/50 font-black'
                  : 'bg-emerald-500 text-stone-950 ring-2 ring-emerald-300 shadow-emerald-950/40'
              }`}
            >
              {targetMove.isHit ? (
                <span>
                  УДАР! {targetMove.isCombined ? `+${targetMove.dieUsed} (${targetMove.diceUsed?.join('+')})` : `(${targetMove.dieUsed})`}
                </span>
              ) : targetMove.isCombined ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-stone-950 shrink-0" />
                  <span>+{targetMove.dieUsed} ({targetMove.diceUsed?.join('+')})</span>
                </span>
              ) : (
                <span>+{targetMove.dieUsed}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Source Move Selection indicator */}
        {isMovableSource && !isSelected && (
          <div
            className={`absolute z-10 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping ${
              isTopRow ? 'bottom-2' : 'top-2'
            }`}
          />
        )}
      </div>
    );
  };

  // Check if Bearing off to Tray is legal from current selection
  const offTargetMove = currentLegalDestinations.find((m) => m.to === 'off');

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl p-2 sm:p-4 bg-gradient-to-br from-[#2c1810] via-[#1a0f0a] to-[#2c1810] border-4 border-[#5c3a21] shadow-2xl overflow-hidden">
      {/* Outer wooden border container */}
      <div
        ref={boardContainerRef}
        className="relative rounded-2xl p-1.5 sm:p-3 bg-gradient-to-b from-[#3a2012] to-[#24130a] border border-[#7a4e2c]/50 flex"
      >
        {/* SVG Curved Trajectory Arrows Layer */}
        {moveArrows.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <defs>
              {/* Emerald Arrowhead (Normal legal moves) */}
              <marker
                id="arrowhead-emerald"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>

              {/* Cyan Arrowhead (Combined multi-die moves) */}
              <marker
                id="arrowhead-cyan"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
              </marker>

              {/* Rose Arrowhead (Hit blot moves) */}
              <marker
                id="arrowhead-rose"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
              </marker>
            </defs>

            {moveArrows.map((arrow) => {
              const strokeColor = arrow.isHit
                ? '#f43f5e'
                : arrow.isCombined
                ? '#06b6d4'
                : '#10b981';

              const markerId = arrow.isHit
                ? 'arrowhead-rose'
                : arrow.isCombined
                ? 'arrowhead-cyan'
                : 'arrowhead-emerald';

              return (
                <g key={arrow.id}>
                  {/* Soft Wide Glow Path */}
                  <path
                    d={`M ${arrow.x1} ${arrow.y1} Q ${arrow.controlX} ${arrow.controlY} ${arrow.x2} ${arrow.y2}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="8"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                  />

                  {/* High-Contrast Main Trajectory Line */}
                  <path
                    d={`M ${arrow.x1} ${arrow.y1} Q ${arrow.controlX} ${arrow.controlY} ${arrow.x2} ${arrow.y2}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3.5"
                    strokeDasharray="8 4"
                    strokeLinecap="round"
                    markerEnd={`url(#${markerId})`}
                    className="animate-pulse"
                  />

                  {/* Origin Source Ring at Checker Apex */}
                  <circle
                    cx={arrow.x1}
                    cy={arrow.y1}
                    r="5.5"
                    fill={strokeColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Main Board Grid (Divided into Left Quadrant, Center BAR, Right Quadrant) */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-4">
          
          {/* TOP HALF: Points 13-18 (Outer), BAR, Points 19-24 (Black Home) */}
          <div className="flex bg-[#422514]/70 rounded-xl p-1 border border-amber-950/40 shadow-inner">
            {/* Points 13 to 18 (Left Outer) */}
            <div className="flex-1 grid grid-cols-6 gap-0.5">
              {[13, 14, 15, 16, 17, 18].map((ptIndex, idx) =>
                renderPoint(ptIndex, true, idx % 2 === 0)
              )}
            </div>

            {/* Central BAR (Top Half) */}
            <div
              id="board-bar-top"
              onClick={() => {
                if (!canSelectBar || playerTurn !== 'white') return;
                if (selectedPoint === 'bar') {
                  onSelectPoint(null);
                } else {
                  onSelectPoint('bar');
                }
              }}
              className={`w-10 sm:w-14 md:w-16 mx-1 bg-gradient-to-b from-[#1f1109] via-[#2d180d] to-[#1f1109] rounded-lg border-x-2 border-[#5c3a21] flex flex-col items-center justify-center relative cursor-pointer ${
                selectedPoint === 'bar' && playerTurn === 'white'
                  ? 'ring-2 ring-amber-400 bg-amber-900/40'
                  : ''
              }`}
            >
              <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider mb-1">
                БАР
              </span>
              {/* White checkers on bar */}
              {board.bar.white > 0 && (
                <div className="flex flex-col items-center -space-y-3">
                  {Array.from({ length: Math.min(3, board.bar.white) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-stone-100 to-amber-200 border-2 border-amber-400 shadow-lg flex items-center justify-center font-black text-stone-900 text-xs"
                    >
                      {i === 0 && board.bar.white > 1 ? `x${board.bar.white}` : '⚪'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points 19 to 24 (Right Black Home) */}
            <div className="flex-1 grid grid-cols-6 gap-0.5">
              {[19, 20, 21, 22, 23, 24].map((ptIndex, idx) =>
                renderPoint(ptIndex, true, idx % 2 === 1)
              )}
            </div>
          </div>

          {/* Central Dividing Line / Board Hinges */}
          <div className="flex items-center justify-between px-4 text-xs font-semibold text-amber-400/40">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-amber-400/60" />
              <span>Зовнішня дошка (Outer Board)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600/40" />
              <span className="text-[11px] uppercase tracking-widest text-amber-300/60">
                Нарди Академія
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-600/40" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Дім (Home Board)</span>
              <ArrowUp className="w-3.5 h-3.5 text-amber-400/60" />
            </div>
          </div>

          {/* BOTTOM HALF: Points 12-7 (Outer), BAR, Points 6-1 (White Home) */}
          <div className="flex bg-[#422514]/70 rounded-xl p-1 border border-amber-950/40 shadow-inner">
            {/* Points 12 down to 7 (Left Outer) */}
            <div className="flex-1 grid grid-cols-6 gap-0.5">
              {[12, 11, 10, 9, 8, 7].map((ptIndex, idx) =>
                renderPoint(ptIndex, false, idx % 2 === 1)
              )}
            </div>

            {/* Central BAR (Bottom Half) */}
            <div
              id="board-bar-bottom"
              onClick={() => {
                if (!canSelectBar || playerTurn !== 'black') return;
                if (selectedPoint === 'bar') {
                  onSelectPoint(null);
                } else {
                  onSelectPoint('bar');
                }
              }}
              className={`w-10 sm:w-14 md:w-16 mx-1 bg-gradient-to-b from-[#1f1109] via-[#2d180d] to-[#1f1109] rounded-lg border-x-2 border-[#5c3a21] flex flex-col items-center justify-center relative cursor-pointer ${
                selectedPoint === 'bar' && playerTurn === 'black'
                  ? 'ring-2 ring-amber-400 bg-amber-900/40'
                  : ''
              }`}
            >
              {/* Black checkers on bar */}
              {board.bar.black > 0 && (
                <div className="flex flex-col items-center -space-y-3 mb-1">
                  {Array.from({ length: Math.min(3, board.bar.black) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-stone-800 to-black border-2 border-stone-600 shadow-lg flex items-center justify-center font-black text-amber-200 text-xs"
                    >
                      {i === 0 && board.bar.black > 1 ? `x${board.bar.black}` : '⚫'}
                    </div>
                  ))}
                </div>
              )}
              <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider mt-1">
                БАР
              </span>
            </div>

            {/* Points 6 down to 1 (Right White Home) */}
            <div className="flex-1 grid grid-cols-6 gap-0.5">
              {[6, 5, 4, 3, 2, 1].map((ptIndex, idx) =>
                renderPoint(ptIndex, false, idx % 2 === 0)
              )}
            </div>
          </div>

        </div>

        {/* BEAR-OFF TRAYS (Far Right Column) */}
        <div className="w-12 sm:w-16 md:w-20 ml-2 sm:ml-3 flex flex-col justify-between p-1 bg-[#1c0f08] rounded-xl border border-[#5c3a21] shadow-2xl">
          {/* Black Bear-Off Tray (Top) */}
          <div className="h-36 sm:h-44 md:h-56 bg-stone-950/80 rounded-lg border border-stone-800 p-1 flex flex-col items-center justify-between">
            <div className="text-[10px] font-bold text-stone-400">Чорні</div>
            <div className="flex flex-col items-center gap-1 w-full overflow-hidden">
              {Array.from({ length: Math.min(8, board.off.black) }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-3.5 bg-stone-800 border border-stone-600 rounded-sm shadow"
                />
              ))}
            </div>
            <div className="text-xs font-black text-amber-400">
              {board.off.black}/15
            </div>
          </div>

          {/* White Bear-Off Tray (Bottom) */}
          <div
            id="white-bear-off-tray"
            onClick={() => {
              if (offTargetMove && isInteractive) {
                onSelectTarget('off', offTargetMove.dieUsed, offTargetMove);
              }
            }}
            className={`h-36 sm:h-44 md:h-56 rounded-lg p-1 flex flex-col items-center justify-between transition-all ${
              offTargetMove
                ? 'bg-emerald-950/60 border-2 border-emerald-400 cursor-pointer animate-pulse'
                : 'bg-amber-950/30 border border-amber-900/60'
            }`}
          >
            {offTargetMove ? (
              <div
                className={`px-1.5 py-0.5 text-stone-950 text-[10px] font-black rounded-md animate-bounce ${
                  offTargetMove.isCombined
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-400 ring-2 ring-cyan-200'
                    : 'bg-emerald-500'
                }`}
              >
                {offTargetMove.isCombined
                  ? `ЗНЯТИ +${offTargetMove.dieUsed} (${offTargetMove.diceUsed?.join('+')})`
                  : `ЗНЯТИ (+${offTargetMove.dieUsed})`}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-amber-300">Білі</div>
            )}
            <div className="flex flex-col items-center gap-1 w-full overflow-hidden">
              {Array.from({ length: Math.min(8, board.off.white) }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-3.5 bg-amber-100 border border-amber-300 rounded-sm shadow"
                />
              ))}
            </div>
            <div className="text-xs font-black text-amber-300">
              {board.off.white}/15
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
