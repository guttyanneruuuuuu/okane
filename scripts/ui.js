/* ===== UI 描画 & イベント処理 ===== */
(function (global) {
  'use strict';

  // ---- ヘルパー ----
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  function formatNum(n) {
    n = Math.floor(n);
    if (n < 1000) return n.toString();
    const units = ['', 'K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad'];
    let i = 0;
    let v = n;
    while (v >= 1000 && i < units.length - 1) {
      v /= 1000;
      i++;
    }
    return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0) + units[i];
  }

  function rarityStars(n) {
    return '★'.repeat(n);
  }

  function toast(msg, durationMs = 1700) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('hidden'), durationMs);
  }

  // ---- タブ切替 ----
  function bindTabs() {
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        $$('.tab').forEach(b => b.classList.toggle('is-active', b === btn));
        $$('.tab-panel').forEach(p => {
          p.classList.toggle('is-active', p.id === 'tab-' + id);
        });
        // 必要なら再描画
        if (id === 'book') renderBook();
        if (id === 'farm') renderFarm();
      });
    });
  }

  // ---- ヘッダーリソース ----
  function renderResources() {
    const s = GameState.get();
    $('#coin-value').textContent = formatNum(s.coins);
    $('#ticket-value').textContent = s.tickets;
    const cps = Game.farmTotalCps();
    $('#cps-value').textContent = formatNum(cps);

    // ガチャコスト表示
    $('#gacha-cost-1').textContent = formatNum(GAME_DATA.GACHA_COST_1);
    $('#gacha-cost-10').textContent = formatNum(GAME_DATA.GACHA_COST_10);

    // ブーストインジケーター
    const collectBtn = $('#collect-btn');
    if (s.boostUntil && Date.now() < s.boostUntil) {
      const remain = Math.ceil((s.boostUntil - Date.now()) / 1000);
      collectBtn.innerHTML = `タップで＋ボーナス <span class="boost-indicator">⚡ ${remain}s</span>`;
    } else {
      collectBtn.textContent = 'タップで＋ボーナス';
    }
  }

  // ---- レアリティ確率 ----
  function renderRates() {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById('rate-' + i);
      if (el) el.textContent = GAME_DATA.RARITY_RATES[i].toFixed(0);
    }
  }

  // ---- 牧場グリッド ----
  function renderFarm() {
    const grid = $('#farm-grid');
    const s = GameState.get();
    grid.innerHTML = '';
    for (let i = 0; i < GAME_DATA.FARM_SLOTS; i++) {
      const id = s.farm[i];
      const cell = document.createElement('div');
      cell.className = 'farm-cell';
      if (id) {
        const a = getAnimalById(id);
        const entry = s.collection[id];
        cell.classList.add('has-animal');
        cell.innerHTML = `
          <div class="emoji">${a.emoji}</div>
          <div class="rarity-stars rarity r${a.rarity}">${rarityStars(a.rarity)}</div>
          <div class="level">Lv${entry ? entry.lv : 1}</div>
        `;
        cell.title = `${a.name} (${a.rarity}★) Lv${entry.lv} - ${formatNum(Game.animalCps(id))} 🪙/秒`;
        cell.addEventListener('click', () => {
          // セルタップでも少しボーナス
          tapBonusAnimation(cell);
        });
      } else {
        cell.innerHTML = '<div class="empty-label">空き</div>';
      }
      grid.appendChild(cell);
    }
  }

  function tapBonusAnimation(cell) {
    const gain = Game.tapBonus();
    const pop = document.createElement('div');
    pop.className = 'coin-pop';
    pop.textContent = '+' + formatNum(gain) + ' 🪙';
    cell.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
    renderResources();
  }

  // ---- 図鑑 ----
  function renderBook() {
    const grid = $('#book-grid');
    const s = GameState.get();
    grid.innerHTML = '';
    GAME_DATA.ANIMALS.forEach(a => {
      const entry = s.collection[a.id];
      const cell = document.createElement('div');
      cell.className = 'book-cell r' + a.rarity;
      if (entry) {
        cell.innerHTML = `${a.emoji}<div class="nm">${a.name}</div><div class="lv">Lv${entry.lv}</div>`;
        cell.title = `${a.name} - ${rarityStars(a.rarity)} - Lv${entry.lv}`;
      } else {
        cell.classList.add('locked');
        cell.innerHTML = `${a.emoji}<div class="nm">???</div>`;
      }
      grid.appendChild(cell);
    });
    const owned = Object.keys(s.collection).length;
    const total = GAME_DATA.ANIMALS.length;
    $('#book-progress').textContent = `${owned} / ${total}`;
    const bonus = Math.round((Game.collectionBonus() - 1) * 100);
    $('#book-bonus').textContent = `+${bonus}%`;
  }

  // ---- ガチャ結果モーダル ----
  function showGachaResult(results) {
    const grid = $('#gacha-result-grid');
    grid.innerHTML = '';
    // ソート: レアリティ降順
    const sorted = [...results].sort((a, b) => b.animal.rarity - a.animal.rarity);
    sorted.forEach((r, idx) => {
      const item = document.createElement('div');
      item.className = 'result-item r' + r.animal.rarity + (r.isNew ? ' new' : '');
      item.style.animationDelay = (idx * 60) + 'ms';
      item.innerHTML = `
        <div class="em">${r.animal.emoji}</div>
        <div class="nm">${r.animal.name}</div>
        <div class="rr rarity r${r.animal.rarity}">${rarityStars(r.animal.rarity)}</div>
        ${r.isNew ? '<div class="new-badge">NEW</div>' : `<div class="new-badge">Lv${r.level}</div>`}
      `;
      grid.appendChild(item);
    });
    $('#gacha-result').classList.remove('hidden');
  }

  function bindGachaModal() {
    $('#gacha-result-close').addEventListener('click', () => {
      $('#gacha-result').classList.add('hidden');
      renderAll();
    });
    $('#gacha-result .modal-bg').addEventListener('click', () => {
      $('#gacha-result').classList.add('hidden');
      renderAll();
    });
  }

  // ---- ガチャボタン ----
  function bindGachaActions() {
    $('#gacha-1-btn').addEventListener('click', () => {
      const res = Gacha.pullSingle();
      if (!res.ok) { toast(res.reason); return; }
      showGachaResult(res.results);
      GameState.save();
    });
    $('#gacha-10-btn').addEventListener('click', () => {
      const res = Gacha.pullTen();
      if (!res.ok) { toast(res.reason); return; }
      showGachaResult(res.results);
      GameState.save();
    });
    $('#gacha-ticket-btn').addEventListener('click', () => {
      const res = Gacha.pullTicket();
      if (!res.ok) { toast(res.reason); return; }
      showGachaResult(res.results);
      GameState.save();
    });
  }

  // ---- ショップ ----
  function bindShop() {
    $$('[data-shop]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.dataset.shop;
        const res = Game.buy(item);
        toast(res.msg);
        if (res.ok) { GameState.save(); renderAll(); }
      });
    });
    $('#prestige-btn').addEventListener('click', () => {
      if (!Game.canPrestige()) {
        const need = '累計100万コインで1ポイント獲得できます';
        toast('プレステージにはまだ足りません(' + need + ')');
        return;
      }
      const pp = Game.prestigePoints();
      if (!confirm(`プレステージを実行しますか?\n獲得PP: +${pp}\n進行は初期化されます。`)) return;
      const r = Game.doPrestige();
      if (r.ok) {
        toast(`プレステージ達成 +${r.pp} PP (合計 ${r.totalPP})`);
        GameState.save();
        renderAll();
      }
    });

    $('#reset-btn').addEventListener('click', () => {
      if (!confirm('セーブを全削除しますか?この操作は取り消せません。')) return;
      GameState.reset();
      renderAll();
      toast('セーブを削除しました');
    });
  }

  // ---- 広告(リワード)プレースホルダ ----
  function bindRewardAd() {
    $('#reward-ad-btn').addEventListener('click', () => {
      // 本物の広告SDKは将来差し込み
      // ここではプレースホルダ動作: ブーストを与える
      Game.applyBoost(GAME_DATA.REWARD_AD_BOOST_SEC);
      toast('ブースト発動！60秒間2倍生産');
      GameState.save();
      renderResources();
    });
  }

  // ---- タップボーナス (大ボタン) ----
  function bindCollectBtn() {
    $('#collect-btn').addEventListener('click', (e) => {
      const gain = Game.tapBonus();
      toast('+' + formatNum(gain) + ' 🪙');
      renderResources();
    });
  }

  // ---- デイリーボーナス ----
  function renderDailyBanner() {
    const banner = $('#daily-banner');
    if (Game.canClaimDaily()) {
      const s = GameState.get();
      // 次の獲得は streak+1 (今日まだなら昨日の継続なら +1、そうでなければ1)
      const yesterdayKey = (function(){
        const d = new Date(); d.setDate(d.getDate()-1);
        return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      })();
      const nextStreak = (s.daily.lastClaimDay === yesterdayKey) ? s.daily.streak + 1 : 1;
      const cappedIdx = Math.min(nextStreak - 1, GAME_DATA.DAILY_REWARDS.length - 1);
      $('#daily-streak').textContent = `Day ${nextStreak}: ${GAME_DATA.DAILY_REWARDS[cappedIdx].label}`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function showDailyReward(reward, day) {
    const wrap = document.createElement('div');
    wrap.className = 'modal daily-reward-modal';
    wrap.innerHTML = `
      <div class="modal-bg"></div>
      <div class="modal-body">
        <h3>🎁 デイリーボーナス</h3>
        <div class="daily-reward-icon">${reward.type === 'coins' ? '🪙' : '🎫'}</div>
        <div class="daily-reward-label">${reward.label}</div>
        <div class="daily-reward-streak">連続ログイン Day ${day}</div>
        <button class="btn btn-primary" id="daily-modal-close">受け取る</button>
      </div>
    `;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); renderAll(); };
    wrap.querySelector('#daily-modal-close').addEventListener('click', close);
    wrap.querySelector('.modal-bg').addEventListener('click', close);
  }

  function bindDaily() {
    $('#daily-claim').addEventListener('click', () => {
      const r = Game.claimDaily();
      if (!r.ok) { toast(r.msg); return; }
      GameState.save();
      showDailyReward(r.reward, r.day);
    });
  }

  // ---- 実績 ----
  function renderAchievementsBanner() {
    const pending = Game.pendingAchievements();
    const banner = $('#ach-banner');
    if (pending.length > 0) {
      $('#ach-count').textContent = `${pending.length} 個のごほうび待ち`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function renderAchievementsList() {
    const list = $('#achievements-list');
    if (!list) return;
    const s = GameState.get();
    list.innerHTML = '';
    GAME_DATA.ACHIEVEMENTS.forEach(a => {
      const claimed = !!s.achievementsUnlocked[a.id];
      const ok = a.check(s);
      const item = document.createElement('div');
      item.className = 'ach-item' + (claimed ? ' is-claimed' : (ok ? '' : ' is-locked'));
      const rewardText = (a.reward.coins ? `🪙${a.reward.coins} ` : '') + (a.reward.tickets ? `🎫${a.reward.tickets}` : '');
      item.innerHTML = `
        <div class="ach-icon">${claimed ? '🏆' : (ok ? '✨' : '🔒')}</div>
        <div class="ach-detail">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
          <div class="ach-reward">報酬: ${rewardText}</div>
        </div>
      `;
      if (ok && !claimed) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.textContent = '受取';
        btn.addEventListener('click', () => {
          const r = Game.claimAchievement(a.id);
          if (r.ok) {
            toast(`🏆 ${r.ach.name} 達成！`);
            GameState.save();
            renderAll();
          }
        });
        item.appendChild(btn);
      }
      list.appendChild(item);
    });
  }

  function bindAchievements() {
    $('#ach-claim-all').addEventListener('click', () => {
      const claimed = Game.claimAllAchievements();
      if (claimed.length > 0) {
        toast(`🏆 実績 ${claimed.length}件 達成！`);
        GameState.save();
        renderAll();
      }
    });
  }

  // ---- プレステージ進捗バー ----
  function renderPrestigeProgress() {
    const s = GameState.get();
    const pp = Game.prestigePoints();
    const currentPP = s.prestigePoints;
    // 次の +1 PP のしきい値
    // pp = floor(sqrt(total/1e6))  →  total >= (pp+1)^2 * 1e6 で次のPP
    const totalEarned = s.totalEarned;
    const currentPpFloor = pp;
    const currentThreshold = currentPpFloor * currentPpFloor * 1e6;
    const nextThreshold = (currentPpFloor + 1) * (currentPpFloor + 1) * 1e6;
    const ratio = nextThreshold > currentThreshold
      ? (totalEarned - currentThreshold) / (nextThreshold - currentThreshold)
      : 0;
    const fill = Math.max(0, Math.min(1, ratio)) * 100;
    const bar = document.getElementById('prestige-bar-fill');
    if (bar) bar.style.width = fill.toFixed(1) + '%';
    const ppEl = document.getElementById('prestige-pp');
    if (ppEl) ppEl.textContent = pp;
    const curEl = document.getElementById('prestige-current');
    if (curEl) curEl.textContent = `(現在 ${currentPP} PP / +${Math.round(currentPP*5)}%)`;
  }

  // ---- 全体再描画 ----
  function renderAll() {
    renderResources();
    renderRates();
    renderFarm();
    renderBook();
    renderDailyBanner();
    renderAchievementsBanner();
    renderAchievementsList();
    renderPrestigeProgress();
  }

  global.UI = {
    bindTabs, bindGachaModal, bindGachaActions, bindShop, bindRewardAd, bindCollectBtn,
    bindDaily, bindAchievements,
    renderAll, renderResources, renderFarm, renderBook,
    renderDailyBanner, renderAchievementsBanner, renderAchievementsList, renderPrestigeProgress,
    toast, formatNum, showGachaResult,
  };
})(window);
