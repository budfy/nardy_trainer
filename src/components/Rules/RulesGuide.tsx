import React from 'react';
import { BookOpen, Shield, Award, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

export const RulesGuide: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-stone-200">
      {/* Header */}
      <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl p-6 border border-stone-800 shadow-xl">
        <h2 className="text-2xl font-black text-amber-300 flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <span>Повний довідник та правила гри в Короткі Нарди (Backgammon)</span>
        </h2>
        <p className="text-sm text-stone-300 mt-2 leading-relaxed">
          Короткі нарди — одна з найдавніших та найпопулярніших стратегічних настільних ігор у світі, яка поєднує глибокий тактичний розрахунок і теорію ймовірностей.
        </p>
      </div>

      {/* Grid of Rule Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Мета гри */}
        <div className="bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Award className="w-5 h-5" />
            <h3>1. Мета гри</h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Мета кожного гравця — провести всі свої 15 шашок по колу до свого «Дому» (пункти 1–6 для білих, 19–24 для чорних) і першим зняти (викинути) їх з дошки.
          </p>
        </div>

        {/* Section 2: Рух шашок */}
        <div className="bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <h3>2. Кубики та Дублі</h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Гравець кидає два кубики. Кожне число означає кількість пунктів для ходу. Можна ходити однією шашкою на суму кубиків або двома різними. Якщо випадає <strong>дубль</strong> (наприклад 5-5), гравець робить <strong>4 ходи</strong> по 5!
          </p>
        </div>

        {/* Section 3: Блоти та Бар */}
        <div className="bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Shield className="w-5 h-5" />
            <h3>3. Блоти та Вибивання</h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Одиночна шашка на пункті називається <strong>Блотом (Blot)</strong>. Якщо фішка суперника стає на цей пункт, блот вибивається на <strong>БАР</strong>. Доки гравець не поверне всі шашки з бару в дім суперника, він не може робити інші ходи.
          </p>
        </div>

        {/* Section 4: Прайми та Захист */}
        <div className="bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <h3>4. Прайми (Паркани) та Анкери</h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Пункт з 2+ шашками є захищеним. 4–6 закритих пунктів поспіль утворюють <strong>Прайм (Prime)</strong>. Через 6-пунктовий прайм жодна шашка не може перестрибнути фізично. Закріплення 2+ шашок у домі суперника називається <strong>Анкером (Anchor)</strong>.
          </p>
        </div>
      </div>

      {/* Dictionary Table */}
      <div className="bg-stone-900/80 rounded-2xl p-5 border border-stone-800 space-y-3">
        <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <span>Словник термінів нард</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
            <span className="font-bold text-amber-300">Золотий пункт (Golden Point):</span>
            <p className="text-stone-400 mt-1">
              5-й пункт для білих або 20-й для чорних. Найважливіший пункт на дошці для створення прайму і контролю суперника.
            </p>
          </div>

          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
            <span className="font-bold text-amber-300">Піп-каунт (Pip Count):</span>
            <p className="text-stone-400 mt-1">
              Сумарна кількість очок/клітинок, яка потрібна гравцеві, щоб завести всі шашки в дім і зняти їх з дошки.
            </p>
          </div>

          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
            <span className="font-bold text-amber-300">Марс (Gammon):</span>
            <p className="text-stone-400 mt-1">
              Перемога з подвоєними очками (2x), якщо переможений супротивник не встиг зняти з дошки жодної своєї шашки.
            </p>
          </div>

          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
            <span className="font-bold text-amber-300">Кокс (Backgammon):</span>
            <p className="text-stone-400 mt-1">
              Перемога з потрійними очками (3x), якщо суперник не зняв жодної шашки І досі має фішку на барі або у вашому домі.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
