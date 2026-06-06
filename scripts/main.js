/* ===== エントリーポイント ===== */
(function () {
  'use strict';

  function start() {
    GameState.load();

    // オフライン進行を反映 (ベースCPSのみ使用)
    const offlineGain = GameState.applyOfflineGains(Game.farmBaseCps);
    if (offlineGain > 0) {
      // オフライン報酬ダイアログ簡易
      setTimeout(() => {
        UI.toast(`おかえり！オフライン中に +${UI.formatNum(offlineGain)} 🪙 ゲット`, 2800);
      }, 400);
    }

    // UI バインド
    UI.bindTabs();
    UI.bindGachaModal();
    UI.bindGachaActions();
    UI.bindShop();
    UI.bindRewardAd();
    UI.bindCollectBtn();
    UI.bindDaily();
    UI.bindAchievements();
    UI.renderAll();

    // メインゲームループ (10fps tick + 4fps UI)
    const TICK_MS = 100;
    let lastTick = performance.now();
    setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      Game.tick(dt);
    }, TICK_MS);

    // UI 更新
    setInterval(() => {
      UI.renderResources();
    }, 250);

    // 実績バナーは少し低頻度で更新
    setInterval(() => {
      UI.renderAchievementsBanner();
      UI.renderPrestigeProgress();
    }, 1000);

    // 牧場グリッドはリソース表記より頻度低くてOK
    setInterval(() => {
      // 動物の Lv 表示更新などのために
      // タブが farm のときだけ
      const farmActive = document.getElementById('tab-farm').classList.contains('is-active');
      if (farmActive) UI.renderFarm();
    }, 1500);

    // 自動セーブ (5秒毎)
    setInterval(() => GameState.save(), 5000);

    // 離脱時セーブ
    window.addEventListener('beforeunload', () => GameState.save());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') GameState.save();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
