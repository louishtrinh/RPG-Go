// ── Constants ─────────────────────────────────────────────────────────────

const HEX_SIZE           = 0.0007;
const SQRT3              = Math.sqrt(3);
const MIN_ZOOM_RESOURCES = 15;
const SYNC_MS            = 5000;
const MOVE_MS_PER_HEX    = 500;

const RESOURCES = [
  { type: 'wood',  icon: '🌲', name: 'Wood',  color: '#388e3c', fill: 'rgba(56,142,60,0.28)',   w: 0.35 },
  { type: 'stone', icon: '🪨', name: 'Stone', color: '#757575', fill: 'rgba(117,117,117,0.28)', w: 0.25 },
  { type: 'iron',  icon: '⚙️', name: 'Iron',  color: '#8d6e63', fill: 'rgba(141,110,99,0.28)',  w: 0.18 },
  { type: 'food',  icon: '🌾', name: 'Grain', color: '#f9a825', fill: 'rgba(249,168,37,0.28)',  w: 0.12 },
  { type: 'gold',  icon: '💰', name: 'Gold',  color: '#fdd835', fill: 'rgba(253,216,53,0.28)',  w: 0.06 },
  { type: 'gem',   icon: '💎', name: 'Gems',  color: '#1e88e5', fill: 'rgba(30,136,229,0.28)', w: 0.04 },
];

const RESOURCE_FILL_MAP = Object.fromEntries(RESOURCES.map(r => [r.type, r.fill]));

// ── Resource SVG sprites ──────────────────────────────────────────────────

const SPRITES = {
  wood: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="34" rx="14" ry="4" fill="rgba(0,0,0,0.4)"/>
    <rect x="4"  y="24" width="13" height="7" rx="3.5" fill="#4e2600"/>
    <rect x="23" y="24" width="13" height="7" rx="3.5" fill="#5c3000"/>
    <ellipse cx="4"  cy="27.5" rx="3.5" ry="3.5" fill="#6b3a00" stroke="#3a1a00" stroke-width="1"/>
    <ellipse cx="17" cy="27.5" rx="3.5" ry="3.5" fill="#7a4400" stroke="#3a1a00" stroke-width="1"/>
    <ellipse cx="23" cy="27.5" rx="3.5" ry="3.5" fill="#6b3a00" stroke="#3a1a00" stroke-width="1"/>
    <ellipse cx="36" cy="27.5" rx="3.5" ry="3.5" fill="#7a4400" stroke="#3a1a00" stroke-width="1"/>
    <rect x="11" y="17" width="18" height="7" rx="3.5" fill="#8b5e00"/>
    <ellipse cx="11" cy="20.5" rx="3.5" ry="3.5" fill="#a06b00" stroke="#5c3800" stroke-width="1"/>
    <ellipse cx="29" cy="20.5" rx="3.5" ry="3.5" fill="#a06b00" stroke="#5c3800" stroke-width="1"/>
    <circle cx="20" cy="20.5" r="2" fill="none" stroke="#6b4400" stroke-width="0.8"/>
    <circle cx="20" cy="20.5" r="0.8" fill="#6b4400"/>
    <line x1="28" y1="18" x2="33" y2="8" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M31 10 Q36 6 36 12 Q33 13 31 10Z" fill="${color}"/>
  </svg>`,

  stone: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="35" rx="15" ry="4" fill="rgba(0,0,0,0.4)"/>
    <ellipse cx="10" cy="26" rx="8"  ry="7"  fill="#4a4a4a"/>
    <ellipse cx="30" cy="25" rx="7"  ry="6"  fill="#525252"/>
    <ellipse cx="20" cy="28" rx="10" ry="9"  fill="#616161"/>
    <path d="M14 22 L18 19 L16 24Z" fill="#757575"/>
    <path d="M24 20 L27 23 L22 24Z" fill="#6e6e6e"/>
    <circle cx="16" cy="23" r="1.2" fill="rgba(255,255,255,0.25)"/>
    <line x1="28" y1="20" x2="35" y2="10" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M33 12 Q38 7 38 13 Q35 15 33 12Z" fill="${color}"/>
  </svg>`,

  iron: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="35" rx="14" ry="4" fill="rgba(0,0,0,0.4)"/>
    <polygon points="8,30 6,22 14,18 18,28" fill="#5d4037"/>
    <polygon points="22,28 20,18 30,16 32,26" fill="#6d4c41"/>
    <polygon points="12,32 10,24 22,22 24,32" fill="#795548"/>
    <polygon points="9,28 7,23 13,20 16,26" fill="${color}" opacity="0.7"/>
    <polygon points="23,26 22,20 28,18 30,24" fill="${color}" opacity="0.6"/>
    <polygon points="14,30 13,25 20,23 22,29" fill="${color}" opacity="0.8"/>
    <circle cx="10" cy="24" r="1" fill="rgba(255,255,255,0.3)"/>
    <line x1="28" y1="20" x2="35" y2="10" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M33 12 Q38 7 38 13 Q35 15 33 12Z" fill="#aaa"/>
  </svg>`,

  food: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="36" rx="13" ry="3.5" fill="rgba(0,0,0,0.35)"/>
    <line x1="12" y1="34" x2="12" y2="14" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="17" y1="34" x2="17" y2="12" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="22" y1="34" x2="22" y2="13" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="27" y1="34" x2="27" y2="15" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="12" cy="11" rx="2.5" ry="5" fill="${color}" transform="rotate(-8,12,11)"/>
    <ellipse cx="17" cy="9"  rx="2.5" ry="5" fill="${color}" transform="rotate(5,17,9)"/>
    <ellipse cx="22" cy="10" rx="2.5" ry="5" fill="${color}" transform="rotate(-3,22,10)"/>
    <ellipse cx="27" cy="12" rx="2.5" ry="5" fill="${color}" transform="rotate(8,27,12)"/>
    <path d="M12 20 Q7 17 9 14" stroke="#6b8e23" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M22 19 Q27 16 25 13" stroke="#6b8e23" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <rect x="11" y="29" width="18" height="3" rx="1.5" fill="#8b6914" opacity="0.7"/>
  </svg>`,

  gold: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="35" rx="13" ry="3.5" fill="rgba(0,0,0,0.4)"/>
    <ellipse cx="20" cy="22" rx="11" ry="4" fill="#a07800"/>
    <rect x="9" y="18" width="22" height="4" fill="#a07800"/>
    <ellipse cx="20" cy="18" rx="11" ry="4" fill="#b08800"/>
    <ellipse cx="20" cy="26" rx="11" ry="4" fill="#b09000"/>
    <rect x="9" y="22" width="22" height="4" fill="#b09000"/>
    <ellipse cx="20" cy="22" rx="11" ry="4" fill="#c09800"/>
    <ellipse cx="20" cy="30" rx="11" ry="4" fill="#c8a000"/>
    <rect x="9" y="26" width="22" height="4" fill="#c8a000"/>
    <ellipse cx="20" cy="26" rx="11" ry="4" fill="${color}"/>
    <ellipse cx="20" cy="26" rx="7" ry="2.5" fill="none" stroke="#c09000" stroke-width="0.8"/>
    <ellipse cx="14" cy="24" rx="2" ry="0.8" fill="rgba(255,255,255,0.3)" transform="rotate(-20,14,24)"/>
  </svg>`,

  gem: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="36" rx="12" ry="3" fill="rgba(0,0,0,0.4)"/>
    <polygon points="16,34 12,20 20,16 24,34" fill="#0d47a1" opacity="0.8"/>
    <polygon points="10,32 7,18 16,14 17,30" fill="#1565c0"/>
    <polygon points="30,32 33,17 24,13 23,30" fill="#1565c0"/>
    <polygon points="14,34 12,16 20,10 28,16 26,34" fill="${color}"/>
    <polygon points="14,34 12,16 20,10" fill="#42a5f5" opacity="0.5"/>
    <line x1="20" y1="10" x2="20" y2="34" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
    <line x1="20" y1="10" x2="14" y2="22" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
    <line x1="20" y1="10" x2="26" y2="22" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
    <circle cx="18" cy="14" r="1.5" fill="rgba(255,255,255,0.7)"/>
  </svg>`,
};

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

function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

function hexLinePath(q1, r1, q2, r2) {
  const n = hexDistance(q1, r1, q2, r2);
  if (n === 0) return [];
  const steps = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    steps.push(hexRound(q1 + (q2 - q1) * t, r1 + (r2 - r1) * t));
  }
  return steps;
}

function gkey(q, r) { return `${q}_${r}`; }

// ── Game state ────────────────────────────────────────────────────────────

let map, gridCanvas;
let player         = null;
let playerMarker   = null;
let resourceMarkers = new Map(); // key → L.marker (sprite only)
let collectedSet    = new Map();
let otherMarkers    = new Map();
let isMoving        = false;
let moveLine        = null; // L.polyline for movement path
let suppressRedraw  = false;

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
    const q = data.hexQ, r = data.hexR;
    const center = hexCenter(q, r);
    player = { ...data, q, r, lat: center.lat, lng: center.lng };
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Begin Adventure';
    addLog(`Error: ${e.message}`, 'warn');
    return;
  }

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  initMap(player.lat, player.lng);
}

// ── Map ───────────────────────────────────────────────────────────────────

function initMap(lat, lng) {
  map = L.map('map', {
    center: [lat, lng],
    zoom: 17,
    zoomControl: true,
    doubleClickZoom: false,
    dragging: false,       // locked to hero
    scrollWheelZoom: true,
    touchZoom: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19,
    minZoom: 14,
  }).addTo(map);

  // Re-centre on hero after any zoom
  map.on('zoomend', () => {
    if (player) map.setView([player.lat, player.lng], map.getZoom(), { animate: false });
  });

  initGridCanvas();

  playerMarker = L.marker([lat, lng], { icon: heroIcon(player.name), zIndexOffset: 1000 })
    .addTo(map)
    .bindTooltip(`⚔️ ${player.name} (you)`, { className: 'res-tooltip' });

  updateTopBar();
  updateResourceBar();
  refreshResources();
  syncPlayers();

  map.on('click', onMapClick);
  map.on('moveend zoomend', () => { if (!suppressRedraw) { drawGrid(); syncResourceMarkers(); } });

  setInterval(() => { refreshResources(); syncPlayers(); }, SYNC_MS);

  addLog(`⚔️ ${player.name} enters the world`, 'move');
}

// ── Grid canvas (draws outlines + resource fills) ─────────────────────────

function initGridCanvas() {
  gridCanvas = document.createElement('canvas');
  gridCanvas.className = 'grid-canvas';
  document.getElementById('map').appendChild(gridCanvas); // child of map div, not overlayPane
  drawGrid();
}

function traceHexOnCanvas(ctx, cp, R) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const x = cp.x + R * Math.cos(angle);
    const y = cp.y + R * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawGrid() {
  if (!map) return;
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

  const bounds = map.getBounds();
  const sw = latLngToHex(bounds.getSouth(), bounds.getWest());
  const ne = latLngToHex(bounds.getNorth(), bounds.getEast());
  const qMin = Math.min(sw.q, ne.q) - 2;
  const qMax = Math.max(sw.q, ne.q) + 2;
  const rMin = Math.min(sw.r, ne.r) - 2;
  const rMax = Math.max(sw.r, ne.r) + 2;

  // R = pixel distance for one hex unit in the lng direction
  const ctr = map.getCenter();
  const p0  = map.latLngToContainerPoint([ctr.lat, ctr.lng]);
  const p1  = map.latLngToContainerPoint([ctr.lat, ctr.lng + HEX_SIZE]);
  const R   = Math.abs(p1.x - p0.x);

  const alpha = Math.min(1, (zoom - MIN_ZOOM_RESOURCES) / 2) * 0.45;

  // First pass: fills
  for (let r = rMin; r <= rMax; r++) {
    for (let q = qMin; q <= qMax; q++) {
      const k   = gkey(q, r);
      const def = getResource(q, r);
      if (!def || collectedSet.has(k)) continue;
      const c  = hexCenter(q, r);
      const cp = map.latLngToContainerPoint([c.lat, c.lng]);
      traceHexOnCanvas(ctx, cp, R * 0.97);
      ctx.fillStyle = def.fill;
      ctx.fill();
    }
  }

  // Second pass: outlines
  ctx.strokeStyle = `rgba(100, 149, 237, ${alpha})`;
  ctx.lineWidth   = 1;
  for (let r = rMin; r <= rMax; r++) {
    for (let q = qMin; q <= qMax; q++) {
      const c  = hexCenter(q, r);
      const cp = map.latLngToContainerPoint([c.lat, c.lng]);
      traceHexOnCanvas(ctx, cp, R);
      ctx.stroke();
    }
  }
}

// ── Resource sprite markers ───────────────────────────────────────────────

function resourceIcon(def) {
  return L.divIcon({
    className: '',
    html: `<div class="res-node">${SPRITES[def.type](def.color)}</div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
}

function syncResourceMarkers() {
  if (!map || map.getZoom() < MIN_ZOOM_RESOURCES) {
    resourceMarkers.forEach(m => map.removeLayer(m));
    resourceMarkers.clear();
    return;
  }

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

      if (!resourceMarkers.has(k)) {
        const c = hexCenter(q, r);
        const m = L.marker([c.lat, c.lng], {
          icon: resourceIcon(def),
          interactive: false,
          zIndexOffset: 100,
        }).addTo(map);
        resourceMarkers.set(k, m);
      }
    }
  }

  for (const [k, m] of resourceMarkers) {
    if (!wanted.has(k)) { map.removeLayer(m); resourceMarkers.delete(k); }
  }
}

async function refreshResources() {
  if (map.getZoom() < MIN_ZOOM_RESOURCES) {
    resourceMarkers.forEach(m => map.removeLayer(m));
    resourceMarkers.clear();
    drawGrid();
    return;
  }

  let data;
  try { data = await api('/api/resources'); } catch { return; }

  collectedSet.clear();
  for (const [k, ts] of Object.entries(data.collected)) collectedSet.set(k, ts);

  drawGrid();
  syncResourceMarkers();
}

// ── Click handler ─────────────────────────────────────────────────────────

async function onMapClick(e) {
  if (isMoving) return;
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
  const dist = hexDistance(player.q, player.r, q, r);
  if (dist > 1) await moveTo(q, r);

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
  const m = resourceMarkers.get(k);
  if (m) { map.removeLayer(m); resourceMarkers.delete(k); }
  collectedSet.set(k, Date.now());
  drawGrid();

  const c = hexCenter(q, r);
  showFloater(c.lat, c.lng, `+1 ${def.name}`, def.color);
  updateResourceBar(def.type);
  updateInventoryPanel();
  addLog(`${def.icon} Collected ${def.name}`, 'collect');
  flashTopLog(`${def.icon} +1 ${def.name}`);
}

// ── Movement ──────────────────────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

async function moveTo(targetQ, targetR) {
  if (isMoving) return;
  const path = hexLinePath(player.q, player.r, targetQ, targetR);
  if (!path.length) return;

  // Draw green dashed path line
  const pathLatLngs = [
    [player.lat, player.lng],
    ...path.map(({ q, r }) => { const c = hexCenter(q, r); return [c.lat, c.lng]; }),
  ];
  if (moveLine) map.removeLayer(moveLine);
  moveLine = L.polyline(pathLatLngs, {
    color: '#4caf50', weight: 2.5, opacity: 0.85, dashArray: '7 5',
  }).addTo(map);

  isMoving = true;
  suppressRedraw = true;
  document.getElementById('map').classList.add('moving');

  for (const step of path) {
    const startLat = player.lat, startLng = player.lng;
    const { lat: endLat, lng: endLng } = hexCenter(step.q, step.r);
    const startTime = performance.now();

    await new Promise(resolve => {
      function frame(now) {
        const t  = Math.min(1, (now - startTime) / MOVE_MS_PER_HEX);
        const et = easeInOut(t);
        const lat = startLat + (endLat - startLat) * et;
        const lng = startLng + (endLng - startLng) * et;
        playerMarker.setLatLng([lat, lng]);
        map.setView([lat, lng], map.getZoom(), { animate: false });
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });

    player.lat = endLat; player.lng = endLng; player.q = step.q; player.r = step.r;
    updateTopBar();
    api('/api/player/move', 'POST', {
      playerId: player.id, lat: endLat, lng: endLng, hexQ: step.q, hexR: step.r,
    }).catch(() => {});
  }

  isMoving = false;
  suppressRedraw = false;
  document.getElementById('map').classList.remove('moving');
  if (moveLine) { map.removeLayer(moveLine); moveLine = null; }
  drawGrid();
  syncResourceMarkers();
}

// ── Other players ─────────────────────────────────────────────────────────

async function syncPlayers() {
  if (!player) return;
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

function updateResourceBar(bumpType = null) {
  const inv = player.inventory || {};
  for (const res of RESOURCES) {
    const el = document.getElementById(`rb-${res.type}`);
    if (!el) continue;
    el.textContent = inv[res.type] || 0;
    if (res.type === bumpType) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }
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

function showFloater(lat, lng, text, color) {
  const pt  = map.latLngToContainerPoint([lat, lng]);
  const el  = document.createElement('div');
  el.className  = 'floater';
  el.textContent = text;
  el.style.left  = `${pt.x}px`;
  el.style.top   = `${pt.y}px`;
  el.style.color = color;
  document.getElementById('map').appendChild(el);
  setTimeout(() => el.remove(), 1100);
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
