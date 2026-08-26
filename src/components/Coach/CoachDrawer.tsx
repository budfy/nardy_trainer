import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, Send, Lightbulb, ShieldAlert, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { TurnHistoryItem } from '../../types/backgammon';

interface CoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lastMoveAnalysis?: TurnHistoryItem['analysis'];
  currentEvaluationSummary?: string;
  gameContext?: Record<string, unknown>;
}

export const CoachDrawer: React.FC<CoachDrawerProps> = ({
  isOpen,
  onClose,
  lastMoveAnalysis,
  currentEvaluationSummary,
  gameContext,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'coach'; text: string }>>([
    {
      sender: 'coach',
      text: 'Вітаю! Я ваш ШІ-тренер з нард. Я пояснюю стратегію, оцінюю кожен ваш хід, рахую ймовірності та відповідаю на будь-які запитання. Запитуйте або спостерігайте за моїми підказками!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          gameContext,
        }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setMessages((prev) => [...prev, { sender: 'coach', text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'coach',
            text: data.fallback || 'Головне в нардах — не підставляти одиночні шашки (блоти) під прямий удар з відстані 1-6 та будувати сильний прайм.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: 'Памʼятайте: 5-й пункт (Золотий) є найважливішим у дебюті, оскільки він заважає супернику повертатися з бару!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'best':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Найкращий хід (Best)
          </span>
        );
      case 'great':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Сильний хід (Great)
          </span>
        );
      case 'good':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Хороший хід
          </span>
        );
      case 'inaccurate':
        return (
          <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Неточність
          </span>
        );
      case 'blunder':
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Помилка (Blunder)
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="w-full lg:w-96 bg-stone-900 border-l border-stone-800 flex flex-col h-full shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                <span>ШІ-Тренер з Нард</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">Гросмейстерський аналіз ходів</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Move Realtime Analysis Box */}
        {lastMoveAnalysis && (
          <div className="p-3 bg-stone-950/60 border-b border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400">Оцінка останнього ходу:</span>
              {getQualityBadge(lastMoveAnalysis.quality)}
            </div>
            <p className="text-xs text-stone-200 font-medium">{lastMoveAnalysis.summary}</p>
            {lastMoveAnalysis.aiAdvice && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{lastMoveAnalysis.aiAdvice}</span>
              </div>
            )}
          </div>
        )}

        {/* Evaluation banner if available */}
        {currentEvaluationSummary && !lastMoveAnalysis && (
          <div className="p-3 bg-stone-950/60 border-b border-stone-800/80">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentEvaluationSummary}</span>
            </div>
          </div>
        )}

        {/* Chat Messages scroll area */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-stone-950 font-medium rounded-br-none shadow-md'
                    : 'bg-stone-800 text-stone-200 border border-stone-700/60 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-stone-800 text-stone-300 rounded-2xl p-3 text-xs flex items-center gap-2 border border-stone-700">
                <Bot className="w-4 h-4 animate-bounce text-amber-400" />
                <span>Тренер аналізує позицію...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-stone-800/60 bg-stone-950/30">
          <button
            onClick={() => {
              setInputValue('Що таке Золотий пункт і чому він такий важливий?');
            }}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
          >
            🌟 Що таке Золотий пункт?
          </button>
          <button
            onClick={() => {
              setInputValue('Коли вигідно будувати прайм з 6 пунктів?');
            }}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
          >
            🧱 Сила Прайму
          </button>
          <button
            onClick={() => {
              setInputValue('Як правильно знімати шашки без ризику?');
            }}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
          >
            🏆 Безпечний Bear-off
          </button>
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 bg-stone-950 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Запитайте тренера..."
            className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center shadow-md shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};
