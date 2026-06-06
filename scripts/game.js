/* ===== ゲームコアロジック (生産・ブースト・プレステージ) ===== */
(function (global) {
  'use strict';

  /**
   * 動物 1 体あたりの生産量 (coin/sec)
   * baseCps * LEVEL_MULT^(lv-1)
   */
  function animalCps(animalId) {
    const state = GameState.get();
    const a = getAnimalById(animalId);
    if (!a) return 0;
    const entry = state.collection[animalId];
    if (!entry) return 0;
    const base = GAME_DATA.RARITY_BASE_CPS[a.rarity];
    return base * Math.pow(GAME_DATA.LEVEL_MULT, entry.lv - 1);
  }

  /**
   * 図鑑コンプリート率に応じた全体ボーナス倍率
   * 完全コンプで +50% (動物数 -> パーセンテージ計算)
   */
  function collectionBonus() {
    const state = GameState.get();
    const total = GAME_DATA.ANIMALS.length;
    const owned = Object.keys(state.collection).length;
    return 1 + (0.5 * owned / total);
  }

  /**
   * プレステージボーナス倍率
   */
  function prestigeBonus() {
    const state = GameState.get();
    return 1 + state.prestigePoints * GAME_DATA.PRESTIGE_BONUS_PER_PP;
  }

  /**
   * ブースト倍率 (ブースト中なら 2倍など)
   */
  function boostMult() {
    const state = GameState.get();
    if (state.boostUntil && Date.now() < state.boostUntil) {
      return GAME_DATA.SHOP_BOOST_MULT; // どのブーストも同じ倍率
    }
    return 1;
  }

  /**
   * 牧場全体の CPS (ブースト適用前のベース)
   */
  function farmBaseCps() {
    const state = GameState.get();
    let sum = 0;
    // 配置されているユニークな動物を加算 (同一動物は1スロット分のみ)
    const counted = new Set();
    for (const id of state.farm) {
      if (id && !counted.has(id)) {
        sum += animalCps(id);
        counted.add(id);
      }
    }
    return sum * collectionBonus() * prestigeBonus();
  }

  /**
   * 牧場全体の CPS (ブースト適用後)
   */
  function farmTotalCps() {
    return farmBaseCps() * boostMult();
  }

  /**
   * 1tick の進行 (dt = 経過秒)
   */
  function tick(dt) {
    const state = GameState.get();
    const gain = farmTotalCps() * dt;
    if (gain > 0) {
      state.coins += gain;
      state.totalEarned += gain;
    }
  }

  /**
   * タップボーナス
   */
  function tapBonus() {
    const cps = farmTotalCps();
    const bonus = Math.max(GAME_DATA.TAP_BONUS_MIN, Math.floor(cps * GAME_DATA.TAP_BONUS_SECONDS));
    const state = GameState.get();
    state.coins += bonus;
    state.totalEarned += bonus;
    return bonus;
  }

  /**
   * プレステージ実行: 取得予定PPを計算
   */
  function prestigePoints() {
    const state = GameState.get();
    return Math.floor(Math.sqrt(state.totalEarned / 1e6));
  }

  function canPrestige() {
    return prestigePoints() >= 1;
  }

  function doPrestige() {
    const state = GameState.get();
    const pp = prestigePoints();
    if (pp < 1) return { ok: false };
    const newPP = state.prestigePoints + pp;
    // リセット (PPと統計は保持)
    state.coins = 100;
    state.tickets = 5;
    state.totalEarned = 0;
    state.collection = {};
    state.farm = new Array(GAME_DATA.FARM_SLOTS).fill(null);
    state.boostUntil = 0;
    state.prestigePoints = newPP;
    state.stats.prestiges += 1;
    return { ok: true, pp, totalPP: newPP };
  }

  /**
   * ブースト発動
   */
  function applyBoost(seconds) {
    const state = GameState.get();
    const now = Date.now();
    const base = Math.max(now, state.boostUntil || 0);
    state.boostUntil = base + seconds * 1000;
  }

  /**
   * ショップ購入処理
   */
  function buy(item) {
    const state = GameState.get();
    if (item === 'ticket-1') {
      if (state.coins < 500) return { ok: false, msg: 'コイン不足' };
      state.coins -= 500;
      state.tickets += 1;
      return { ok: true, msg: 'チケット×1を入手' };
    }
    if (item === 'boost-5') {
      if (state.coins < 300) return { ok: false, msg: 'コイン不足' };
      state.coins -= 300;
      applyBoost(GAME_DATA.SHOP_BOOST_SEC);
      return { ok: true, msg: 'スピードアップ発動！(5分)' };
    }
    return { ok: false, msg: '不明な商品' };
  }

  global.Game = {
    animalCps,
    collectionBonus,
    prestigeBonus,
    boostMult,
    farmBaseCps,
    farmTotalCps,
    tick,
    tapBonus,
    prestigePoints,
    canPrestige,
    doPrestige,
    applyBoost,
    buy,
  };
})(window);
