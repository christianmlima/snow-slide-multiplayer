import { SHOP_CATALOG } from '../config/catalog';
import { CharacterId, EquippedState } from '../types/game.types';
import { SoundManager } from '../audio/SoundManager';
import { PowerUpItem } from '../types/powerup.types';
import { Achievement } from '../config/achievements';
import { TrackTheme, TRACK_CATALOG } from '../types/track.types';

export class UIManager {
  public static showToast(message: string, type: 'success' | 'warning' | 'info' = 'info', soundManager?: SoundManager) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    if (type === 'success' && soundManager) {
      soundManager.playCoinSound();
    }

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  public static updateCoinsDisplay(currency: number) {
    const el1 = document.getElementById('currency-val');
    if (el1) el1.innerText = currency.toString();
    const el2 = document.getElementById('shop-coins-val');
    if (el2) el2.innerText = currency.toString();
  }

  public static updateWarHUDHearts(health: number) {
    const heartsEl = document.getElementById('war-hearts');
    if (!heartsEl) return;
    if (health >= 3) heartsEl.innerText = '❤️❤️❤️';
    else if (health === 2) heartsEl.innerText = '❤️❤️🖤';
    else if (health === 1) heartsEl.innerText = '❤️🖤🖤';
    else heartsEl.innerText = '🖤🖤🖤';
  }

  public static isAnyModalOpen(): boolean {
    const modals = [
      'shop-modal',
      'inventory-modal',
      'settings-modal',
      'character-modal',
      'records-modal',
      'race-finish-modal',
      'shooting-results-modal',
      'snowball-war-results-modal',
      'instructions-modal',
      'cable-car-lobby-modal'
    ];
    for (const m of modals) {
      const el = document.getElementById(m);
      if (el && el.style.display === 'flex') return true;
    }
    return false;
  }

  public static closeAllModals() {
    const modals = [
      'shop-modal',
      'inventory-modal',
      'settings-modal',
      'character-modal',
      'records-modal',
      'race-finish-modal',
      'shooting-results-modal',
      'snowball-war-results-modal',
      'instructions-modal',
      'cable-car-lobby-modal'
    ];
    for (const m of modals) {
      const el = document.getElementById(m);
      if (el) el.style.display = 'none';
    }
  }

  public static hideAllInteractivePrompts() {
    const promptIds = [
      'cable-car-prompt',
      'garage-shop-prompt',
      'hat-shop-prompt',
      'atelier-shop-prompt',
      'records-prompt',
      'phone-booth-prompt',
      'carnival-prompt',
      'snowball-war-prompt',
      'sit-bench-prompt',
      'stand-up-prompt'
    ];
    for (const pid of promptIds) {
      const el = document.getElementById(pid);
      if (el) el.style.display = 'none';
    }
  }

  public static renderShop(
    category: 'sleds' | 'hats' | 'scarves' | 'goggles',
    inventory: Set<string>,
    equipped: EquippedState,
    onBuy: (id: string) => void,
    onEquip: (id: string, category: 'sleds' | 'hats' | 'scarves' | 'goggles') => void
  ) {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    const items = SHOP_CATALOG.filter(i => i.category === category);
    for (const item of items) {
      const isOwned = inventory.has(item.id);
      let isEquipped = false;
      if (item.category === 'sleds') isEquipped = equipped.vehicle === item.id;
      if (item.category === 'hats') isEquipped = equipped.hat === item.id;
      if (item.category === 'scarves') isEquipped = equipped.scarf === item.id;
      if (item.category === 'goggles') isEquipped = equipped.goggles === item.id;

      const card = document.createElement('div');
      card.className = `item-card ${isEquipped ? 'equipped' : ''}`;

      let btnHtml = '';
      if (isEquipped) {
        btnHtml = `<button class="item-btn btn-equipped">Equipado</button>`;
      } else if (isOwned) {
        btnHtml = `<button class="item-btn btn-equip" data-equip-id="${item.id}">Equipar</button>`;
      } else {
        btnHtml = `<button class="item-btn btn-buy" data-buy-id="${item.id}">Comprar (${item.price} pts)</button>`;
      }

      card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-title">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        ${btnHtml}
      `;
      container.appendChild(card);
    }

    container.querySelectorAll('[data-buy-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-buy-id')!;
        onBuy(id);
      });
    });

    container.querySelectorAll('[data-equip-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-equip-id')!;
        const it = SHOP_CATALOG.find(i => i.id === id);
        if (it) {
          onEquip(id, it.category);
          UIManager.renderShop(category, inventory, equipped, onBuy, onEquip);
          UIManager.showToast(`Equipado: ${it.name}!`, 'success');
        }
      });
    });
  }

  public static renderInventory(
    category: 'sleds' | 'hats' | 'scarves' | 'goggles',
    inventory: Set<string>,
    equipped: EquippedState,
    onEquip: (id: string, category: 'sleds' | 'hats' | 'scarves' | 'goggles') => void
  ) {
    const container = document.getElementById('inv-items-container');
    if (!container) return;
    container.innerHTML = '';

    const items = SHOP_CATALOG.filter(i => i.category === category && inventory.has(i.id));

    const sledItem = SHOP_CATALOG.find(i => i.id === equipped.vehicle);
    const hatItem = SHOP_CATALOG.find(i => i.id === equipped.hat);
    const scarfItem = SHOP_CATALOG.find(i => i.id === equipped.scarf);
    const gogglesItem = SHOP_CATALOG.find(i => i.id === equipped.goggles);

    const s1 = document.getElementById('summary-sled');
    if (s1) s1.innerText = sledItem ? sledItem.name : 'Trenó';
    const s2 = document.getElementById('summary-hat');
    if (s2) s2.innerText = hatItem ? hatItem.name : 'Gorro';
    const s3 = document.getElementById('summary-scarf');
    if (s3) s3.innerText = scarfItem ? scarfItem.name : 'Cachecol';
    const s4 = document.getElementById('summary-goggles');
    if (s4) s4.innerText = gogglesItem ? gogglesItem.name : 'Nenhum';

    for (const item of items) {
      let isEquipped = false;
      if (item.category === 'sleds') isEquipped = equipped.vehicle === item.id;
      if (item.category === 'hats') isEquipped = equipped.hat === item.id;
      if (item.category === 'scarves') isEquipped = equipped.scarf === item.id;
      if (item.category === 'goggles') isEquipped = equipped.goggles === item.id;

      const card = document.createElement('div');
      card.className = `item-card ${isEquipped ? 'equipped' : ''}`;

      const btnHtml = isEquipped
        ? `<button class="item-btn btn-equipped">Em Uso</button>`
        : `<button class="item-btn btn-equip" data-inv-equip="${item.id}">Equipar</button>`;

      card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-title">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        ${btnHtml}
      `;
      container.appendChild(card);
    }

    container.querySelectorAll('[data-inv-equip]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-inv-equip')!;
        const it = SHOP_CATALOG.find(i => i.id === id);
        if (it) {
          onEquip(id, it.category);
          UIManager.renderInventory(category, inventory, equipped, onEquip);
          UIManager.showToast(`Equipado: ${it.name}!`, 'success');
        }
      });
    });
  }

  public static openCharacterModal(
    selectedCharacter: CharacterId,
    _onSelect: (charId: CharacterId) => void
  ) {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    UIManager.closeAllModals();

    document.querySelectorAll('.character-card').forEach(card => {
      const charId = card.getAttribute('data-char');
      const btn = card.querySelector('.item-btn') as HTMLElement;
      if (charId === selectedCharacter) {
        card.classList.add('active');
        if (btn) {
          btn.className = 'item-btn btn-equipped';
          btn.innerText = 'Em Uso';
        }
      } else {
        card.classList.remove('active');
        if (btn) {
          btn.className = 'item-btn btn-equip';
          btn.innerText = 'Selecionar';
        }
      }
    });

    const modal = document.getElementById('character-modal');
    if (modal) modal.style.display = 'flex';
  }

  public static openRecordsModal() {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    UIManager.closeAllModals();

    const bestScore = localStorage.getItem('snow_slide_best_score') || '0';
    const bestTime = localStorage.getItem('snow_slide_best_time') || '--:--';

    const pBestScoreEl = document.getElementById('personal-best-score');
    if (pBestScoreEl) pBestScoreEl.innerText = `${parseInt(bestScore, 10).toLocaleString('pt-BR')} pts`;

    const pBestTimeEl = document.getElementById('personal-best-time');
    if (pBestTimeEl) pBestTimeEl.innerText = bestTime;

    const modal = document.getElementById('records-modal');
    if (modal) modal.style.display = 'flex';
  }

  // =========================================================================
  // MULTIPLAYER UI HELPERS
  // =========================================================================
  public static updateNetworkBadge(status: 'connected' | 'connecting' | 'offline', count: number) {
    const badge = document.getElementById('network-status-badge');
    if (!badge) return;

    badge.style.display = 'flex';
    badge.className = `network-badge ${status}`;

    if (status === 'connected') {
      badge.innerHTML = `🟢 Online: ${count} ${count === 1 ? 'piloto' : 'pilotos'}`;
    } else if (status === 'connecting') {
      badge.innerHTML = `🟡 Conectando...`;
    } else {
      badge.innerHTML = `⚪ Modo Solo (Offline)`;
    }
  }

  public static addChatMessage(senderName: string, text: string, isSystem = false) {
    const container = document.getElementById('hub-chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg ${isSystem ? 'chat-msg-system' : ''}`;

    if (isSystem) {
      msg.innerText = `📢 ${text}`;
    } else {
      msg.innerHTML = `<span class="chat-msg-sender">${senderName}:</span> ${text}`;
    }

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  public static updateRaceLeaderboard(items: Array<{ name: string; distance: number; isLocal: boolean }>) {
    const list = document.getElementById('race-lead-list');
    if (!list) return;

    // Ordena decrescente por distância percorrida
    const sorted = [...items].sort((a, b) => b.distance - a.distance);

    let html = '';
    sorted.forEach((item, index) => {
      const rankStr = `${index + 1}º`;
      const youClass = item.isLocal ? 'you' : '';
      const distStr = `${Math.round(item.distance)}m`;
      html += `<div class="race-lead-item ${youClass}"><span>${rankStr} ${item.name}</span><span>${distStr}</span></div>`;
    });

    list.innerHTML = html;
  }

  public static renderLobbyPilots(pilots: Array<{ name: string; isReady: boolean; character: string }>) {
    const container = document.getElementById('lobby-pilots-container');
    if (!container) return;

    if (pilots.length === 0) {
      container.innerHTML = `<div style="color: #94a3b8; font-size: 0.85rem; padding: 10px;">Aguardando pilotos entrarem no teleférico...</div>`;
      return;
    }

    let html = '';
    pilots.forEach((p) => {
      const readyClass = p.isReady ? 'ready' : '';
      const statusIcon = p.isReady ? '✅ Pronto' : '⏳ Aguardando';
      const charIcon = p.character === 'frog' ? '🐸' : p.character === 'cat' ? '🐱' : p.character === 'dog' ? '🐶' : '🐧';

      html += `
        <div class="lobby-pilot-item ${readyClass}">
          <span>${charIcon} <strong>${p.name}</strong></span>
          <span style="font-size: 0.82rem; color: ${p.isReady ? '#22c55e' : '#facc15'};">${statusIcon}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  public static renderRaceFinishPodium(leaderboard: Array<{ name: string; rank: number; finishTime: number; score: number }>) {
    const container = document.getElementById('finish-multiplayer-leaderboard');
    const list = document.getElementById('finish-podium-list');
    if (!container || !list) return;

    if (!leaderboard || leaderboard.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    let html = '';
    leaderboard.forEach((p, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;
      const timeSec = (p.finishTime / 1000).toFixed(1);
      html += `
        <div style="display: flex; justify-content: space-between; padding: 4px 6px; background: rgba(51, 65, 85, 0.4); border-radius: 6px;">
          <span>${medal} <strong>${p.name}</strong></span>
          <span style="color: #38bdf8;">${timeSec}s (${p.score} pts)</span>
        </div>
      `;
    });

    list.innerHTML = html;
  }

  public static showAchievementToast(achievement: Achievement, soundManager?: SoundManager) {
    const container = document.getElementById('achievement-toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'achievement-toast-popup';
    el.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-badge">🏆 CONQUISTA DESBLOQUEADA!</div>
        <div class="achievement-title">${achievement.title}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;

    container.appendChild(el);
    if (soundManager) soundManager.playAchievementSound();

    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 500);
    }, 4500);
  }

  public static updateItemHUD(item: PowerUpItem | null, isRouletteRunning: boolean) {
    const slot = document.getElementById('race-item-slot');
    const icon = document.getElementById('race-item-icon');
    const prompt = document.getElementById('race-item-prompt');
    if (!slot || !icon || !prompt) return;

    if (isRouletteRunning) {
      slot.classList.add('roulette-spin');
      icon.innerText = ['🌶️', '🧊', '🎯', '🛡️'][Math.floor(Math.random() * 4)];
      prompt.innerText = 'Sorteando...';
    } else if (item) {
      slot.classList.remove('roulette-spin');
      slot.classList.add('has-item');
      icon.innerText = item.icon;
      prompt.innerHTML = `<strong>${item.name}</strong><br><span style="font-size:0.75rem; color:#facc15;">[Q] ou Toque para Usar</span>`;
    } else {
      slot.classList.remove('roulette-spin', 'has-item');
      icon.innerText = '❓';
      prompt.innerText = 'Passe nas Caixas de Item';
    }
  }

  public static updateDriftHUD(tier: number, ratio: number) {
    const container = document.getElementById('drift-gauge-container');
    const fill = document.getElementById('drift-gauge-fill');
    const label = document.getElementById('drift-gauge-label');
    if (!container || !fill || !label) return;

    if (tier === 0 && ratio === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    fill.style.width = `${Math.min(100, Math.round(ratio * 100))}%`;

    if (tier === 3) {
      fill.style.background = 'linear-gradient(90deg, #c084fc, #ec4899)';
      label.innerText = '⚡ MINI-TURBO NÍVEL 3! (ROXO)';
      label.style.color = '#f472b6';
    } else if (tier === 2) {
      fill.style.background = 'linear-gradient(90deg, #f97316, #eab308)';
      label.innerText = '⚡ MINI-TURBO NÍVEL 2! (LARANJA)';
      label.style.color = '#facc15';
    } else if (tier === 1) {
      fill.style.background = 'linear-gradient(90deg, #38bdf8, #0ea5e9)';
      label.innerText = '⚡ MINI-TURBO NÍVEL 1 (AZUL)';
      label.style.color = '#38bdf8';
    } else {
      fill.style.background = 'rgba(255,255,255,0.4)';
      label.innerText = 'Derrapando...';
      label.style.color = '#e2e8f0';
    }
  }

  public static renderTrackOptions(containerId: string, currentTrack: TrackTheme, onSelect: (track: TrackTheme) => void) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    const tracks: TrackTheme[] = ['alpine_day', 'aurora_night', 'crystal_cave'];

    tracks.forEach((trackId) => {
      const track = TRACK_CATALOG[trackId];
      const isSelected = trackId === currentTrack;
      html += `
        <div class="track-select-card ${isSelected ? 'active' : ''}" data-track="${trackId}">
          <div class="track-icon">${track.icon}</div>
          <div class="track-info">
            <div class="track-name">${track.name}</div>
            <div class="track-desc">${track.desc}</div>
          </div>
          ${isSelected ? '<div class="track-check">✓ Pista Escolhida</div>' : ''}
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.track-select-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-track') as TrackTheme;
        if (id) {
          onSelect(id);
          this.renderTrackOptions(containerId, id, onSelect);
        }
      });
    });
  }

  public static renderLeaderboardTable(
    data: { race: any[]; arena: any[] },
    tab: 'race' | 'arena'
  ) {
    const head = document.getElementById('leaderboard-table-head');
    const body = document.getElementById('leaderboard-table-body');
    const title = document.getElementById('leaderboard-title');
    const tip = document.getElementById('leaderboard-tip');

    if (!head || !body) return;

    if (tab === 'race') {
      if (title) title.innerText = '🎖️ Top 20 Melhores Tempos Globais';
      if (tip) tip.innerHTML = '💡 <em>Dica: Passe no centro dos portais de Slalom para garantir bônus multiplicador!</em>';
      head.innerHTML = `
        <tr>
          <th>Posição</th>
          <th>Piloto</th>
          <th>Tempo</th>
          <th>Pontos</th>
        </tr>
      `;

      if (!data.race || data.race.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:12px; color:#94a3b8;">Nenhum recorde registrado ainda. Seja o primeiro a descer!</td></tr>`;
        return;
      }

      body.innerHTML = data.race.map((r, i) => {
        const medal = i === 0 ? '🥇 1º' : (i === 1 ? '🥈 2º' : (i === 2 ? '🥉 3º' : `${i + 1}º`));
        const color = i === 0 ? '#facc15' : (i === 1 ? '#e2e8f0' : (i === 2 ? '#f97316' : '#cbd5e1'));
        const timeStr = r.formattedTime || `${r.finishTime.toFixed(1)}s`;
        const scoreStr = (r.score || 0).toLocaleString('pt-BR');
        return `
          <tr>
            <td style="font-weight:bold; color:${color};">${medal}</td>
            <td style="color:#f8fafc; font-weight:500;">${r.playerName}</td>
            <td style="color:#22c55e; font-weight:bold;">${timeStr}</td>
            <td style="color:#38bdf8;">${scoreStr}</td>
          </tr>
        `;
      }).join('');
    } else {
      if (title) title.innerText = '⚔️ Top Guerreiros da Batalha de Neve';
      if (tip) tip.innerHTML = '💡 <em>Dica: Segure o arremesso para carregar a bola com mais força e alcance!</em>';
      head.innerHTML = `
        <tr>
          <th>Posição</th>
          <th>Guerreiro</th>
          <th>K.O.s</th>
          <th>Pontos</th>
        </tr>
      `;

      if (!data.arena || data.arena.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:12px; color:#94a3b8;">Nenhum combatente registrado ainda. Entre na arena e pontue!</td></tr>`;
        return;
      }

      body.innerHTML = data.arena.map((a, i) => {
        const medal = i === 0 ? '🥇 1º' : (i === 1 ? '🥈 2º' : (i === 2 ? '🥉 3º' : `${i + 1}º`));
        const color = i === 0 ? '#facc15' : (i === 1 ? '#e2e8f0' : (i === 2 ? '#f97316' : '#cbd5e1'));
        const scoreStr = (a.score || 0).toLocaleString('pt-BR');
        return `
          <tr>
            <td style="font-weight:bold; color:${color};">${medal}</td>
            <td style="color:#f8fafc; font-weight:500;">${a.playerName}</td>
            <td style="color:#ef4444; font-weight:bold;">🎯 ${a.kos} KOs</td>
            <td style="color:#38bdf8;">${scoreStr}</td>
          </tr>
        `;
      }).join('');
    }
  }
}
