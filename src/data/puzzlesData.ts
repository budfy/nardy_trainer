import { Puzzle } from '../types/backgammon';

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

export const BACKGAMMON_PUZZLES: Puzzle[] = [
  {
    id: 'opening-3-1',
    title: 'Ідеальний дебют 3-1: Золотий пункт',
    difficulty: 'Легкий',
    category: 'Дебют',
    scenario: 'Перший хід партії. Вам випав класичний кидок 3-1. Знайдіть найкраще позиційне рішення для Білих.',
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
    dice: [3, 1],
    playerTurn: 'white',
    bestMoves: [
      { from: 8, to: 5, dieUsed: 3 },
      { from: 6, to: 5, dieUsed: 1 },
    ],
    acceptableMoves: [
      [
        { from: 6, to: 5, dieUsed: 1 },
        { from: 8, to: 5, dieUsed: 3 },
      ],
    ],
    explanationBest: 'Блискуче! 8/5, 6/5 — це створення Золотого 5-го пункту (Golden Point). Це найсильніший хід кидком 3-1 у світових нардах.',
    blunderExplanation: 'Будь-який інший хід (наприклад, 13/10, 24/23) втрачає унікальну можливість негайно закріпити ключовий пункт у власному домі без ризику.',
    strategicConcept: '5-й пункт заважає супернику входити з бару і будує нездоланну основу для прайму.',
  },
  {
    id: 'attack-vs-safety-6-1',
    title: 'Бар-пойнт (Кидок 6-1)',
    difficulty: 'Середній',
    category: 'Праймінг',
    scenario: 'У вас випало 6-1. Ви можете створити 7-й пункт (бар-пойнт) або просунути задню шашку. Що оберете?',
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
    dice: [6, 1],
    playerTurn: 'white',
    bestMoves: [
      { from: 13, to: 7, dieUsed: 6 },
      { from: 8, to: 7, dieUsed: 1 },
    ],
    acceptableMoves: [
      [
        { from: 8, to: 7, dieUsed: 1 },
        { from: 13, to: 7, dieUsed: 6 },
      ],
    ],
    explanationBest: 'Чудово! Хід 13/7, 8/7 надійно закриває 7-й пункт (Bar-point). Це створює барʼєр для шашок суперника на 24-му пункті.',
    blunderExplanation: 'Рух однією шашкою залишає відкритий блот під прямим ударом чорних.',
    strategicConcept: '7-й пункт (бар-пойнт) блокує вихід задніх шашок суперника 6-кою.',
  },
  {
    id: 'blitz-opportunity-4-3',
    title: 'Бліц-атака: Hit & Make Point (Кидок 4-3)',
    difficulty: 'Складний',
    category: 'Бліц',
    scenario: 'Чорні залишили одиночну шашку (блот) на 4-му пункті у вашому домі. Кидок 4-3. Знайдіть найбільш руйнівний хід.',
    boardSetup: (() => {
      const b = makeEmptyBoard();
      b.points[7] = { index: 8, count: 3, color: 'white' };
      b.points[6] = { index: 7, count: 2, color: 'white' };
      b.points[5] = { index: 6, count: 4, color: 'white' };
      b.points[3] = { index: 4, count: 1, color: 'black' }; // Opponent blot!
      b.points[0] = { index: 1, count: 2, color: 'black' };
      return b;
    })(),
    dice: [4, 3],
    playerTurn: 'white',
    bestMoves: [
      { from: 8, to: 4, dieUsed: 4, isHit: true },
      { from: 7, to: 4, dieUsed: 3 },
    ],
    acceptableMoves: [
      [
        { from: 7, to: 4, dieUsed: 3, isHit: true },
        { from: 8, to: 4, dieUsed: 4 },
      ],
      [
        { from: 8, to: 4, dieUsed: 4 },
        { from: 7, to: 4, dieUsed: 3 },
      ],
    ],
    explanationBest: 'Тотальний розгром! Вибито блот чорних на 4-му пункті та одразу закрито його другою шашкою (Hit and Make Point). Чорні на барі, а 4-й пункт під вашим контролем!',
    blunderExplanation: 'Якщо не закрити 4-й пункт після удару, ви залишаєте свій власний блот під прямим ударом з бару.',
    strategicConcept: 'Hit and Make — найпотужніша техніка атаки в нардах.',
  },
  {
    id: 'lovers-leap-6-5',
    title: 'Стрибок коханців (Lover\'s Leap 6-5)',
    difficulty: 'Середній',
    category: 'Анкери',
    scenario: 'Ваші задні шашки на 24-му пункті під загрозою оточення. Кидок 6-5. Врятуйте одну шашку безпечним супер-стрибком на 13-й пункт (24 -> 13)!',
    boardSetup: (() => {
      const b = makeEmptyBoard();
      b.points[23] = { index: 24, count: 2, color: 'white' };
      b.points[12] = { index: 13, count: 4, color: 'white' };
      b.points[7] = { index: 8, count: 3, color: 'white' };
      b.points[5] = { index: 6, count: 5, color: 'white' };
      b.points[16] = { index: 17, count: 3, color: 'black' };
      b.points[18] = { index: 19, count: 4, color: 'black' };
      b.points[19] = { index: 20, count: 3, color: 'black' };
      return b;
    })(),
    dice: [6, 5],
    playerTurn: 'white',
    bestMoves: [
      { from: 24, to: 18, dieUsed: 6 },
      { from: 18, to: 13, dieUsed: 5 },
    ],
    acceptableMoves: [
      [
        { from: 24, to: 19, dieUsed: 5 },
        { from: 19, to: 13, dieUsed: 6 },
      ],
      [
        { from: 24, to: 18, dieUsed: 6 },
        { from: 18, to: 13, dieUsed: 5 },
      ],
    ],
    explanationBest: 'Фантастично! Хід 24/13 (Lover\'s Leap) рятує глибоку шашку від прайму чорних та приєднує її до надійного форпосту на 13-му пункті.',
    blunderExplanation: 'Спроба піти з 13-го або 8-го пунктів залишає задні шашки в капкані чорних без жодних шансів на легку втечу.',
    strategicConcept: 'Кидок 6-5 з 24-го пункту долає рівно 11 пунктів прямо в безпечну гавань 13-го пункту.',
  },
  {
    id: 'bear-off-safety-5-2',
    title: 'Безпечне зняття шашок під прицілом (5-2)',
    difficulty: 'Гросмейстер',
    category: 'Ендшпіль / Bear-off',
    scenario: 'Ви у фазі Bear-off, але чорні тримають небезпечний анкер на вашому 1-му пункті! Кидок 5-2. Як зняти шашки і не підставити блот?',
    boardSetup: (() => {
      const b = makeEmptyBoard();
      b.points[5] = { index: 6, count: 2, color: 'white' };
      b.points[4] = { index: 5, count: 2, color: 'white' };
      b.points[3] = { index: 4, count: 2, color: 'white' };
      b.points[2] = { index: 3, count: 2, color: 'white' };
      b.points[1] = { index: 2, count: 2, color: 'white' };
      b.points[0] = { index: 1, count: 2, color: 'black' }; // Black anchor lurking!
      return b;
    })(),
    dice: [5, 2],
    playerTurn: 'white',
    bestMoves: [
      { from: 5, to: 'off', dieUsed: 5 },
      { from: 2, to: 'off', dieUsed: 2 },
    ],
    acceptableMoves: [
      [
        { from: 2, to: 'off', dieUsed: 2 },
        { from: 5, to: 'off', dieUsed: 5 },
      ],
      [
        { from: 5, to: 'off', dieUsed: 5 },
        { from: 2, to: 'off', dieUsed: 2 },
      ],
    ],
    explanationBest: 'Ідеальне чисте зняття: зняли з 5-го та з 2-го пунктів, залишивши всі інші пункти парними (по 2 шашки), без жодного відкритого блота!',
    blunderExplanation: 'Якщо посунути шашку всередині дому замість зняття, ви порушите парність і ризикуєте отримати удар під наступними кубиками.',
    strategicConcept: 'При ворожому анкері в домі тримайте пункти парними, щоб уникнути змушених блотів під ударом з дистанції 1-6.',
  },
];
