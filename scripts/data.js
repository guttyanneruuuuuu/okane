/* ===== ゲーム定数 & 動物データ ===== */
(function (global) {
  'use strict';

  // 牧場マス数
  const FARM_SLOTS = 9;

  // ガチャコスト
  const GACHA_COST_1 = 100;
  const GACHA_COST_10 = 900; // 10連は1回分お得

  // レアリティ確率 (%)
  // ★1 60 / ★2 25 / ★3 10 / ★4 4 / ★5 1
  const RARITY_RATES = [0, 60, 25, 10, 4, 1]; // index = rarity (1..5)

  // レアリティごとの基本生産力 (coin/sec @ Lv1)
  const RARITY_BASE_CPS = [0, 1, 5, 25, 120, 600];

  // 同じ動物を引いたときのレベルアップ倍率: Lv N → Lv N+1 で 1.5倍
  const LEVEL_MULT = 1.5;

  // プレステージ計算
  // 累計コインに応じて prestige point(PP) を獲得
  // PP数 = floor( sqrt(totalCoinsEarned / 1e6) )
  // 各 PP は +5% 永続生産力ブースト
  const PRESTIGE_BONUS_PER_PP = 0.05;

  // 動物データ (id, name, emoji, rarity)
  const ANIMALS = [
    // ★1 (一般的な動物)
    { id: 'chick',   name: 'ヒヨコ',     emoji: '🐥', rarity: 1 },
    { id: 'rabbit',  name: 'ウサギ',     emoji: '🐰', rarity: 1 },
    { id: 'mouse',   name: 'ネズミ',     emoji: '🐭', rarity: 1 },
    { id: 'frog',    name: 'カエル',     emoji: '🐸', rarity: 1 },
    { id: 'duck',    name: 'アヒル',     emoji: '🦆', rarity: 1 },

    // ★2
    { id: 'sheep',   name: 'ヒツジ',     emoji: '🐑', rarity: 2 },
    { id: 'pig',     name: 'ブタ',       emoji: '🐷', rarity: 2 },
    { id: 'goat',    name: 'ヤギ',       emoji: '🐐', rarity: 2 },
    { id: 'dog',     name: 'イヌ',       emoji: '🐶', rarity: 2 },
    { id: 'cat',     name: 'ネコ',       emoji: '🐱', rarity: 2 },

    // ★3
    { id: 'cow',     name: 'ウシ',       emoji: '🐄', rarity: 3 },
    { id: 'horse',   name: 'ウマ',       emoji: '🐴', rarity: 3 },
    { id: 'fox',     name: 'キツネ',     emoji: '🦊', rarity: 3 },
    { id: 'owl',     name: 'フクロウ',   emoji: '🦉', rarity: 3 },
    { id: 'turkey',  name: 'シチメンチョウ', emoji: '🦃', rarity: 3 },

    // ★4
    { id: 'panda',   name: 'パンダ',     emoji: '🐼', rarity: 4 },
    { id: 'lion',    name: 'ライオン',   emoji: '🦁', rarity: 4 },
    { id: 'tiger',   name: 'トラ',       emoji: '🐯', rarity: 4 },
    { id: 'koala',   name: 'コアラ',     emoji: '🐨', rarity: 4 },

    // ★5 (伝説)
    { id: 'unicorn', name: 'ユニコーン', emoji: '🦄', rarity: 5 },
    { id: 'dragon',  name: 'ドラゴン',   emoji: '🐲', rarity: 5 },
    { id: 'phoenix', name: 'フェニックス', emoji: '🔥', rarity: 5 },
  ];

  // タップでのボーナス (現在CPSの数秒分 + 最低保証)
  const TAP_BONUS_SECONDS = 2;
  const TAP_BONUS_MIN = 1;

  // ブースト
  const REWARD_AD_BOOST_MULT = 2.0;
  const REWARD_AD_BOOST_SEC = 60;
  const SHOP_BOOST_MULT = 2.0;
  const SHOP_BOOST_SEC = 5 * 60;

  // オフライン進行: 最大8時間
  const OFFLINE_MAX_SEC = 8 * 60 * 60;
  // オフライン効率 50%
  const OFFLINE_EFFICIENCY = 0.5;

  // 公開
  global.GAME_DATA = {
    FARM_SLOTS,
    GACHA_COST_1,
    GACHA_COST_10,
    RARITY_RATES,
    RARITY_BASE_CPS,
    LEVEL_MULT,
    PRESTIGE_BONUS_PER_PP,
    ANIMALS,
    TAP_BONUS_SECONDS,
    TAP_BONUS_MIN,
    REWARD_AD_BOOST_MULT,
    REWARD_AD_BOOST_SEC,
    SHOP_BOOST_MULT,
    SHOP_BOOST_SEC,
    OFFLINE_MAX_SEC,
    OFFLINE_EFFICIENCY,
  };

  // 便利関数: id から動物データを取得
  global.getAnimalById = function (id) {
    return ANIMALS.find(a => a.id === id);
  };
})(window);
