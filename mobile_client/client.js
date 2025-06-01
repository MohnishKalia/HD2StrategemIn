(() => {
  const WS_IP = "192.168.1.39"; // Replace with your server's IP
  const WS_HOST = `ws://${WS_IP}:8765`;
  let socket, loadout = [null, null, null, null], currentSlot = null, inputBuffer = [], stratagems = null;
  const $ = id => document.getElementById(id);
  const loadoutList = $("loadoutList"), stratagemSelector = $("stratagemSelector"), stratagemList = $("stratagemList"), inputCurrentRow = $("inputCurrentRow");

  // Utility
  const directionSymbol = dir => ({UP: "🠉", DOWN: "🠋", LEFT: "🠈", RIGHT: "🠊"}[dir] || dir);

  // UI Rendering
  function renderInputCurrentRow(error = false) {
    inputCurrentRow.innerHTML = '';
    inputBuffer.forEach(dir => {
      const el = document.createElement('div');
      el.className = 'input-current-arrow' + (error ? ' error' : '');
      el.textContent = directionSymbol(dir);
      inputCurrentRow.appendChild(el);
    });
  }

  function renderLoadout(matchInfoList = []) {
    loadoutList.innerHTML = '';
    // Determine which slots should be muted
    let mutedSlots = [];
    if (inputBuffer.length > 0) {
      // Find all slots that match the buffer so far
      const matches = getAllMatchInfo();
      mutedSlots = loadout.map((strat, i) => {
        if (!strat) return false;
        // If the buffer matches the start of this strat, or is empty, do not mute
        const match = matches.find(m => m.slotIdx === i);
        return !(match && match.matchLength === inputBuffer.length);
      });
    }
    loadout.forEach((strat, i) => {
      let slotClass = 'strat-slot';
      if (currentSlot === i) slotClass += ' selected';
      if (mutedSlots[i]) slotClass += ' muted';
      const slot = document.createElement('div');
      slot.className = slotClass;
      slot.dataset.slot = i;
      slot.onclick = () => openStratagemSelector(i);
      slot.innerHTML = `<div class="strat-icon">${strat ? directionSymbol(strat.code[0]) : '+'}</div>`;
      const info = document.createElement('div');
      info.className = 'strat-info';
      if (strat) {
        info.innerHTML = `<div class="strat-name">${strat.name}</div>` +
          `<div class="strat-arrows">${strat.code.map((dir, idx) => `<div class="arrow-box${(matchInfoList.find(m => m.slotIdx === i)?.matchLength > idx ? ' match' : '')}">${directionSymbol(dir)}</div>`).join('')}</div>` +
          `<div class="strat-meta"><span>${strat.cooldown !== undefined ? `CD: ${strat.cooldown}s` : ''}</span> <span>${strat.activation !== undefined ? `ACT: ${strat.activation}s` : ''}</span></div>`;
      } else {
        info.innerHTML = '<span style="color:#888">Select Stratagem</span>';
      }
      slot.appendChild(info);
      loadoutList.appendChild(slot);
    });
  }

  // Stratagem Selector
  function openStratagemSelector(slotIndex) {
    currentSlot = slotIndex;
    renderLoadout();
    stratagemList.innerHTML = '';
    if (stratagems) {
      [
        ["Offensive: Orbital", stratagems.offensive.orbital],
        ["Offensive: Eagle", stratagems.offensive.eagle],
        ["Support: Weapons", stratagems.support.weapons],
        ["Support: Backpacks", stratagems.support.backpacks],
        ["Support: Vehicles", stratagems.support.vehicles],
        ["Defensive", stratagems.defensive]
      ].forEach(([title, arr]) => {
        if (arr?.length) {
          stratagemList.appendChild(categoryTitle(title));
          arr.forEach(s => stratagemList.appendChild(stratagemItem(s)));
        }
      });
    }
    stratagemSelector.style.display = 'flex';
  }
  const categoryTitle = title => Object.assign(document.createElement('div'), {className: 'category-title', textContent: title});
  const stratagemItem = strat => {
    const item = document.createElement('div');
    item.className = 'strategem-item';
    item.innerHTML = `<div class="strategem-name">${strat.name}</div><div class="strategem-code">${strat.code.map(directionSymbol).map(a=>`<div class="strategem-code-arrow">${a}</div>`).join('')}</div>`;
    item.onclick = () => selectStratagem(strat, currentSlot);
    return item;
  };
  function selectStratagem(strat, slotIndex) {
    loadout[slotIndex] = strat;
    closeStratagemSelector();
    renderLoadout();
    resetInputBuffer();
  }
  function closeStratagemSelector() {
    stratagemSelector.style.display = 'none';
    currentSlot = null;
    renderLoadout();
  }
  $("closeSelector").onclick = closeStratagemSelector;

  // Input Handling
  function handleInput(direction) {
    sendPress(direction);
    inputBuffer.push(direction);
    const matchInfoList = getAllMatchInfo();
    renderInputCurrentRow(false);
    renderLoadout(matchInfoList);
    const fullMatch = matchInfoList.find(m => m.fullMatch);
    if (fullMatch) {
      highlightSlot(fullMatch.slotIdx);
      flashInputSuccess();
      setTimeout(() => { resetInputBuffer(); renderInputCurrentRow(); renderLoadout(); }, 350);
      return;
    }
    if (!matchInfoList.some(m => m.matchLength === inputBuffer.length)) {
      flashInputError();
      setTimeout(() => { resetInputBuffer(); renderInputCurrentRow(true); renderLoadout(); }, 350);
    }
  }
  function getAllMatchInfo() {
    return loadout.map((strat, i) => {
      if (!strat) return null;
      let matchLength = 0;
      for (; matchLength < inputBuffer.length && matchLength < strat.code.length; matchLength++) {
        if (inputBuffer[matchLength] !== strat.code[matchLength]) break;
      }
      return { slotIdx: i, matchLength, fullMatch: matchLength === strat.code.length && inputBuffer.length === strat.code.length };
    }).filter(Boolean);
  }
  function highlightSlot(idx) {
    const slots = document.querySelectorAll('.strat-slot');
    if (slots[idx]) {
      slots[idx].classList.add('selected');
      setTimeout(() => slots[idx].classList.remove('selected'), 600);
    }
  }
  function resetInputBuffer() { inputBuffer = []; renderInputCurrentRow(); }
  function sendPress(direction) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ button: direction }));
    }
  }
  function setupArrowButtons() {
    [["upBtn", "UP"], ["downBtn", "DOWN"], ["leftBtn", "LEFT"], ["rightBtn", "RIGHT"]].forEach(([id, dir]) => {
      $(id).addEventListener("pointerdown", e => { e.preventDefault(); handleInput(dir); });
    });
  }

  // WebSocket
  function connect() {
    socket = new WebSocket(WS_HOST);
    socket.onopen = setupArrowButtons;
    socket.onclose = () => setTimeout(connect, 2000);
    socket.onerror = () => {};
  }

  // Feedback
  function flashInputError() {
    const panel = document.querySelector('.input-panel');
    panel.classList.add('flash-error');
    setTimeout(() => panel.classList.remove('flash-error'), 300);
  }
  function flashInputSuccess() {
    const panel = document.querySelector('.input-panel');
    panel.classList.add('flash-success');
    setTimeout(() => panel.classList.remove('flash-success'), 300);
  }

  // Data
  async function fetchStratagems() {
    try {
      stratagems = await (await fetch('stratagems.json')).json();
      const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];
      loadout = [
        getRandom(stratagems.offensive.orbital),
        getRandom(stratagems.offensive.eagle),
        getRandom(stratagems.support.weapons),
        getRandom(stratagems.defensive)
      ];
    } catch {
      alert("Error loading stratagems data");
    }
  }

  window.addEventListener("load", async () => {
    await fetchStratagems();
    renderLoadout();
    renderInputCurrentRow();
    connect();
  });
})();
