/* Configuration */
const LIFE_EXPECTANCY_YEARS = 85;

/* Theme handling */
const savedTheme = localStorage.getItem('lifeTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

/* Safe JSON Parse Helper */
function safeParse(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn('Data Parse Error for', key, e);
    return fallback;
  }
}

/* Default Tags & State */
const defaultTags = {
  academic: { label: '學業', color: '#e3f2fd', textColor: '#1565c0', isMain: true },
  work: { label: '工作', color: '#f3e5f5', textColor: '#7b1fa2', isMain: true },
  love: { label: '感情', color: '#ffebee', textColor: '#c62828', isMain: true },
  life: { label: '生活', color: '#e8f5e9', textColor: '#2e7d32', isMain: false },
  travel: { label: '旅行', color: '#fff3e0', textColor: '#ef6c00', isMain: false },
  other: { label: '其他', color: '#f5f5f5', textColor: '#616161', isMain: false }
};

let savedBirthDate = localStorage.getItem('lifeBirthDate');
let birthDate = savedBirthDate ? new Date(savedBirthDate) : null;

let events = safeParse('lifeEvents', []);
let tags = safeParse('lifeTags', defaultTags);
if (!tags) tags = defaultTags;
let tagOrder = safeParse('lifeTagOrder', Object.keys(tags));
Object.keys(tags).forEach(k => { if (!tagOrder.includes(k)) tagOrder.push(k); });


/* DOM Elements */
const elTimelineContainer = document.getElementById('timeline-list-container');
const elTimelineList = document.getElementById('timeline-list');


// Life Battery Elements
const elBatteryContainer = document.getElementById('life-battery-container');
const elBatteryFill = document.getElementById('battery-fill');
const elBatteryNeedle = document.getElementById('battery-needle');
const elBatteryLabel = document.getElementById('battery-label');

/* UI Elements */
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const btnDelete = document.getElementById('btn-delete');
const btnSubmit = document.getElementById('btn-submit');
const formAdd = document.getElementById('form-add');

// Inputs
const inpId = document.getElementById('inp-id');
const inpDate = document.getElementById('inp-date');
const inpIsPeriod = document.getElementById('inp-is-period');
const groupEndDate = document.getElementById('group-end-date');
const inpEndDate = document.getElementById('inp-end-date');
const inpNoDay = document.getElementById('inp-no-day');
const inpTag = document.getElementById('inp-tag');
const inpTitle = document.getElementById('inp-title');
const inpDesc = document.getElementById('inp-desc');
const inpSearch = document.getElementById('inp-search');

// Settings & Filter
const modalSettings = document.getElementById('modal-settings');
const btnSettings = document.getElementById('btn-settings');
const modalSettingsClose = document.getElementById('modal-settings-close');
const inpSettingsBirthdate = document.getElementById('inp-settings-birthdate');
const btnSaveBirthdate = document.getElementById('btn-save-birthdate');
const modalFilter = document.getElementById('modal-filter');
const btnOpenFilter = document.getElementById('btn-open-filter');
const modalFilterClose = document.getElementById('modal-filter-close');
const filterListContainer = document.getElementById('filter-list-container');
const btnAddTag = document.getElementById('btn-add-tag');
const inpNewTagName = document.getElementById('inp-new-tag-name');
const inpNewTagColor = document.getElementById('inp-new-tag-color');

// Onboarding
const modalOnboarding = document.getElementById('modal-onboarding');
const inpOnboardingBirthdate = document.getElementById('inp-onboarding-birthdate');
const btnStartOnboarding = document.getElementById('btn-start-onboarding');

// Full Screen View
const elFullListView = document.getElementById('full-screen-list-view');
const elListViewContent = document.getElementById('list-view-content');
const elListViewTitle = document.getElementById('list-view-title');
const btnCloseListView = document.getElementById('btn-close-list-view');

// Backup
const btnExport = document.getElementById('btn-export');
const btnImportTrigger = document.getElementById('btn-import-trigger');
const fileImport = document.getElementById('file-import');
const btnResetData = document.getElementById('btn-reset-data');
const fabAdd = document.getElementById('fab-add');

// Multi-track View
const btnOpenMultiTrack = document.getElementById('btn-open-multitrack');
const btnCloseMultiTrack = document.getElementById('btn-close-multitrack');
const btnToggleTheme = document.getElementById('btn-toggle-theme');
const viewMultiTrack = document.getElementById('multi-track-view');
const multitrackContent = document.getElementById('multitrack-content');

// Time Capsule
const btnTimeCapsule = document.getElementById('btn-time-capsule');
const modalTimeCapsule = document.getElementById('modal-time-capsule');
const btnCloseTimeCapsule = document.getElementById('btn-close-time-capsule');
const btnTimeCapsuleNext = document.getElementById('btn-time-capsule-next');
const elTimeCapsuleTitle = document.getElementById('time-capsule-title');
const elTimeCapsuleCard = document.getElementById('time-capsule-card');

/* =========================================
   LIFE BATTERY SYSTEM (Horizontal Top Bar)
   ========================================= */

let isBatteryDragging = false;

function renderLifeBattery() {
  if (!birthDate) return;

  // 1. Calculate Life Progress (0-85 years)
  const currentAge = (new Date().getFullYear() - birthDate.getFullYear()) + (new Date().getMonth() / 12);
  const progressPct = Math.min(100, Math.max(0, (currentAge / LIFE_EXPECTANCY_YEARS) * 100));

  // 2. Set Filled With
  if (elBatteryFill) {
    elBatteryFill.style.width = `${progressPct}%`;
  }
}

function handleBatteryMove(clientX) {
  if (!birthDate) return;

  const rect = elBatteryContainer.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const width = rect.width;

  // Calculate percentage (0 to 1)
  let pct = Math.max(0, Math.min(1, relativeX / width));

  // Map to Age
  const targetAge = pct * LIFE_EXPECTANCY_YEARS;
  const baseYear = birthDate.getFullYear();
  const targetYear = baseYear + Math.floor(targetAge);

  // Update Label
  if (elBatteryLabel) {
    elBatteryLabel.style.left = `${relativeX}px`;
    elBatteryLabel.textContent = `${targetYear} (${targetAge.toFixed(1)}歲) - ${(pct * 100).toFixed(1)}%`;
    elBatteryLabel.classList.add('visible');
  }

  // Find closest year to scroll to
  const headers = Array.from(document.querySelectorAll('.timeline-year-header'));
  if (headers.length === 0) return;

  let bestMatch = headers[0];
  let minDiff = Infinity;
  for (let h of headers) {
    const hYear = parseInt(h.id.replace('year-', ''));
    const diff = Math.abs(hYear - targetYear);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = h;
    }
  }

  bestMatch.scrollIntoView({ behavior: 'auto', block: 'start' });
}

// Interaction Events
if (elBatteryContainer) {
  elBatteryContainer.addEventListener('mousedown', (e) => { isBatteryDragging = true; handleBatteryMove(e.clientX); });
  window.addEventListener('mousemove', (e) => { if (isBatteryDragging) { e.preventDefault(); handleBatteryMove(e.clientX); } });
  window.addEventListener('mouseup', () => { if (isBatteryDragging) { isBatteryDragging = false; elBatteryLabel.classList.remove('visible'); } });

  elBatteryContainer.addEventListener('touchstart', (e) => { isBatteryDragging = true; handleBatteryMove(e.touches[0].clientX); }, { passive: false });
  window.addEventListener('touchmove', (e) => { if (isBatteryDragging) { e.preventDefault(); handleBatteryMove(e.touches[0].clientX); } }, { passive: false });
  window.addEventListener('touchend', () => { isBatteryDragging = false; elBatteryLabel.classList.remove('visible'); });
}

// Sync Needle on Timeline Scroll
if (elTimelineContainer) {
  elTimelineContainer.addEventListener('scroll', () => {
    if (isBatteryDragging || !birthDate) return;

    // Check if scrolled to bottom (Auto-snap to end of "Past")
    const maxScroll = elTimelineContainer.scrollHeight - elTimelineContainer.clientHeight;
    if (elTimelineContainer.scrollTop >= maxScroll - 50) { // Threshold of 50px
      const now = new Date();
      const currentAgeExact = (now.getFullYear() - birthDate.getFullYear()) + (now.getMonth() / 12);
      const pct = Math.max(0, Math.min(100, (currentAgeExact / LIFE_EXPECTANCY_YEARS) * 100));
      if (elBatteryNeedle) {
        elBatteryNeedle.style.left = `${pct}%`;
        if (elBatteryLabel) {
          elBatteryLabel.style.left = `${pct}%`;
          elBatteryLabel.textContent = `${now.getFullYear()} (${currentAgeExact.toFixed(1)}歲) - ${pct.toFixed(1)}%`;
          elBatteryLabel.classList.add('visible');
          if (window.scrollLabelTimeout) clearTimeout(window.scrollLabelTimeout);
          window.scrollLabelTimeout = setTimeout(() => {
            if (!isBatteryDragging) elBatteryLabel.classList.remove('visible');
          }, 1200);
        }
      }

      return;
    }

    // Find center/top element
    const headers = Array.from(document.querySelectorAll('.timeline-year-header'));
    let currentVisYear = birthDate.getFullYear();

    // Check which header is closest to top (0px)
    for (let h of headers) {
      const rect = h.getBoundingClientRect();
      if (rect.top < 300 && rect.top > 0) {
        currentVisYear = parseInt(h.innerText);
        break;
      } else if (rect.top <= 0) {
        currentVisYear = parseInt(h.innerText);
      }
    }

    // Calculate Needle Position
    const age = currentVisYear - birthDate.getFullYear();
    const pct = Math.max(0, Math.min(100, (age / LIFE_EXPECTANCY_YEARS) * 100));

    if (elBatteryNeedle) {
      elBatteryNeedle.style.left = `${pct}%`;
      if (elBatteryLabel) {
        elBatteryLabel.style.left = `${pct}%`;
        elBatteryLabel.textContent = `${currentVisYear} (${age}歲) - ${pct.toFixed(1)}%`;
        elBatteryLabel.classList.add('visible');
        if (window.scrollLabelTimeout) clearTimeout(window.scrollLabelTimeout);
        window.scrollLabelTimeout = setTimeout(() => {
          if (!isBatteryDragging) elBatteryLabel.classList.remove('visible');
        }, 1200);
      }
    }

  });
}

/* =========================================
   CORE LOGIC & UTILS 
   ========================================= */

function saveEvents() { localStorage.setItem('lifeEvents', JSON.stringify(events)); }
function saveTags() { localStorage.setItem('lifeTags', JSON.stringify(tags)); }
function saveTagOrder() { localStorage.setItem('lifeTagOrder', JSON.stringify(tagOrder)); }
function saveBirthDate(dateStr) {
  localStorage.setItem('lifeBirthDate', dateStr);
  savedBirthDate = dateStr;
  birthDate = new Date(dateStr);
}

/* =========================================
   RENDERING: INFINITE LIST
   ========================================= */

function renderTimeline() {
  if (!birthDate) {
    elTimelineList.innerHTML = `<div class="empty-state" style="padding:20px; text-align:center;">等待設定生日...</div>`;
    return;
  }

  elTimelineList.innerHTML = '';

  // Sort events
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Determine Range
  const birthYear = birthDate.getFullYear();
  const currentYear = new Date().getFullYear();
  const lastEventYear = events.length > 0 ? new Date(events[events.length - 1].date).getFullYear() : birthYear;
  // const endYear = Math.max(currentYear + 2, lastEventYear + 5);

  const eventsByYear = {};
  events.forEach(e => {
    const y = new Date(e.date).getFullYear();
    if (!eventsByYear[y]) eventsByYear[y] = [];
    eventsByYear[y].push(e);
  });

  const yearsToRender = new Set(Object.keys(eventsByYear).map(Number));
  yearsToRender.add(currentYear);
  yearsToRender.add(birthYear);

  const sortedYears = Array.from(yearsToRender).sort((a, b) => a - b);

  if (sortedYears.length === 0) {
    elTimelineList.innerHTML = `<div class="empty-state" style="padding:40px; text-align:center; color:#888;">開始記錄您的第一筆回憶吧</div>`;
    return;
  }

  sortedYears.forEach(year => {
    const yearHeader = document.createElement('div');
    yearHeader.className = 'timeline-year-header';
    yearHeader.id = `year-${year}`;
    yearHeader.textContent = `${year}`;

    const ageAtYear = year - birthYear;
    if (ageAtYear >= 0) {
      const span = document.createElement('span');
      span.style.fontSize = '1rem';
      span.style.marginLeft = '10px';
      span.style.fontWeight = 'normal';
      span.textContent = `(${ageAtYear}歲)`;
      yearHeader.appendChild(span);
    }

    elTimelineList.appendChild(yearHeader);

    if (eventsByYear[year]) {
      eventsByYear[year].forEach(evt => {
        const item = createEventCard(evt);
        elTimelineList.appendChild(item);
      });
    }
  });


  renderLifeBattery();
}

function createEventCard(evt) {
  const dateObj = new Date(evt.date);
  let dateStr = evt.noDay ?
    `${dateObj.getMonth() + 1}月` :
    `${dateObj.getMonth() + 1}月 ${dateObj.getDate()}日`;

  if (evt.endDate !== undefined && evt.endDate !== null) {
    if (evt.endDate === '') {
      dateStr += '<br>|<br>至今';
    } else {
      const eDate = new Date(evt.endDate);
      const eDateStr = evt.noDay ? `${eDate.getFullYear()}年 ${eDate.getMonth() + 1}月` : `${eDate.getFullYear()}年 ${eDate.getMonth() + 1}月 ${eDate.getDate()}日`;
      dateStr += `<br>|<br>${eDateStr}`;
    }
  }

  const tagInfo = tags[evt.tag || 'other'] || tags['other'] || { label: 'Unknown', color: '#eee', textColor: '#333' };

  const item = document.createElement('div');
  item.className = 'event-item';
  item.innerHTML = `
      <div class="event-marker"></div>
      <div class="event-date-group">
        <span class="event-year-month">${dateStr}</span>
      </div>
      <div class="event-card">
        <h3 class="event-title">${evt.title}</h3>
        <p class="event-desc">${evt.desc || ''}</p>
        <div class="event-tags">
           <span class="tag" style="background-color:${tagInfo.color}; color:${tagInfo.textColor}">${tagInfo.label}</span>
        </div>
      </div>
    `;
  item.querySelector('.event-card').addEventListener('click', () => openModal(evt));
  return item;
}

/* =========================================
   STANDARD EVENT HANDLERS
   ========================================= */

if (fabAdd) fabAdd.addEventListener('click', () => openModal());
if (modalClose) modalClose.addEventListener('click', closeModal);
function closeModal() { modal.classList.remove('open'); }

/* Form Submit */
if (formAdd) formAdd.addEventListener('submit', (e) => {
  e.preventDefault();
  const dateVal = inpDate.value;
  if (!dateVal) return;

  const idVal = inpId.value ? parseInt(inpId.value) : Date.now();
  const newEvent = {
    id: idVal,
    date: dateVal,
    endDate: inpIsPeriod.checked ? inpEndDate.value : null,
    noDay: inpNoDay.checked,
    tag: inpTag.value,
    title: inpTitle.value,
    desc: inpDesc.value
  };

  const idx = events.findIndex(e => e.id === idVal);
  if (idx !== -1) events[idx] = newEvent;
  else events.push(newEvent);

  saveEvents();
  renderTimeline();
  if (viewMultiTrack && viewMultiTrack.classList.contains('open')) renderMultiTrack();
  closeModal();
});

/* Delete */
if (btnDelete) btnDelete.addEventListener('click', () => {
  if (!confirm('確定刪除？')) return;
  const id = parseInt(inpId.value);
  events = events.filter(e => e.id !== id);
  saveEvents();
  renderTimeline();
  if (viewMultiTrack && viewMultiTrack.classList.contains('open')) renderMultiTrack();
  closeModal();
});

inpIsPeriod.addEventListener('change', () => {
  groupEndDate.style.display = inpIsPeriod.checked ? 'block' : 'none';
});

/* Modal Open Logic */
function openModal(evt = null) {
  renderTagOptions();
  modal.classList.add('open');
  if (evt) {
    modalTitle.textContent = '編輯回憶';
    inpId.value = evt.id;
    inpDate.value = evt.date;
    inpIsPeriod.checked = !!evt.endDate;
    groupEndDate.style.display = evt.endDate ? 'block' : 'none';
    inpEndDate.value = evt.endDate || '';
    inpNoDay.checked = !!evt.noDay;
    inpTag.value = evt.tag || 'other';
    inpTitle.value = evt.title;
    inpDesc.value = evt.desc;
    btnDelete.style.display = 'block';
    btnSubmit.textContent = '更新';
  } else {
    modalTitle.textContent = '記錄一刻';
    inpId.value = '';
    inpDate.valueAsDate = new Date();
    inpIsPeriod.checked = false;
    groupEndDate.style.display = 'none';
    inpEndDate.value = '';
    inpNoDay.checked = false;
    inpTag.value = 'life';
    inpTitle.value = '';
    inpDesc.value = '';
    btnDelete.style.display = 'none';
    btnSubmit.textContent = '加入';
  }
}

/* Settings & Filter */
function renderTagOptions() {
  if (!inpTag) return;
  inpTag.innerHTML = '';
  if (!tagOrder) tagOrder = Object.keys(tags);
  if (filterListContainer) filterListContainer.innerHTML = '';

  tagOrder.forEach((key, index) => {
    if (!tags[key]) return;

    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = tags[key].label;
    inpTag.appendChild(opt);

    if (filterListContainer) {
      const row = document.createElement('div');
      row.className = 'filter-row';
      row.dataset.key = key;
      row.draggable = true;

      row.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', key);
        row.classList.add('dragging');
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
      });

      const chip = document.createElement('div');
      chip.className = 'filter-tag-chip';
      chip.style.backgroundColor = tags[key].color;
      chip.style.color = tags[key].textColor;
      chip.textContent = tags[key].label;
      chip.addEventListener('click', () => {
        openFilteredListView(key);
        modalFilter.classList.remove('open');
      });

      // Migrate existing keys if isMain is undefined
      if (tags[key].isMain === undefined) {
        tags[key].isMain = ['academic', 'work', 'love'].includes(key);
      }

      const btnDel = document.createElement('button');
      btnDel.textContent = '🗑️';
      btnDel.className = 'btn-order';
      btnDel.onclick = (e) => { e.stopPropagation(); deleteTag(key); };

      row.appendChild(chip);
      row.appendChild(btnDel);
      filterListContainer.appendChild(row);
    }
  });

  if (filterListContainer) {
    filterListContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(filterListContainer, e.clientY);
      const draggable = document.querySelector('.dragging');
      if (draggable) {
        if (afterElement == null) {
          filterListContainer.appendChild(draggable);
        } else {
          filterListContainer.insertBefore(draggable, afterElement);
        }
      }
    });

    filterListContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const newOrder = [];
      filterListContainer.querySelectorAll('.filter-row').forEach(row => {
        newOrder.push(row.dataset.key);
      });
      tagOrder = newOrder;
      saveTagOrder();
      renderMultiTrack(); // Refresh multi-track when order changes
    });
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.filter-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function openFilteredListView(tagKey) {
  const tagInfo = tags[tagKey];
  const list = events.filter(e => e.tag === tagKey);
  renderFullScreenList(list, `🏷️ 分類：${tagInfo ? tagInfo.label : tagKey} (${list.length})`);
}

function deleteTag(key) {
  const eventsWithTag = events.filter(e => e.tag === key);

  let targetTag = 'other'; // default fallback

  if (eventsWithTag.length > 0) {
    const userInput = prompt(`有 ${eventsWithTag.length} 筆回憶正在使用「${tags[key].label}」標籤。\n若要轉移到其他標籤，請輸入新標籤名稱（留空則預設歸為『其他』）。`, "");

    // User cancelled the prompt entirely
    if (userInput === null) return;

    const inputClean = userInput.trim();
    if (inputClean !== "") {
      // Find the tag key by label
      const foundKey = Object.keys(tags).find(k => tags[k].label === inputClean && k !== key);
      if (foundKey) {
        targetTag = foundKey;
        alert(`已將 ${eventsWithTag.length} 筆回憶轉移至「${tags[targetTag].label}」。`);
      } else {
        alert(`找不到名稱為「${inputClean}」的標籤，或無法轉移給自己，將自動歸為『其他』。`);
      }
    } else {
      alert(`未輸入標籤名稱，將自動歸為『其他』。`);
    }
  } else {
    // If no events are using it, just confirm deletion
    if (!confirm(`確定刪除「${tags[key].label}」標籤嗎？`)) return;
  }

  delete tags[key];
  const idx = tagOrder.indexOf(key);
  if (idx !== -1) tagOrder.splice(idx, 1);

  // Reassign events
  eventsWithTag.forEach(e => { e.tag = targetTag; });

  saveTags();
  saveTagOrder();
  saveEvents();
  renderTagOptions();
  renderTimeline();
}

if (btnAddTag) btnAddTag.addEventListener('click', () => {
  const name = inpNewTagName.value.trim();
  if (!name) return;
  const key = 'tag_' + Date.now();
  tags[key] = { label: name, color: inpNewTagColor.value, textColor: '#333' };
  tagOrder.push(key);
  saveTags(); saveTagOrder();
  renderTagOptions();
  inpNewTagName.value = '';
});

if (btnToggleTheme) {
  btnToggleTheme.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lifeTheme', newTheme);
  });
}

/* Misc Listeners */
if (btnSettings) btnSettings.addEventListener('click', () => {
  if (savedBirthDate) inpSettingsBirthdate.value = savedBirthDate;
  modalSettings.classList.add('open');
});
if (modalSettingsClose) modalSettingsClose.addEventListener('click', () => modalSettings.classList.remove('open'));
if (btnSaveBirthdate) btnSaveBirthdate.addEventListener('click', () => {
  const val = inpSettingsBirthdate.value;
  if (!val) return;
  if (confirm('確定修改生日？')) {
    saveBirthDate(val);
    renderTimeline();
    alert('生日已更新');
    modalSettings.classList.remove('open');
  }
});

if (btnOpenFilter) btnOpenFilter.addEventListener('click', () => {
  renderTagOptions();
  modalFilter.classList.add('open');
});
if (modalFilterClose) modalFilterClose.addEventListener('click', () => modalFilter.classList.remove('open'));

if (btnOpenMultiTrack) btnOpenMultiTrack.addEventListener('click', () => {
  renderMultiTrack();
  viewMultiTrack.classList.add('open');
});
if (btnCloseMultiTrack) btnCloseMultiTrack.addEventListener('click', () => viewMultiTrack.classList.remove('open'));

if (btnTimeCapsule) btnTimeCapsule.addEventListener('click', showTimeCapsule);
if (btnCloseTimeCapsule) btnCloseTimeCapsule.addEventListener('click', () => modalTimeCapsule.classList.remove('open'));
if (btnTimeCapsuleNext) btnTimeCapsuleNext.addEventListener('click', showTimeCapsule);

function showTimeCapsule() {
  if (!events || events.length === 0) {
    alert("您還沒有任何回憶紀錄喔！");
    return;
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const onThisDayEvents = [];
  const thisMonthEvents = [];

  events.forEach(evt => {
    const d = new Date(evt.date);
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (m === currentMonth) {
      if (!evt.noDay && day === currentDay) {
        onThisDayEvents.push(evt);
      } else {
        thisMonthEvents.push(evt);
      }
    }
  });

  let pool = [];
  let title = "";

  // Weights: On this day > This month > Random
  const rand = Math.random();
  if (onThisDayEvents.length > 0 && rand < 0.6) {
    pool = onThisDayEvents;
    title = "歷史上的今天";
  } else if (thisMonthEvents.length > 0 && rand < 0.9) {
    pool = thisMonthEvents;
    title = "那些年的這個月";
  } else {
    pool = events;
    title = "隨機漫遊";
  }

  const selectedEvent = pool[Math.floor(Math.random() * pool.length)];

  const evtDate = new Date(selectedEvent.date);
  let yearDiff = today.getFullYear() - evtDate.getFullYear();
  if (yearDiff > 0) {
    title = `${yearDiff} 年前的` + (title === "歷史上的今天" ? "今天" : (title === "那些年的這個月" ? "這個月" : "某一天"));
  }

  elTimeCapsuleTitle.textContent = title;

  let dateStr = selectedEvent.noDay ?
    `${evtDate.getFullYear()}年 ${evtDate.getMonth() + 1}月` :
    `${evtDate.getFullYear()}年 ${evtDate.getMonth() + 1}月 ${evtDate.getDate()}日`;

  if (selectedEvent.endDate) {
    const eDate = new Date(selectedEvent.endDate);
    const eDateStr = selectedEvent.noDay ? `${eDate.getFullYear()}年 ${eDate.getMonth() + 1}月` : `${eDate.getFullYear()}年 ${eDate.getMonth() + 1}月 ${eDate.getDate()}日`;
    dateStr += ` ~ ${eDateStr}`;
  }

  const tagInfo = tags[selectedEvent.tag || 'other'] || tags['other'] || { label: 'Unknown', color: '#eee', textColor: '#333', border: '#ccc' };

  elTimeCapsuleCard.innerHTML = `
    <div style="font-size: 0.85rem; color: var(--ink-secondary); margin-bottom: 8px;">${dateStr}</div>
    <h3 style="margin: 0 0 10px 0; font-size: 1.3rem;">${selectedEvent.title}</h3>
    <p style="margin: 0 0 15px 0; font-size: 1rem; line-height: 1.5; white-space: pre-wrap; color: var(--ink-primary);">${selectedEvent.desc || '沒有詳細內容'}</p>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
      <span class="tag" style="background-color:${tagInfo.color}; color:${tagInfo.textColor};">${tagInfo.label}</span>
      <button class="capsule-edit-btn" style="pointer-events: auto !important; padding: 4px 8px; font-size: 1.2rem; border: none; background: transparent; cursor: pointer; opacity: 0.7;" title="編輯">✏️</button>
    </div>
  `;

  const editBtn = elTimeCapsuleCard.querySelector('.capsule-edit-btn');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modalTimeCapsule.classList.remove('open');
    openModal(selectedEvent);
  });

  modalTimeCapsule.classList.add('open');
}

if (multitrackContent) {
  multitrackContent.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getMultiTrackDragAfterElement(multitrackContent, e.clientX);
    const draggable = document.querySelector('.multi-dragging');
    if (draggable) {
      if (afterElement == null) {
        // Insert before stream-lane if it exists
        const stream = multitrackContent.querySelector('.stream-lane');
        if (stream) {
          multitrackContent.insertBefore(draggable, stream);
        } else {
          multitrackContent.appendChild(draggable);
        }
      } else {
        // Prevent inserting before axis
        if (afterElement.classList.contains('track-axis')) return;
        multitrackContent.insertBefore(draggable, afterElement);
      }
    }
  });

  multitrackContent.addEventListener('drop', (e) => {
    e.preventDefault();
    const lanes = multitrackContent.querySelectorAll('.track-lane[data-tag-key]');
    const mainTagsInView = Array.from(lanes).map(l => l.dataset.tagKey);

    const newOrder = [];
    let viewIndex = 0;
    tagOrder.forEach(key => {
      if (tags[key] && tags[key].isMain && key !== 'other') {
        newOrder.push(mainTagsInView[viewIndex]);
        viewIndex++;
      } else {
        newOrder.push(key);
      }
    });

    tagOrder = newOrder;
    saveTagOrder();
    renderTagOptions(); // refresh filter options visually
    renderMultiTrack();
  });
}

function getMultiTrackDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll('.track-lane[data-tag-key]:not(.multi-dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* Search & Full Screen List */
function performSearch() {
  const query = inpSearch.value.trim().toLowerCase();
  if (!query) return;
  const results = events.filter(e =>
    e.title.toLowerCase().includes(query)
  );
  renderFullScreenList(results, `🔍 "${inpSearch.value}"`);
  inpSearch.value = '';
}
if (inpSearch) inpSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

function renderFullScreenList(list, title) {
  elFullListView.classList.add('open');
  elListViewTitle.textContent = title;
  elListViewContent.innerHTML = '';
  list.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (list.length === 0) elListViewContent.innerHTML = '<div style="padding:20px;">無結果</div>';

  list.forEach(evt => {
    const item = document.createElement('div');
    item.className = 'list-view-item';
    item.innerHTML = `<div class="list-item-title">${evt.title} <span style="font-size:0.8em;color:#888;">${evt.date}</span></div>`;
    item.addEventListener('click', () => openModal(evt));
    elListViewContent.appendChild(item);
  });
}
if (btnCloseListView) btnCloseListView.addEventListener('click', () => elFullListView.classList.remove('open'));

/* Backup/Reset */
if (btnResetData) btnResetData.addEventListener('click', () => {
  if (confirm('確定要徹底刪除所有資料並重置嗎？')) {
    localStorage.clear();
    location.reload();
  }
});

/* Onboarding Logic */
function checkOnboarding() {
  if (!savedBirthDate) {
    if (modalOnboarding) modalOnboarding.classList.add('open');
  } else {
    renderTimeline();
  }
}

if (btnStartOnboarding) {
  btnStartOnboarding.addEventListener('click', () => {
    const val = inpOnboardingBirthdate.value;
    if (!val) return alert('請輸入出生日期');
    saveBirthDate(val);
    // Add Birth Event
    events.push({
      id: Date.now(),
      date: val,
      title: '我出生了',
      desc: '旅程開始',
      tag: 'life',
      noDay: false
    });
    saveEvents();
    modalOnboarding.classList.remove('open');
    renderTimeline();
  });
}

// Run Init Logic
checkOnboarding();

/* =========================================
   MULTI-TRACK VIEW (AUTO-CONNECTION STATE MACHINE)
   ========================================= */
function renderMultiTrackControls() {
  const controlsDiv = document.getElementById('multitrack-controls');
  if (!controlsDiv) return;
  controlsDiv.innerHTML = '<span style="font-size: 0.9rem; color: #555; margin-right: 8px;">顯示軌道：</span>';

  tagOrder.forEach(key => {
    if (key === 'other' || !tags[key]) return;

    // Migrate existing keys if isMain is undefined
    if (tags[key].isMain === undefined) {
      tags[key].isMain = ['academic', 'work', 'love'].includes(key);
    }

    const btn = document.createElement('button');
    btn.className = 'track-toggle-btn' + (tags[key].isMain ? ' active' : '');
    btn.innerHTML = `${tags[key].label}`;

    btn.onclick = () => {
      tags[key].isMain = !tags[key].isMain;
      saveTags();
      renderTagOptions(); // sync background state
      renderTimeline();   // refresh main timeline list
      renderMultiTrack(); // redraw view
    };

    controlsDiv.appendChild(btn);
  });
}

function renderMultiTrack() {
  renderMultiTrackControls();

  if (!multitrackContent) return;
  multitrackContent.innerHTML = '';
  if (!events || events.length === 0 || !birthDate) return;

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Dynamic track configs based on user tags
  const trackConfigs = [];
  if (tagOrder && tags) {
    tagOrder.forEach(key => {
      // Exclude generic 'other' category and ONLY include tags set as main tracks
      if (key !== 'other' && tags[key] && tags[key].isMain) {
        trackConfigs.push({
          key: key,
          label: tags[key].label,
          color: tags[key].color,
          border: tags[key].textColor
        });
      }
    });
  }

  const states = {};
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // User-defined Period logic only
  sorted.forEach(evt => {
    const t = evt.tag;
    if (!trackConfigs.find(c => c.key === t)) return;
    if (!states[t]) states[t] = [];

    // 1. Explicit user-defined period
    if (evt.endDate !== undefined && evt.endDate !== null) {
      states[t].push({
        startEvt: evt,
        endEvt: { date: evt.endDate === '' ? todayStr : evt.endDate },
        isActive: evt.endDate === ''
      });
    }
  });

  // Calculate Dimensions
  const startYear = birthDate.getFullYear();
  const endYear = now.getFullYear();
  const PIXELS_PER_YEAR = 250; // Increased fixed length per user feedback
  const totalHeight = (endYear - startYear + 2) * PIXELS_PER_YEAR;

  const calculateY = (dateStr) => {
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const frac = d.getMonth() / 12;
    return ((yr - startYear) + frac) * PIXELS_PER_YEAR;
  };

  // Build Auto-Scrolling Axis
  const axis = document.createElement('div');
  axis.className = 'track-axis';
  axis.style.minHeight = `${totalHeight + 40}px`;
  const axisHeader = document.createElement('div');
  axisHeader.className = 'track-header-empty';
  axis.appendChild(axisHeader);

  // We need a wrapper to give absolute items space
  const axisBody = document.createElement('div');
  axisBody.style.position = 'relative';
  axisBody.style.height = `${totalHeight}px`;

  for (let y = startYear; y <= endYear + 1; y++) {
    const yDiv = document.createElement('div');
    yDiv.className = 'axis-year';
    yDiv.textContent = y;
    yDiv.style.top = `${(y - startYear) * PIXELS_PER_YEAR}px`;
    axisBody.appendChild(yDiv);
  }
  axis.appendChild(axisBody);
  multitrackContent.appendChild(axis);

  // Build Lanes
  trackConfigs.forEach(config => {

    const lane = document.createElement('div');
    lane.className = 'track-lane';
    lane.style.minHeight = `${totalHeight + 40}px`;
    lane.dataset.tagKey = config.key;

    lane.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', config.key);
      lane.classList.add('multi-dragging');
    });

    lane.addEventListener('dragend', () => {
      lane.classList.remove('multi-dragging');
      lane.removeAttribute('draggable');
    });

    const header = document.createElement('div');
    header.className = 'track-header';
    header.textContent = config.label;
    header.title = "長按標題拖曳排序";
    header.style.cursor = 'grab';

    header.addEventListener('mousedown', () => lane.setAttribute('draggable', true));
    header.addEventListener('touchstart', () => lane.setAttribute('draggable', true), { passive: true });

    lane.appendChild(header);

    const body = document.createElement('div');
    body.className = 'track-body';
    body.style.height = `${totalHeight}px`;

    // State blocks
    if (states[config.key]) {
      states[config.key].forEach(st => {
        const topY = calculateY(st.startEvt.date);
        const bottomY = calculateY(st.endEvt.date);
        const h = Math.max(bottomY - topY, 15);

        const block = document.createElement('div');
        block.className = 'state-block';
        block.style.top = `${topY}px`;
        block.style.height = `${h}px`;
        block.style.backgroundColor = config.color;
        block.style.borderColor = config.border;
        if (st.isActive) block.style.borderBottom = `2px dashed ${config.border}`;

        const shortStartYr = st.startEvt.date.substring(0, 4);
        const shortEndYr = st.isActive ? '至今' : st.endEvt.date.substring(0, 4);
        block.innerHTML = `<div class="state-block-title">${st.startEvt.title}</div>
                           <div class="state-block-duration">${shortStartYr} - ${shortEndYr}</div>`;
        body.appendChild(block);
      });
    }

    // Event capsules
    // Event capsules (With Micro-Aggregation)
    const laneEvents = sorted.filter(e => e.tag === config.key);

    // Aggregation config
    const pixelsPerBucket = 30;
    const bucketedEvents = {};

    // Group events by 30px height buckets
    laneEvents.forEach(evt => {
      const topY = calculateY(evt.date);
      const bucketIndex = Math.floor(topY / pixelsPerBucket);
      if (!bucketedEvents[bucketIndex]) {
        bucketedEvents[bucketIndex] = {
          topY: bucketIndex * pixelsPerBucket + (pixelsPerBucket / 2),
          events: []
        };
      }
      bucketedEvents[bucketIndex].events.push(evt);
    });

    // Render from buckets
    Object.values(bucketedEvents).forEach(bucket => {
      if (bucket.events.length === 1) {
        // Render Single Event (Original logic)
        const evt = bucket.events[0];
        const dot = document.createElement('div');
        dot.className = 'track-event-capsule';
        dot.style.top = `${bucket.topY}px`;
        dot.style.borderColor = config.border;
        dot.style.color = config.border;
        dot.textContent = '';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'capsule-title';
        titleSpan.textContent = evt.title;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'capsule-edit-btn';
        editBtn.title = '編輯';
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openModal(evt);
        });

        dot.appendChild(titleSpan);
        dot.appendChild(editBtn);

        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          dot.classList.toggle('expanded');
          if (dot.classList.contains('expanded')) {
            dot.style.zIndex = '10';
          } else {
            setTimeout(() => { if (!dot.classList.contains('expanded')) dot.style.zIndex = ''; }, 200);
          }
        });
        body.appendChild(dot);
      } else {
        // Render Aggregated Event Capsule
        const dot = document.createElement('div');
        dot.className = 'track-event-capsule summary-capsule';
        dot.style.top = `${bucket.topY}px`;
        dot.style.borderColor = config.border;
        dot.style.color = config.border;

        const summaryTitle = document.createElement('span');
        summaryTitle.className = 'capsule-title';
        summaryTitle.innerHTML = `✨ ${bucket.events.length} 件${config.label}小事`;
        dot.appendChild(summaryTitle);

        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          dot.classList.toggle('expanded');
          if (dot.classList.contains('expanded')) {
            dot.style.zIndex = '10';
            dot.innerHTML = ''; // Clear summary text

            // Build the detailed list
            bucket.events.forEach((item, idx) => {
              const childDot = document.createElement('div');
              childDot.className = 'stream-child-event';
              childDot.style.color = config.border;

              const childTitleSpan = document.createElement('span');
              childTitleSpan.className = 'capsule-title';
              childTitleSpan.textContent = item.title;

              const childEditBtn = document.createElement('button');
              childEditBtn.type = 'button';
              childEditBtn.className = 'capsule-edit-btn';
              childEditBtn.title = '編輯';
              childEditBtn.textContent = '✏️';
              childEditBtn.addEventListener('click', (e2) => {
                e2.stopPropagation();
                openModal(item);
              });

              childDot.appendChild(childTitleSpan);
              childDot.appendChild(childEditBtn);

              if (idx < bucket.events.length - 1) {
                childDot.style.borderBottom = '1px dashed #eee';
                childDot.style.paddingBottom = '8px';
                childDot.style.marginBottom = '8px';
              }
              dot.appendChild(childDot);
            });
          } else {
            setTimeout(() => {
              if (!dot.classList.contains('expanded')) {
                dot.style.zIndex = '';
                dot.innerHTML = '';
                dot.appendChild(summaryTitle);
              }
            }, 200);
          }
        });
        body.appendChild(dot);
      }
    });

    lane.appendChild(body);
    multitrackContent.appendChild(lane);
  });

  // Build "Life Stream" (匯流排) for all other tags with Micro-Aggregation (微觀聚合)
  const streamLane = document.createElement('div');
  streamLane.className = 'track-lane stream-lane';
  streamLane.style.backgroundColor = '#fcfbfa'; /* slight contrast */

  const streamHeader = document.createElement('div');
  streamHeader.className = 'track-header';
  streamHeader.textContent = '🌟 生活點滴';
  streamHeader.title = "生活點滴 (點擊收起)";
  streamLane.appendChild(streamHeader);

  const streamBody = document.createElement('div');
  streamBody.className = 'track-body';
  streamBody.style.height = `${totalHeight}px`;

  const mainLaneKeys = trackConfigs.map(c => c.key);
  const streamEvents = sorted.filter(e => !mainLaneKeys.includes(e.tag) && e.tag !== 'other');

  // Grid layout simple clustering: grouping events roughly by same month (same topY bucket)
  const yBuckets = {};
  const BUCKET_SIZE = 30; // pixels to aggregate

  streamEvents.forEach(evt => {
    const topY = calculateY(evt.date);
    const bucket = Math.floor(topY / BUCKET_SIZE);
    if (!yBuckets[bucket]) yBuckets[bucket] = [];
    yBuckets[bucket].push({ evt, topY });
  });

  Object.values(yBuckets).forEach(bucketList => {
    // If only 1 event, render normally as capsule
    if (bucketList.length === 1) {
      const item = bucketList[0];
      const dot = document.createElement('div');
      dot.className = 'track-event-capsule';
      dot.style.top = `${item.topY}px`;

      let borderColor = '#8c7b75';
      const tc = trackConfigs.find(c => c.key === item.evt.tag);
      if (tc && tc.border) borderColor = tc.border;
      dot.style.borderColor = borderColor;
      dot.style.color = borderColor;

      dot.textContent = '';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'capsule-title';
      titleSpan.textContent = item.evt.title;

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'capsule-edit-btn';
      editBtn.title = '編輯';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(item.evt);
      });

      dot.appendChild(titleSpan);
      dot.appendChild(editBtn);

      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        dot.classList.toggle('expanded');
        if (dot.classList.contains('expanded')) {
          dot.style.zIndex = '10';
        } else {
          setTimeout(() => { if (!dot.classList.contains('expanded')) dot.style.zIndex = ''; }, 200);
        }
      });
      streamBody.appendChild(dot);
    }
    // If multiple events, create an Aggregated Capsule
    else {
      const avgTopY = bucketList.reduce((sum, it) => sum + it.topY, 0) / bucketList.length;

      const groupContainer = document.createElement('div');

      // The summary capsule
      const summaryDot = document.createElement('div');
      summaryDot.className = 'track-event-capsule summary-capsule';
      summaryDot.style.top = `${avgTopY}px`;
      summaryDot.style.borderColor = '#8c7b75';
      summaryDot.style.color = '#8c7b75';
      summaryDot.style.backgroundColor = '#fdfbf7';
      summaryDot.innerHTML = `✨ ${bucketList.length} 件生活小事`;

      groupContainer.appendChild(summaryDot);

      // Container for expanded items (hidden by default)
      const expandContainer = document.createElement('div');
      expandContainer.style.display = 'none';

      bucketList.forEach((item, index) => {
        const childDot = document.createElement('div');
        childDot.className = 'track-event-capsule';
        // Stagger them slightly downwards when expanded
        childDot.style.top = `${avgTopY + (index * 25) + 30}px`;

        let borderColor = '#8c7b75';
        const tc = trackConfigs.find(c => c.key === item.evt.tag);
        if (tc && tc.border) borderColor = tc.border;
        childDot.style.borderColor = borderColor;
        childDot.style.color = borderColor;

        childDot.textContent = '';

        const childTitleSpan = document.createElement('span');
        childTitleSpan.className = 'capsule-title';
        childTitleSpan.textContent = item.evt.title;

        const childEditBtn = document.createElement('button');
        childEditBtn.type = 'button';
        childEditBtn.className = 'capsule-edit-btn';
        childEditBtn.title = '編輯';
        childEditBtn.textContent = '✏️';
        childEditBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openModal(item.evt);
        });

        childDot.appendChild(childTitleSpan);
        childDot.appendChild(childEditBtn);

        childDot.addEventListener('click', (e) => {
          e.stopPropagation();
          childDot.classList.toggle('expanded');
          if (childDot.classList.contains('expanded')) {
            childDot.style.zIndex = '10';
          } else {
            setTimeout(() => { if (!childDot.classList.contains('expanded')) childDot.style.zIndex = ''; }, 200);
          }
        });
        expandContainer.appendChild(childDot);
      });

      groupContainer.appendChild(expandContainer);

      // Toggle expansion
      summaryDot.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = expandContainer.style.display === 'block';
        expandContainer.style.display = isExpanded ? 'none' : 'block';
        summaryDot.style.opacity = isExpanded ? '1' : '0.5';
      });

      streamBody.appendChild(groupContainer);
    }
  });

  streamLane.appendChild(streamBody);
  multitrackContent.appendChild(streamLane);
}
