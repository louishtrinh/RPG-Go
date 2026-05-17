// ── Constants ─────────────────────────────────────────────────────────────

const HEX_SIZE           = 0.0007;
const SQRT3              = Math.sqrt(3);
const MIN_ZOOM_RESOURCES = 15;
const SYNC_MS            = 5000;

const RESOURCES = [
  { type: 'wood',  icon: '🌲', name: 'Wood',  color: '#388e3c', fill: 'rgba(56,142,60,0.38)',   w: 0.35 },
  { type: 'stone', icon: '🪨', name: 'Stone', color: '#757575', fill: 'rgba(117,117,117,0.38)', w: 0.25 },
  { type: 'iron',  icon: '⚙️', name: 'Iron',  color: '#8d6e63', fill: 'rgba(141,110,99,0.38)',  w: 0.18 },
  { type: 'food',  icon: '🌾', name: 'Grain', color: '#f9a825', fill: 'rgba(249,168,37,0.38)',  w: 0.12 },
  { type: 'gold',  icon: '💰', name: 'Gold',  color: '#fdd835', fill: 'rgba(253,216,53,0.38)',  w: 0.06 },
  { type: 'gem',   icon: '💎', name: 'Gems',  color: '#1e88e5', fill: 'rgba(30,136,229,0.38)', w: 0.04 },
];

// ── Deterministic resource hash (mirrors server) ──────────────────────────

function hash32(x, y) {
  let h = Math.imul(x, 0x9e3779b9) ^ Math.imul(y, 0x517cc1b7);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function getResource(q, r) {
  const rng = seededRng(hash32(q, r));
  if (rng() > 0.15) return null;
  const roll = rng();
  let cum = 0;
  for (const res of RESOURCES) {
    cum += res.w;
    if (roll < cum) return res;
  }
  return RESOURCES[0];
}

// ── Hex coordinate helpers (pointy-top axial) ─────────────────────────────

function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

function latLngToHex(lat, lng) {
  const qf = (lng / HEX_SIZE) / SQRT3 - (lat / HEX_SIZE) / 3;
  const rf  = (lat / HEX_SIZE) * 2 / 3;
  return hexRound(qf, rf);
}

function hexCenter(q, r) {
  return {
    lat: HEX_SIZE * 1.5 * r,
    lng: HEX_SIZE * SQRT3 * (q + r / 2),
  };
}

function hexVertices(lat, lng, scale = 1) {
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    verts.push([
      lat - HEX_SIZE * scale * Math.sin(angle),
      lng + HEX_SIZE * scale * Math.cos(angle),
    ]);
  }
  return verts;
}

function gkey(q, r) { return `${q}_${r}`; }

// ── Game state ────────────────────────────────────────────────────────────

let map, gridCanvas;
let player        = null;
let playerMarker  = null;
let resourceLayers = new Map();
let collectedSet   = new Map();
let otherMarkers   = new Map();

// ── API ───────────────────────────────────────────────────────────────────

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) throw Object.assign(new Error(await res.text()), { status: res.status });
  return res.json();
}

// ── Login ─────────────────────────────────────────────────────────────────

async function startGame() {
  const nameEl = document.getElementById('player-name');
  const name   = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }

  const btn = document.getElementById('start-btn');
  btn.disabled = true;
  btn.textContent = 'Locating…';

  let lat, lng;
  try {
    const pos = await new Promise((ok, fail) =>
      navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 8000 })
        : fail(new Error('no geolocation'))
    );
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
  } catch {
    lat = 37.3382; lng = -121.8863;
    addLog('📍 Location unavailable — defaulting to San Jose, CA', 'warn');
  }

  try {
    const data = await api('/api/player/join', 'POST', { name, lat, lng });
    player = { ...data, q: data.hexQ, r: data.hexR };
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Begin Adventure';
    addLog(`Error: ${e.message}`, 'warn');
    return;
  }

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  initMap(lat, lng);
}

// ── Map ───────────────────────────────────────────────────────────────────

function initMap(lat, lng) {
  map = L.map('map', {
    center: [lat, lng],
    zoom: 17,
    zoomControl: true,
    doubleClickZoom: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19,
  }).addTo(map);

  initGridCanvas();

  playerMarker = L.marker([lat, lng], { icon: heroIcon(player.name), zIndexOffset: 1000 })
    .addTo(map)
    .bindTooltip(`⚔️ ${player.name} (you)`, { className: 'res-tooltip' });

  updateTopBar();
  refreshResources();
  syncPlayers();

  map.on('click', onMapClick);
  map.on('moveend zoomend', refreshResources);

  setInterval(() => { refreshResources(); syncPlayers(); }, SYNC_MS);

  addLog(`⚔️ ${player.name} enters the world`, 'move');
}

// ── Grid canvas ───────────────────────────────────────────────────────────

function initGridCanvas() {
  gridCanvas = document.createElement('canvas');
  gridCanvas.className = 'grid-canvas';
  map.getPanes().overlayPane.appendChild(gridCanvas);
  map.on('moveend zoomend resize', drawGrid);
  drawGrid();
}

function drawGrid() {
  const size = map.getSize();
  const zoom = map.getZoom();
  const ctx  = gridCanvas.getContext('2d');

  gridCanvas.width  = size.x;
  gridCanvas.height = size.y;
  ctx.clearRect(0, 0, size.x, size.y);

  if (zoom < MIN_ZOOM_RESOURCES) {
    document.getElementById('zoom-hint').classList.remove('hidden');
    return;
  }
  document.getElementById('zoom-hint').classList.add('hidden');

  const alpha = Math.min(1, (zoom - MIN_ZOOM_RESOURCES) / 2) * 0.45;
  ctx.strokeStyle = `rgba(100, 149, 237, ${alpha})`;
  ctx.lineWidth = 1;

  const bounds = map.getBounds();
  const sw = latLngToHex(bounds.getSouth(), bounds.getWest());
  const ne = latLngToHex(bounds.getNorth(), bounds.getEast());
  const qMin = Math.min(sw.q, ne.q) - 2;
  const qMax = Math.max(sw.q, ne.q) + 2;
  const rMin = Math.min(sw.r, ne.r) - 2;
  const rMax = Math.max(sw.r, ne.r) + 2;

  // pixel radius: distance from center to vertex = HEX_SIZE degrees
  const ctr = map.getCenter();
  const p0  = map.latLngToContainerPoint([ctr.lat, ctr.lng]);
  const p1  = map.latLngToContainerPoint([ctr.lat + HEX_SIZE, ctr.lng]);
  const R   = Math.hypot(p1.x - p0.x, p1.y - p0.y);

  for (let r = rMin; r <= rMax; r++) {
    for (let q = qMin; q <= qMax; q++) {
      const c  = hexCenter(q, r);
      const cp = map.latLngToContainerPoint([c.lat, c.lng]);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        const x = cp.x + R * Math.cos(angle);
        const y = cp.y + R * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

// ── Resources ─────────────────────────────────────────────────────────────

async function refreshResources() {
  if (map.getZoom() < MIN_ZOOM_RESOURCES) { clearResourceLayers(); return; }

  let data;
  try { data = await api('/api/resources'); } catch { return; }

  collectedSet.clear();
  for (const [k, ts] of Object.entries(data.collected)) collectedSet.set(k, ts);

  renderResourcesInView();
}

function renderResourcesInView() {
  const bounds = map.getBounds();
  const sw = latLngToHex(bounds.getSouth(), bounds.getWest());
  const ne = latLngToHex(bounds.getNorth(), bounds.getEast());
  const qMin = Math.min(sw.q, ne.q) - 1;
  const qMax = Math.max(sw.q, ne.q) + 1;
  const rMin = Math.min(sw.r, ne.r) - 1;
  const rMax = Math.max(sw.r, ne.r) + 1;

  if ((qMax - qMin) * (rMax - rMin) > 600) return;

  const wanted = new Set();

  for (let r = rMin; r <= rMax; r++) {
    for (let q = qMin; q <= qMax; q++) {
      const def = getResource(q, r);
      if (!def) continue;
      const k = gkey(q, r);
      if (collectedSet.has(k)) continue;
      wanted.add(k);

      if (!resourceLayers.has(k)) {
        const c = hexCenter(q, r);
        const poly = L.polygon(hexVertices(c.lat, c.lng, 0.88), {
          color: def.color, weight: 1.5,
          fillColor: def.fill, fillOpacity: 1,
          interactive: false,
        }).addTo(map);
        resourceLayers.set(k, poly);
      }
    }
  }

  for (const [k, layer] of resourceLayers) {
    if (!wanted.has(k)) { map.removeLayer(layer); resourceLayers.delete(k); }
  }
}

function clearResourceLayers() {
  resourceLayers.forEach(l => map.removeLayer(l));
  resourceLayers.clear();
}

// ── Click handler — move or collect ──────────────────────────────────────

async function onMapClick(e) {
  const { q, r } = latLngToHex(e.latlng.lat, e.latlng.lng);
  const k   = gkey(q, r);
  const def = getResource(q, r);

  if (def && !collectedSet.has(k)) {
    await collectResource(q, r, def);
  } else {
    await moveTo(q, r);
  }
}

// ── Collect ───────────────────────────────────────────────────────────────

async function collectResource(q, r, def) {
  const dq = Math.abs(player.q - q);
  const dr = Math.abs(player.r - r);
  if (dq > 1 || dr > 1) await moveTo(q, r);

  let result;
  try {
    result = await api('/api/collect', 'POST', { playerId: player.id, hexQ: q, hexR: r });
  } catch (e) {
    const msg = e.status === 409
      ? `${def.icon} Already collected — respawning soon`
      : `${def.icon} Collect failed: ${e.message}`;
    addLog(msg, 'warn');
    return;
  }

  player.inventory = result.inventory;

  const k = gkey(q, r);
  if (resourceLayers.has(k)) { map.removeLayer(resourceLayers.get(k)); resourceLayers.delete(k); }
  collectedSet.set(k, Date.now());

  showPopup(def);
  updateInventoryPanel();
  addLog(`${def.icon} Collected ${def.name}`, 'collect');
  flashTopLog(`${def.icon} +1 ${def.name}`);
}

// ── Movement ──────────────────────────────────────────────────────────────

async function moveTo(q, r) {
  const { lat, lng } = hexCenter(q, r);
  player.lat = lat; player.lng = lng; player.q = q; player.r = r;
  playerMarker.setLatLng([lat, lng]);
  updateTopBar();
  api('/api/player/move', 'POST', { playerId: player.id, lat, lng, hexQ: q, hexR: r })
    .catch(() => {});
}

// ── Other players ─────────────────────────────────────────────────────────

async function syncPlayers() {
  let data;
  try {
    data = await api(`/api/players/nearby?lat=${player.lat}&lng=${player.lng}&playerId=${player.id}`);
  } catch { return; }

  otherMarkers.forEach(m => map.removeLayer(m));
  otherMarkers.clear();

  const el = document.getElementById('nearby-players');
  el.innerHTML = '';

  for (const p of data.players) {
    const m = L.marker([p.lat, p.lng], { icon: otherIcon() })
      .addTo(map)
      .bindTooltip(`⚔️ ${p.name}`, { className: 'res-tooltip' });
    otherMarkers.set(p.id, m);
    el.innerHTML += `<div class="player-row"><div class="player-pip"></div>${p.name}</div>`;
  }

  if (!data.players.length)
    el.innerHTML = '<span class="dim" style="font-size:12px">No heroes nearby</span>';
}

// ── Tab navigation ────────────────────────────────────────────────────────

function setTab(btn) {
  if (btn.classList.contains('dim-tab')) return;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const tab   = btn.dataset.tab;
  const panel = document.getElementById('panel');

  document.querySelectorAll('.panel-section').forEach(s => s.classList.add('hidden'));

  if (tab === 'map') {
    panel.classList.add('hidden');
    setTimeout(() => { map.invalidateSize(); drawGrid(); }, 50);
    return;
  }

  panel.classList.remove('hidden');
  setTimeout(() => { map.invalidateSize(); drawGrid(); }, 50);

  const section = document.getElementById(`panel-${tab}`);
  if (section) section.classList.remove('hidden');

  if (tab === 'bag') updateInventoryPanel();
}

// ── UI helpers ────────────────────────────────────────────────────────────

function updateTopBar() {
  document.getElementById('hero-name-top').textContent = `⚔️ ${player.name}`;
  document.getElementById('hero-grid-top').textContent = `${player.q}, ${player.r}`;
}

function updateInventoryPanel() {
  const inv   = player.inventory || {};
  const el    = document.getElementById('inventory');
  const cells = RESOURCES.filter(r => (inv[r.type] || 0) > 0)
    .map(r => `
      <div class="inv-cell" style="border-color:${r.color}55">
        <span class="inv-icon">${r.icon}</span>
        <div class="inv-count">${inv[r.type]}</div>
        <div class="inv-label">${r.name}</div>
      </div>`).join('');

  el.innerHTML = cells ||
    `<span class="dim" style="font-size:12px;grid-column:span 3">
       Walk the map and collect resources
     </span>`;
}

function showPopup(def) {
  const popup = document.getElementById('collect-popup');
  document.getElementById('popup-icon').textContent = def.icon;
  document.getElementById('popup-text').textContent  = `+1 ${def.name}!`;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 1400);
}

function flashTopLog(msg) {
  const pill = document.getElementById('top-log-pill');
  pill.textContent = msg;
  pill.classList.remove('hidden');
  pill.style.animation = 'none';
  void pill.offsetWidth;
  pill.style.animation = '';
  setTimeout(() => pill.classList.add('hidden'), 2200);
}

function addLog(msg, type = '') {
  const log = document.getElementById('activity-log');
  const row = document.createElement('div');
  row.className = `log-row ${type}`;
  row.textContent = msg;
  log.insertBefore(row, log.firstChild);
  while (log.children.length > 30) log.lastChild.remove();
}

function heroIcon(name) {
  return L.divIcon({
    className: '',
    html: `<div class="hero-icon" title="${name}">⚔️</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  });
}

function otherIcon() {
  return L.divIcon({ className: 'other-icon', iconSize: [14, 14], iconAnchor: [7, 7] });
}
