/* ===== ガチャロジック ===== */
(function (global) {
  'use strict';

  /**
   * レアリティを抽選する (1..5)
   */
  function rollRarity() {
    const r = Math.random() * 100;
    let acc = 0;
    for (let i = 1; i <= 5; i++) {
      acc += GAME_DATA.RARITY_RATES[i];
      if (r < acc) return i;
    }
    return 1;
  }

  /**
   * 指定レアリティの動物をランダムに1体選ぶ
   */
  function pickAnimalByRarity(rarity) {
    const candidates = GAME_DATA.ANIMALS.filter(a => a.rarity === rarity);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * 1回引く -> { animal, isNew }
   * 副作用: state.collection 更新, stats更新
   * 自動配置: 空きマスがあれば配置、なければスキップ (図鑑には残る)
   */
  function pullOne() {
    const state = GameState.get();
    const rarity = rollRarity();
    const animal = pickAnimalByRarity(rarity);

    const existing = state.collection[animal.id];
    let isNew = false;
    if (!existing) {
      state.collection[animal.id] = { lv: 1, count: 1, isNew: true };
      isNew = true;
      // 空きマスに自動配置
      const emptyIdx = state.farm.indexOf(null);
      if (emptyIdx >= 0) state.farm[emptyIdx] = animal.id;
    } else {
      existing.count += 1;
      // 同じ動物 → レベルアップ
      existing.lv += 1;
    }

    state.stats.gachas += 1;
    return { animal, isNew, level: state.collection[animal.id].lv };
  }

  /**
   * 1回引く (コイン消費を伴う) - 残高チェックは呼び出し元
   */
  function pullSingle() {
    const state = GameState.get();
    if (state.coins < GAME_DATA.GACHA_COST_1) {
      return { ok: false, reason: 'コインが足りません' };
    }
    state.coins -= GAME_DATA.GACHA_COST_1;
    return { ok: true, results: [pullOne()] };
  }

  /**
   * 10連
   */
  function pullTen() {
    const state = GameState.get();
    if (state.coins < GAME_DATA.GACHA_COST_10) {
      return { ok: false, reason: 'コインが足りません' };
    }
    state.coins -= GAME_DATA.GACHA_COST_10;
    const results = [];
    // 10連は★2以上 1体保証
    let hasUncommon = false;
    for (let i = 0; i < 10; i++) {
      const r = pullOne();
      results.push(r);
      if (r.animal.rarity >= 2) hasUncommon = true;
    }
    if (!hasUncommon) {
      // 最後の1体を★2に置換
      const lastResult = results[9];
      const animalData = lastResult.animal;
      // 一度カウントを戻す
      const existing = state.collection[animalData.id];
      existing.count -= 1;
      if (existing.count <= 0) {
        delete state.collection[animalData.id];
        // farm から削除
        const fIdx = state.farm.indexOf(animalData.id);
        if (fIdx >= 0 && !state.collection[animalData.id]) {
          // 他の同じ動物がいないので削除
          state.farm[fIdx] = null;
        }
      } else {
        existing.lv = Math.max(1, existing.lv - 1);
      }
      // 改めて★2を抽選して付与
      const newAnimal = pickAnimalByRarity(2);
      const ex2 = state.collection[newAnimal.id];
      let isNew = false;
      if (!ex2) {
        state.collection[newAnimal.id] = { lv: 1, count: 1, isNew: true };
        isNew = true;
        const emptyIdx = state.farm.indexOf(null);
        if (emptyIdx >= 0) state.farm[emptyIdx] = newAnimal.id;
      } else {
        ex2.count += 1;
        ex2.lv += 1;
      }
      results[9] = { animal: newAnimal, isNew, level: state.collection[newAnimal.id].lv };
    }
    return { ok: true, results };
  }

  /**
   * チケットで引く
   */
  function pullTicket() {
    const state = GameState.get();
    if (state.tickets < 1) {
      return { ok: false, reason: 'チケットがありません' };
    }
    state.tickets -= 1;
    return { ok: true, results: [pullOne()] };
  }

  global.Gacha = { pullSingle, pullTen, pullTicket, rollRarity };
})(window);
