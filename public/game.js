// ── Constants ─────────────────────────────────────────────────────────────

const HEX_SIZE           = 0.0007;
const SQRT3              = Math.sqrt(3);
const MIN_ZOOM_RESOURCES = 15;
const SYNC_MS            = 5000;
const MOVE_MS_PER_HEX    = 600; // ms to cross one hex

const RESOURCES = [
  { type: 'wood',  icon: '🌲', name: 'Wood',  color: '#388e3c', fill: 'rgba(56,142,60,0.25)',   w: 0.35 },
  { type: 'stone', icon: '🪨', name: 'Stone', color: '#757575', fill: 'rgba(117,117,117,0.25)', w: 0.25 },
  { type: 'iron',  icon: '⚙️', name: 'Iron',  color: '#8d6e63', fill: 'rgba(141,110,99,0.25)',  w: 0.18 },
  { type: 'food',  icon: '🌾', name: 'Grain', color: '#f9a825', fill: 'rgba(249,168,37,0.25)',  w: 0.12 },
  { type: 'gold',  icon: '💰', name: 'Gold',  color: '#fdd835', fill: 'rgba(253,216,53,0.25)',  w: 0.06 },
  { type: 'gem',   icon: '💎', name: 'Gems',  color: '#1e88e5', fill: 'rgba(30,136,229,0.25)', w: 0.04 },
];

// ── Resource SVG sprites (HoMM-inspired node designs) ────────────────────

const SPRITES = {
  wood: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="34" rx="14" ry="4" fill="rgba(0,0,0,0.4)"/>
    <!-- ground logs -->
    <rect x="4"  y="24" width="13" height="7" rx="3.5" fill="#4e2600"/>
    <rect x="23" y="24" width="13" height="7" rx="3.5" fill="#5c3000"/>
    <ellipse cx="4"  cy="27.5" rx="3.5" ry="3.5" fill="#6b3a00" stroke="#3a1a00" stroke-width="1"/>
    <ellipse cx="17" cy="27.5" rx="3.5" ry="3.5" fill="#7a4400" stroke="#3a1a00" stroke-width="1"/>
    <ellipse cx="23" cy="27.5" rx="3.5" ry="3.5" fill="#6b3a00" stroke="#3a1a00" stroke-width="1"/>
    <ellipse cx="36" cy="27.5" rx="3.5" ry="3.5" fill="#7a4400" stroke="#3a1a00" stroke-width="1"/>
    <!-- top log -->
    <rect x="11" y="17" width="18" height="7" rx="3.5" fill="#8b5e00"/>
    <ellipse cx="11" cy="20.5" rx="3.5" ry="3.5" fill="#a06b00" stroke="#5c3800" stroke-width="1"/>
    <ellipse cx="29" cy="20.5" rx="3.5" ry="3.5" fill="#a06b00" stroke="#5c3800" stroke-width="1"/>
    <!-- ring detail on top log -->
    <circle cx="20" cy="20.5" r="2" fill="none" stroke="#6b4400" stroke-width="0.8"/>
    <circle cx="20" cy="20.5" r="0.8" fill="#6b4400"/>
    <!-- axe -->
    <line x1="28" y1="18" x2="33" y2="8" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M31 10 Q36 6 36 12 Q33 13 31 10Z" fill="${color}"/>
  </svg>`,

  stone: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="35" rx="15" ry="4" fill="rgba(0,0,0,0.4)"/>
    <!-- back boulders -->
    <ellipse cx="10" cy="26" rx="8"  ry="7"  fill="#4a4a4a"/>
    <ellipse cx="30" cy="25" rx="7"  ry="6"  fill="#525252"/>
    <!-- front boulder -->
    <ellipse cx="20" cy="28" rx="10" ry="9"  fill="#616161"/>
    <!-- highlight chips -->
    <path d="M14 22 L18 19 L16 24Z" fill="#757575"/>
    <path d="M24 20 L27 23 L22 24Z" fill="#6e6e6e"/>
    <path d="M26 27 L30 25 L29 30Z" fill="#6a6a6a"/>
    <!-- glint -->
    <circle cx="16" cy="23" r="1.2" fill="rgba(255,255,255,0.25)"/>
    <circle cx="23" cy="21" r="0.8" fill="rgba(255,255,255,0.2)"/>
    <!-- pickaxe -->
    <line x1="28" y1="20" x2="35" y2="10" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M33 12 Q38 7 38 13 Q35 15 33 12Z" fill="${color}"/>
  </svg>`,

  iron: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="35" rx="14" ry="4" fill="rgba(0,0,0,0.4)"/>
    <!-- ore chunks -->
    <polygon points="8,30 6,22 14,18 18,28" fill="#5d4037"/>
    <polygon points="22,28 20,18 30,16 32,26" fill="#6d4c41"/>
    <polygon points="12,32 10,24 22,22 24,32" fill="#795548"/>
    <!-- ore veins (metallic) -->
    <polygon points="9,28 7,23 13,20 16,26" fill="${color}" opacity="0.7"/>
    <polygon points="23,26 22,20 28,18 30,24" fill="${color}" opacity="0.6"/>
    <polygon points="14,30 13,25 20,23 22,29" fill="${color}" opacity="0.8"/>
    <!-- specular -->
    <circle cx="10" cy="24" r="1" fill="rgba(255,255,255,0.3)"/>
    <circle cx="25" cy="20" r="0.8" fill="rgba(255,255,255,0.25)"/>
    <!-- pickaxe -->
    <line x1="28" y1="20" x2="35" y2="10" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M33 12 Q38 7 38 13 Q35 15 33 12Z" fill="#aaa"/>
  </svg>`,

  food: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="36" rx="13" ry="3.5" fill="rgba(0,0,0,0.35)"/>
    <!-- stalks -->
    <line x1="12" y1="34" x2="12" y2="14" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="17" y1="34" x2="17" y2="12" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="22" y1="34" x2="22" y2="13" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="27" y1="34" x2="27" y2="15" stroke="#8b6914" stroke-width="1.8" stroke-linecap="round"/>
    <!-- grain heads -->
    <ellipse cx="12" cy="11" rx="2.5" ry="5" fill="${color}" transform="rotate(-8,12,11)"/>
    <ellipse cx="17" cy="9"  rx="2.5" ry="5" fill="${color}" transform="rotate(5,17,9)"/>
    <ellipse cx="22" cy="10" rx="2.5" ry="5" fill="${color}" transform="rotate(-3,22,10)"/>
    <ellipse cx="27" cy="12" rx="2.5" ry="5" fill="${color}" transform="rotate(8,27,12)"/>
    <!-- leaf blades -->
    <path d="M12 20 Q7 17 9 14" stroke="#6b8e23" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M22 19 Q27 16 25 13" stroke="#6b8e23" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- binding -->
    <rect x="11" y="29" width="18" height="3" rx="1.5" fill="#8b6914" opacity="0.7"/>
  </svg>`,

  gold: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="35" rx="13" ry="3.5" fill="rgba(0,0,0,0.4)"/>
    <!-- coin stack back -->
    <ellipse cx="20" cy="22" rx="11" ry="4" fill="#a07800"/>
    <rect x="9" y="18" width="22" height="4" fill="#a07800"/>
    <ellipse cx="20" cy="18" rx="11" ry="4" fill="#b08800"/>
    <!-- coin stack mid -->
    <ellipse cx="20" cy="26" rx="11" ry="4" fill="#b09000"/>
    <rect x="9" y="22" width="22" height="4" fill="#b09000"/>
    <ellipse cx="20" cy="22" rx="11" ry="4" fill="#c09800"/>
    <!-- coin stack front -->
    <ellipse cx="20" cy="30" rx="11" ry="4" fill="#c8a000"/>
    <rect x="9" y="26" width="22" height="4" fill="#c8a000"/>
    <ellipse cx="20" cy="26" rx="11" ry="4" fill="${color}"/>
    <!-- coin face detail -->
    <ellipse cx="20" cy="26" rx="7" ry="2.5" fill="none" stroke="#c09000" stroke-width="0.8"/>
    <text x="20" y="28" text-anchor="middle" fill="#a07800" font-size="4" font-weight="bold">G</text>
    <!-- glint -->
    <ellipse cx="14" cy="24" rx="2" ry="0.8" fill="rgba(255,255,255,0.3)" transform="rotate(-20,14,24)"/>
  </svg>`,

  gem: (color) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="36" rx="12" ry="3" fill="rgba(0,0,0,0.4)"/>
    <!-- crystal cluster base -->
    <polygon points="16,34 12,20 20,16 24,34" fill="#0d47a1" opacity="0.8"/>
    <!-- left crystal -->
    <polygon points="10,32 7,18  16,14 17,30" fill="#1565c0"/>
    <polygon points="10,32 7,18  12,15" fill="#1976d2" opacity="0.6"/>
    <!-- right crystal -->
    <polygon points="30,32 33,17 24,13 23,30" fill="#1565c0"/>
    <polygon points="30,32 33,17 28,14" fill="#1976d2" opacity="0.6"/>
    <!-- center crystal (tallest) -->
    <polygon points="14,34 12,16 20,10 28,16 26,34" fill="${color}"/>
    <polygon points="14,34 12,16 20,10" fill="#42a5f5" opacity="0.5"/>
    <!-- facet lines -->
    <line x1="20" y1="10" x2="20" y2="34" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
    <line x1="20" y1="10" x2="14" y2="22" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
    <line x1="20" y1="10" x2="26" y2="22" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
    <!-- glint -->
    <circle cx="18" cy="14" r="1.5" fill="rgba(255,255,255,0.7)"/>
    <circle cx="22" cy="17" r="0.8" fill="rgba(255,255,255,0.5)"/>
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

function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

function gkey(q, r) { return `${q}_${r}`; }

// ── Game state ────────────────────────────────────────────────────────────

let map, gridCanvas;
let player        = null;
let playerMarker  = null;
let resourceLayers = new Map(); // key → { poly, marker }
let collectedSet   = new Map();
let otherMarkers   = new Map();
let isMoving       = false;

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
  updateResourceBar();
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

function resourceIcon(def) {
  const svg = SPRITES[def.type](def.color);
  return L.divIcon({
    className: '',
    html: `<div class="res-node">${svg}</div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
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
          color: def.color, weight: 1.2,
          fillColor: def.fill, fillOpacity: 1,
          interactive: false,
        }).addTo(map);

        const marker = L.marker([c.lat, c.lng], {
          icon: resourceIcon(def),
          interactive: false,
          zIndexOffset: 100,
        }).addTo(map);

        resourceLayers.set(k, { poly, marker });
      }
    }
  }

  for (const [k, layers] of resourceLayers) {
    if (!wanted.has(k)) {
      map.removeLayer(layers.poly);
      map.removeLayer(layers.marker);
      resourceLayers.delete(k);
    }
  }
}

function clearResourceLayers() {
  for (const { poly, marker } of resourceLayers.values()) {
    map.removeLayer(poly);
    map.removeLayer(marker);
  }
  resourceLayers.clear();
}

// ── Click handler — move or collect ──────────────────────────────────────

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
  const layers = resourceLayers.get(k);
  if (layers) {
    map.removeLayer(layers.poly);
    map.removeLayer(layers.marker);
    resourceLayers.delete(k);
  }
  collectedSet.set(k, Date.now());

  showPopup(def);
  updateResourceBar(def.type);
  updateInventoryPanel();
  addLog(`${def.icon} Collected ${def.name}`, 'collect');
  flashTopLog(`${def.icon} +1 ${def.name}`);
}

// ── Movement ──────────────────────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

async function moveTo(q, r) {
  if (isMoving) return;
  isMoving = true;
  document.getElementById('map').classList.add('moving');

  const startLat = player.lat, startLng = player.lng;
  const { lat: endLat, lng: endLng } = hexCenter(q, r);
  const dist     = Math.max(1, hexDistance(player.q, player.r, q, r));
  const duration = dist * MOVE_MS_PER_HEX;

  const startTime = performance.now();

  await new Promise(resolve => {
    function frame(now) {
      const t  = Math.min(1, (now - startTime) / duration);
      const et = easeInOut(t);
      const lat = startLat + (endLat - startLat) * et;
      const lng = startLng + (endLng - startLng) * et;
      playerMarker.setLatLng([lat, lng]);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });

  player.lat = endLat; player.lng = endLng; player.q = q; player.r = r;
  isMoving = false;
  document.getElementById('map').classList.remove('moving');
  updateTopBar();

  api('/api/player/move', 'POST', { playerId: player.id, lat: endLat, lng: endLng, hexQ: q, hexR: r })
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

function updateResourceBar(bumpType = null) {
  const inv = player.inventory || {};
  for (const res of RESOURCES) {
    const el = document.getElementById(`rb-${res.type}`);
    if (!el) continue;
    el.textContent = inv[res.type] || 0;
    if (res.type === bumpType) {
      el.classList.remove('bump');
      void el.offsetWidth; // reflow to restart animation
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
