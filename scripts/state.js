/* ===== ゲーム状態管理 & セーブ ===== */
(function (global) {
  'use strict';

  const SAVE_KEY = 'nonbiri_farm_save_v1';
  const SAVE_VERSION = 1;

  /**
   * State 構造:
   * {
   *   v: セーブバージョン
   *   coins: 現在所持コイン
   *   tickets: ガチャチケット
   *   totalEarned: 累計獲得コイン
   *   collection: { [animalId]: { lv: number, count: number, isNew: bool } }
   *   farm: [animalId or null] * FARM_SLOTS  // 配置
   *   prestigePoints: int
   *   boostUntil: epoch ms (0 if none)
   *   lastTick: epoch ms (オフライン計算用)
   *   stats: { gachas: number, prestiges: number }
   * }
   */

  function defaultState() {
    return {
      v: SAVE_VERSION,
      coins: 50, // 初期コイン(ガチャできない=遊べないのを避ける)
      tickets: 3, // 初回サービスチケット
      totalEarned: 0,
      collection: {},
      farm: new Array(GAME_DATA.FARM_SLOTS).fill(null),
      prestigePoints: 0,
      boostUntil: 0,
      lastTick: Date.now(),
      stats: { gachas: 0, prestiges: 0 },
      // デイリーボーナス連続ログイン
      daily: { lastClaimDay: '', streak: 0 },
      // 解除済み実績ID
      achievementsUnlocked: {},
    };
  }

  let state = defaultState();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;
      // 簡易マイグレーション
      if (data.v !== SAVE_VERSION) {
        // 将来用
      }
      // 不足プロパティを補完
      const merged = Object.assign(defaultState(), data);
      merged.farm = (data.farm && data.farm.length === GAME_DATA.FARM_SLOTS)
        ? data.farm
        : new Array(GAME_DATA.FARM_SLOTS).fill(null);
      merged.collection = data.collection || {};
      merged.stats = Object.assign({ gachas: 0, prestiges: 0 }, data.stats || {});
      merged.daily = Object.assign({ lastClaimDay: '', streak: 0 }, data.daily || {});
      merged.achievementsUnlocked = data.achievementsUnlocked || {};
      state = merged;
      return true;
    } catch (e) {
      console.warn('Load failed', e);
      return false;
    }
  }

  function save() {
    try {
      state.lastTick = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed', e);
    }
  }

  function reset() {
    state = defaultState();
    save();
  }

  function get() { return state; }

  /**
   * オフライン獲得 (offline計算)
   * lastTick から現在時刻までの経過秒に基づき、オフライン獲得を計算
   * @returns {number} 獲得コイン
   */
  function applyOfflineGains(getBaseCpsFn) {
    const now = Date.now();
    const elapsedMs = Math.max(0, now - (state.lastTick || now));
    const elapsedSec = Math.min(elapsedMs / 1000, GAME_DATA.OFFLINE_MAX_SEC);
    if (elapsedSec < 5) return 0; // 5秒未満は無視

    const cps = getBaseCpsFn(); // ブースト無視のベース
    const gain = Math.floor(cps * elapsedSec * GAME_DATA.OFFLINE_EFFICIENCY);
    if (gain > 0) {
      state.coins += gain;
      state.totalEarned += gain;
    }
    state.lastTick = now;
    return gain;
  }

  global.GameState = {
    SAVE_KEY,
    load, save, reset, get,
    applyOfflineGains,
  };
})(window);
