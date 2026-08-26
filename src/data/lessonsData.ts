import { Lesson } from '../types/backgammon';

function makeEmptyBoard() {
  return {
    points: Array.from({ length: 24 }, (_, i) => ({
      index: i + 1,
      count: 0,
      color: null as 'white' | 'black' | null,
    })),
    bar: { white: 0, black: 0 },
    off: { white: 0, black: 0 },
  };
}

export const BACKGAMMON_LESSONS: Lesson[] = [
  {
    id: 'basics-movement',
    level: 1,
    category: 'Базові правила',
    title: 'Основи дошки та рух шашок',
    description: 'Дізнайтеся структуру дошки, напрямок руху білих та чорних, та як використовувати кидки кубиків.',
    iconName: 'Compass',
    steps: [
      {
        id: 'move-single-die',
        title: 'Крок 1.1: Базовий хід за кубиком',
        instruction: 'Ви граєте Білими. Ваш кидок: 5 і 3. Зробіть хід шашкою з 24-го пункту на 19-й (кубик 5), а потім з 13-го на 10-й (кубик 3).',
        theory: 'Дошка для нард складається з 24 трикутників (пунктів). Білі шашки завжди рухаються проти годинникової стрілки: від 24-го пункту до свого «Дому» (пункти 1–6). Чорні рухаються у протилежному напрямку (1 -> 24).',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[23] = { index: 24, count: 2, color: 'white' };
          b.points[12] = { index: 13, count: 5, color: 'white' };
          b.points[7] = { index: 8, count: 3, color: 'white' };
          b.points[5] = { index: 6, count: 5, color: 'white' };
          b.points[0] = { index: 1, count: 2, color: 'black' };
          b.points[11] = { index: 12, count: 5, color: 'black' };
          b.points[16] = { index: 17, count: 3, color: 'black' };
          b.points[18] = { index: 19, count: 5, color: 'black' };
          return b;
        })(),
        dice: [5, 3],
        playerTurn: 'white',
        targetMove: [
          { from: 24, to: 19, dieUsed: 5 },
          { from: 13, to: 10, dieUsed: 3 },
        ],
        explanationOnSuccess: 'Чудово! Ви зробили два класичні ходи: 24/19 (24 - 5 = 19) та 13/10 (13 - 3 = 10). Обидва кубики успішно зіграно!',
        hint: 'Перемістіть шашку з 24-го пункту на 19-й (кубик 5), а потім шашку з 13-го пункту на 10-й (кубик 3).',
        keyRule: 'Білі рухаються зі спаданням номерів пунктів (24 -> 1), Чорні — зі зростанням (1 -> 24).',
        customAnnotations: [
          { pointIndex: 24, label: 'Старт Білих (24)', type: 'anchor' },
          { pointIndex: 19, label: 'Ціль (24-5=19)', type: 'target' },
          { pointIndex: 13, label: 'Мід-поінт (13)', type: 'anchor' },
          { pointIndex: 10, label: 'Ціль (13-3=10)', type: 'target' },
        ],
      },
      {
        id: 'doubles-magic',
        title: 'Крок 1.2: Сила дублів (4 ходи!)',
        instruction: 'Вам випав дубль 4-4! При дублі гравець отримує 4 ходи по 4. Виконайте всі 4 ходи: перемістіть дві шашки з 13-го пункту на 9-й та дві шашки з 24-го на 20-й.',
        theory: 'Дубль — це найбажаніший кидок у нардах. Якщо випадає однакове число на обох кубиках (наприклад, 4 і 4), значення подвоюється: ви отримуєте 4 ходи замість двох! Це дозволяє закріпити одразу дві важливі позиції на дошці.',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[12] = { index: 13, count: 5, color: 'white' };
          b.points[7] = { index: 8, count: 3, color: 'white' };
          b.points[5] = { index: 6, count: 5, color: 'white' };
          b.points[23] = { index: 24, count: 2, color: 'white' };
          return b;
        })(),
        dice: [4, 4, 4, 4],
        playerTurn: 'white',
        targetMove: [
          { from: 13, to: 9, dieUsed: 4 },
          { from: 13, to: 9, dieUsed: 4 },
          { from: 24, to: 20, dieUsed: 4 },
          { from: 24, to: 20, dieUsed: 4 },
        ],
        explanationOnSuccess: 'Блискуче! Ви використали всі 4 ходи дубля 4-4: побудували захищений 9-й пункт та створили передовий анкер на 20-му пункті.',
        hint: 'Зробіть 2 ходи з 13-го пункту на 9-й (13 - 4 = 9) та 2 ходи з 24-го пункту на 20-й (24 - 4 = 20).',
        keyRule: 'Дубль дає 4 ходи однакової довжини (4 × значення кубика).',
        customAnnotations: [
          { pointIndex: 20, label: 'Новий Анкер (20)', type: 'anchor' },
          { pointIndex: 9, label: 'Новий Пункт (9)', type: 'target' },
        ],
      },
    ],
  },
  {
    id: 'blots-and-bar',
    level: 2,
    category: 'Тактика вибивання',
    title: 'Блоти, Бар та Вибивання',
    description: 'Дізнайтеся, що таке одиночна шашка (блот), як вибивати фішки суперника на бар і як повертатися.',
    iconName: 'ShieldAlert',
    steps: [
      {
        id: 'hitting-a-blot',
        title: 'Крок 2.1: Вибивання одиночної шашки (Блота)',
        instruction: 'У чорних є одиночна шашка (блот) на 5-му пункті. У вас випало 3 і 1. Вибийте чорний блот та закріпіть 5-й пункт: зіграйте з 8-го пункту на 5-й (кубик 3) та з 6-го на 5-й (кубик 1)!',
        theory: 'Якщо на пункті стоїть лише ОДНА шашка супротивника, це називається «Блот» (Blot). Коли ваша шашка потрапляє на такий пункт, шашка суперника «вибивається» і відправляється на середню роздільну смугу — БАР (Bar). Накривши вибитий пункт другою своєю шашкою (6/5), ви робите його повністю безпечним!',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[7] = { index: 8, count: 3, color: 'white' };
          b.points[4] = { index: 5, count: 1, color: 'black' }; // Blot!
          b.points[5] = { index: 6, count: 5, color: 'white' };
          return b;
        })(),
        dice: [3, 1],
        playerTurn: 'white',
        targetMove: [
          { from: 8, to: 5, dieUsed: 3 },
          { from: 6, to: 5, dieUsed: 1 },
        ],
        explanationOnSuccess: 'Влучний удар і бездоганний захист! Чорна шашка вибита на Бар, а ви закріпили важливий 5-й пункт двома своїми шашками.',
        hint: 'Перемістіть шашку з 8-го пункту на 5-й (кубик 3), щоб вибити блот, а потім з 6-го пункту на 5-й (кубик 1), щоб надійно закрити пункт.',
        keyRule: 'Пункт з 1 шашкою вразливий (блот). Пункт з 2+ шашками — захищений, на нього не можна стати супернику.',
        customAnnotations: [
          { pointIndex: 5, label: 'Чорний Блот!', type: 'blot' },
          { pointIndex: 8, label: 'Атака (8-5)', type: 'target' },
          { pointIndex: 6, label: 'Захист (6-5)', type: 'target' },
        ],
      },
      {
        id: 'entering-from-bar',
        title: 'Крок 2.2: Обовʼязкове повернення з Бару',
        instruction: 'Ваша біла шашка на Барі! Кидок 2 і 5. Поверніть шашку з бару на 23-й пункт за допомогою кубика 2, а потім просуньте її далі на 18-й пункт за кубиком 5 (23 - 5 = 18).',
        theory: 'Якщо хоча б одна ваша шашка опинилася на Барі, ви НЕ МАЄТЕ ПРАВА робити жодних інших ходів на дошці, доки не введете всі свої шашки з бару назад у гру. Білі входять у Дім чорних (пункти 19-24).',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.bar.white = 1;
          b.points[5] = { index: 6, count: 4, color: 'white' };
          b.points[7] = { index: 8, count: 3, color: 'white' };
          b.points[23] = { index: 24, count: 2, color: 'black' }; // Point 24 is blocked by Black
          return b;
        })(),
        dice: [2, 5],
        playerTurn: 'white',
        targetMove: [
          { from: 'bar', to: 23, dieUsed: 2 },
          { from: 23, to: 18, dieUsed: 5 },
        ],
        explanationOnSuccess: 'Відмінно! Шашка з бару успішно повернулася на дошку через 23-й пункт і безпечно втекла на 18-й пункт.',
        hint: 'Натисніть на білу шашку на Барі і виберіть 23-й пункт (кубик 2), потім зіграйте нею ж з 23-го на 18-й пункт (кубик 5).',
        keyRule: 'Вхід з бару завжди має найвищий пріоритет.',
        customAnnotations: [
          { pointIndex: 23, label: 'Вхід з бару (2)', type: 'target' },
          { pointIndex: 18, label: 'Ціль (23-5=18)', type: 'target' },
          { pointIndex: 24, label: 'Заблоковано Чорними', type: 'anchor' },
        ],
      },
    ],
  },
  {
    id: 'primes-and-blockades',
    level: 3,
    category: 'Стратегія контролю',
    title: 'Побудова Праймів та Блокади',
    description: 'Опануйте найпотужнішу стратегічну зброю нард — непереборні стіни з 4, 5 та 6 пунктів поспіль.',
    iconName: 'Layers',
    steps: [
      {
        id: 'build-prime-wall',
        title: 'Крок 3.1: Замикання 6-пунктового Прайму (Full Prime)',
        instruction: 'У вас зайняті пункти 8, 7, 6, 4, 3. Кубики: 3 і 1. Зробіть хід шашкою з 8 на 5 (кубик 3) та з 6 на 5 (кубик 1), щоб замкнути 5-й пункт!',
        theory: '«Прайм» (Prime) — це лінія з кількох поспіль закритих пунктів (по 2+ шашки на кожному). Оскільки максимальне число на кубику — 6, через 6-пунктовий прайм жодна шашка суперника не може перестрибнути фізично!',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[7] = { index: 8, count: 3, color: 'white' };
          b.points[6] = { index: 7, count: 2, color: 'white' };
          b.points[5] = { index: 6, count: 3, color: 'white' };
          b.points[3] = { index: 4, count: 2, color: 'white' };
          b.points[2] = { index: 3, count: 2, color: 'white' };
          b.points[0] = { index: 1, count: 2, color: 'black' }; // Black checkers trapped behind!
          return b;
        })(),
        dice: [3, 1],
        playerTurn: 'white',
        targetMove: [
          { from: 8, to: 5, dieUsed: 3 },
          { from: 6, to: 5, dieUsed: 1 },
        ],
        explanationOnSuccess: 'Ідеально! Тепер у вас повноцінний 6-пунктовий Прайм (пункти 3, 4, 5, 6, 7, 8). Задні шашки чорних на пункті 1 повністю заблоковані!',
        hint: 'Зіграйте з 8-го пункту на 5-й (8-3=5), а потім з 6-го пункту на 5-й (6-1=5).',
        keyRule: '6 закритих пунктів поспіль — це абсолютно нездоланна стіна в нардах.',
        customAnnotations: [
          { pointIndex: 8, label: 'Прайм (8)', type: 'prime' },
          { pointIndex: 7, label: 'Прайм (7)', type: 'prime' },
          { pointIndex: 6, label: 'Прайм (6)', type: 'prime' },
          { pointIndex: 5, label: 'Замкнути Прайм!', type: 'prime' },
          { pointIndex: 4, label: 'Прайм (4)', type: 'prime' },
          { pointIndex: 3, label: 'Прайм (3)', type: 'prime' },
          { pointIndex: 1, label: 'Пастка Чорних', type: 'blot' },
        ],
      },
    ],
  },
  {
    id: 'anchors-and-golden-point',
    level: 4,
    category: 'Позиційна гра',
    title: 'Анкери та Золотий Пункт (Golden Point)',
    description: 'Як надійно захищатися від бліц-атаки суперника та чому 5-й і 20-й пункти вирішують долю більшості партій.',
    iconName: 'Anchor',
    steps: [
      {
        id: 'make-golden-point',
        title: 'Крок 4.1: Створення Золотого пункту (5-й пункт)',
        instruction: 'Випав класичний дебютний кидок 3-1. Займіть Золотий 5-й пункт, зігравши з 8 на 5 (3) та з 6 на 5 (1)!',
        theory: '5-й пункт називають «Золотим» (Golden Point), оскільки він є ключовим плацдармом у власному домі. Він не дає супернику вільно входити з бару і служить фундаментом для створення прайму.',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[23] = { index: 24, count: 2, color: 'white' };
          b.points[12] = { index: 13, count: 5, color: 'white' };
          b.points[7] = { index: 8, count: 3, color: 'white' };
          b.points[5] = { index: 6, count: 5, color: 'white' };
          b.points[0] = { index: 1, count: 2, color: 'black' };
          b.points[11] = { index: 12, count: 5, color: 'black' };
          return b;
        })(),
        dice: [3, 1],
        playerTurn: 'white',
        targetMove: [
          { from: 8, to: 5, dieUsed: 3 },
          { from: 6, to: 5, dieUsed: 1 },
        ],
        explanationOnSuccess: 'Найкращий дебютний хід в історії нард! Кидок 3-1 вважається найсильнішим відкриттям у грі.',
        hint: 'Перемістіть одну шашку з 8-го на 5-й (3) та одну з 6-го на 5-й (1).',
        keyRule: 'Кидок 3-1 завжди грають як створення Золотого 5-го пункту (8/5, 6/5).',
        customAnnotations: [
          { pointIndex: 5, label: 'Золотий Пункт (5)', type: 'golden' },
          { pointIndex: 8, label: 'Будівельник (8)', type: 'anchor' },
          { pointIndex: 6, label: 'Будівельник (6)', type: 'anchor' },
        ],
      },
      {
        id: 'advanced-anchor-20',
        title: 'Крок 4.2: Створення передового Анкера (20-й пункт)',
        instruction: 'Кидок 4-2. Закріпіть передовий анкер на 20-му пункті шашкою з 24-го (кубик 4), а потім просуньте шашку з 13-го пункту на 11-й (кубик 2).',
        theory: '«Анкер» (Anchor) — це закритий пункт (2+ шашки) у домі суперника. Він захищає вас від розгрому (бліцу), гарантує безпечне повернення з бару та створює постійну загрозу вибивання для суперника.',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[23] = { index: 24, count: 2, color: 'white' };
          b.points[19] = { index: 20, count: 1, color: 'white' };
          b.points[12] = { index: 13, count: 5, color: 'white' };
          return b;
        })(),
        dice: [4, 2],
        playerTurn: 'white',
        targetMove: [
          { from: 24, to: 20, dieUsed: 4 },
          { from: 13, to: 11, dieUsed: 2 },
        ],
        explanationOnSuccess: 'Чудово! Тепер у вас надійний анкер на 20-му пункті та активна шашка на 11-му пункті.',
        hint: 'Перемістіть шашку з 24-го пункту на 20-й (кубик 4), а потім шашку з 13-го на 11-й (кубик 2).',
        keyRule: 'Анкер у домі суперника нейтралізує атаку та рятує від Марсу.',
        customAnnotations: [
          { pointIndex: 20, label: 'Анкер 20 (Золотий)', type: 'anchor' },
          { pointIndex: 24, label: 'Задні шашки (24)', type: 'target' },
          { pointIndex: 11, label: 'Форпост (11)', type: 'target' },
        ],
      },
    ],
  },
  {
    id: 'bear-off-and-race',
    level: 5,
    category: 'Фінальна стадія',
    title: 'Зняття шашок (Bear-off) та Гонка (Pip Count)',
    description: 'Правила та тонкощі фінальної фази гри: коли і як знімати шашки з дошки, техніка безпечного зняття.',
    iconName: 'Trophy',
    steps: [
      {
        id: 'basic-bear-off',
        title: 'Крок 5.1: Зняття шашок з дошки (Bear-off)',
        instruction: 'Всі ваші 15 шашок вже у вашому домі (пункти 1–6). Кидок 6 і 4. Зніміть дві шашки з дошки: з 6-го та 4-го пунктів!',
        theory: 'Коли ВСІ 15 ваших шашок опинилися у вашому домі (пункти 1-6), ви отримуєте право викидати (знімати) їх за межі дошки. Перший гравець, який зніме всі 15 шашок, перемагає!',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.points[5] = { index: 6, count: 3, color: 'white' };
          b.points[4] = { index: 5, count: 3, color: 'white' };
          b.points[3] = { index: 4, count: 3, color: 'white' };
          b.points[2] = { index: 3, count: 3, color: 'white' };
          b.points[1] = { index: 2, count: 3, color: 'white' };
          return b;
        })(),
        dice: [6, 4],
        playerTurn: 'white',
        targetMove: [
          { from: 6, to: 'off', dieUsed: 6 },
          { from: 4, to: 'off', dieUsed: 4 },
        ],
        explanationOnSuccess: 'Вітаємо! Дві шашки успішно зняті з дошки (Bear-off).',
        hint: 'Натисніть на шашку на 6-му пункті і зніміть її за кубиком 6, потім з 4-го за кубиком 4.',
        keyRule: 'Знімати шашки можна тільки тоді, коли ВСІ ваші 15 шашок знаходяться у вашому домі.',
        customAnnotations: [
          { pointIndex: 6, label: 'Зняти (кубик 6)', type: 'target' },
          { pointIndex: 4, label: 'Зняти (кубик 4)', type: 'target' },
        ],
      },
    ],
  },
  {
    id: 'gammon-and-victory-types',
    level: 6,
    category: 'Види перемог та Очки',
    title: 'Марс (Gammon) та Кокс (Backgammon)',
    description: 'Дізнайтеся, як перемагати з подвійним (2x) та потрійним (3x) результатом, і чому захисні анкери рятують від розгрому.',
    iconName: 'Crown',
    steps: [
      {
        id: 'understanding-gammon',
        title: 'Крок 6.1: Що таке Марс (Gammon) та як його уникнути',
        instruction: 'Ви граєте Білими. Чорні вже зняли 13 шашок і готові перемогти наступного ходу. Кидок 5 і 3. Зніміть свою першу шашку з 5-го або 3-го пункту, щоб уникнути Марсу!',
        theory: 'У нардах є 3 градації перемоги:\n\n1. 🏆 Звичайна перемога (1 очко, Single): переможець зняв 15 шашок, а той, хто програв, встиг зняти хоча б 1 шашку.\n\n2. 🔥 МАРС (Gammon, 2 очки): переможець зняв усі 15 шашок, а супротивник НЕ ВСТИГ ЗНЯТИ ЖОДНОЇ шашки! Очки за партію подвоюються (2x).\n\n3. ⚡ КОКС (Backgammon, 3 очки): супротивник не зняв жодної шашки І ДОДАТКОВО має хоча б одну шашку на Барі або у вашому Домі (пункти 1–6). Очки потроюються (3x)!\n\nГоловне правило порятунку: якщо суперник випереджає вас у гонці, прагніть зняти хоча б одну шашку за будь-яку ціну, щоб не віддати супернику 2x очки за Марс.',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.off.black = 13;
          b.points[23] = { index: 24, count: 2, color: 'black' };
          b.points[4] = { index: 5, count: 4, color: 'white' };
          b.points[2] = { index: 3, count: 4, color: 'white' };
          b.points[1] = { index: 2, count: 4, color: 'white' };
          b.points[0] = { index: 1, count: 3, color: 'white' };
          return b;
        })(),
        dice: [5, 3],
        playerTurn: 'white',
        targetMove: [
          { from: 5, to: 'off', dieUsed: 5 },
          { from: 3, to: 'off', dieUsed: 3 },
        ],
        explanationOnSuccess: 'Чудово! Ви встигли зняти свої шашки з дошки. Навіть якщо Чорні виграють наступним ходом, вони отримають лише 1 звичайне очко замість 2 очок за Марс!',
        hint: 'Зніміть шашку з 5-го пункту (кубик 5) та з 3-го пункту (кубик 3).',
        keyRule: 'Зняття хоча б однієї своєї шашки повністю рятує від поразки Марсом (Gammon, 2x).',
        customAnnotations: [
          { pointIndex: 5, label: 'Порятунок від Марсу (5)', type: 'target' },
          { pointIndex: 3, label: 'Зняти шашку (3)', type: 'target' },
          { pointIndex: 24, label: 'Фініш Чорних (2 шаш.)', type: 'anchor' },
        ],
      },
      {
        id: 'understanding-backgammon-coke',
        title: 'Крок 6.2: Кокс (Backgammon, 3x очки)',
        instruction: 'Ви граєте Білими і завершуєте розгром! Ви вже зняли 13 шашок, а чорна шашка застрягла на Барі. Кидок 6 і 4. Зніміть дві останні шашки з 6-го та 4-го пунктів і здобудьте перемогу Коксом (3 очки)!',
        theory: 'КОКС (Backgammon) — це найвищий тріумф у нардах. Якщо ви зняли всі 15 шашок, а супротивник не зняв жодної і все ще має шашку на Барі або у вашому домі, ви отримуєте 3x очки (або 3 очки в матчі).',
        boardSetup: (() => {
          const b = makeEmptyBoard();
          b.off.white = 13;
          b.points[5] = { index: 6, count: 1, color: 'white' };
          b.points[3] = { index: 4, count: 1, color: 'white' };
          b.bar.black = 1; // Black checker trapped on bar!
          b.points[11] = { index: 12, count: 5, color: 'black' };
          b.points[16] = { index: 17, count: 5, color: 'black' };
          b.points[18] = { index: 19, count: 4, color: 'black' };
          return b;
        })(),
        dice: [6, 4],
        playerTurn: 'white',
        targetMove: [
          { from: 6, to: 'off', dieUsed: 6 },
          { from: 4, to: 'off', dieUsed: 4 },
        ],
        explanationOnSuccess: 'Тріумфальна перемога КОКСОМ (3x)! Усі ваші шашки знято, а Чорні залишилися з 0 знятими та шашкою на Барі. Ви отримуєте максимальні 3 очки!',
        hint: 'Зніміть останню шашку з 6-го пункту (кубик 6) та шашку з 4-го пункту (кубик 4).',
        keyRule: 'Кокс приносить 3 очки, Марс — 2 очки, Звичайна перемога — 1 очко.',
        customAnnotations: [
          { pointIndex: 6, label: 'Фініш 6 (Кокс!)', type: 'golden' },
          { pointIndex: 4, label: 'Фініш 4 (Кокс!)', type: 'golden' },
        ],
      },
    ],
  },
];
