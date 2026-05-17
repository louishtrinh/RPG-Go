const express = require('express');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vfypgzvvdlukazupejzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_KEY) { console.error('SUPABASE_KEY env var is required'); process.exit(1); }

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const HEX_SIZE        = 0.0007;
const SQRT3           = Math.sqrt(3);
const RESPAWN_MS      = 5 * 60_000;
const CAMP_COOLDOWN_MS = 30_000;           // 30 s dev — change to 15*60_000 for prod
const CAMP_COST       = { wood: 10, stone: 5 };

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Shared hash/resource logic (mirrors client) ───────────────────────────

function hash32(x, y) {
  let h = Math.imul(x, 0x9e3779b9) ^ Math.imul(y, 0x517cc1b7);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

const RESOURCE_TYPES = ['wood', 'stone', 'iron', 'food', 'gold', 'gem'];
const WEIGHTS        = [0.35,   0.25,   0.18,  0.12,  0.06,  0.04];

function getResourceType(q, r) {
  const rng = seededRandom(hash32(q, r));
  if (rng() > 0.15) return null;
  const roll = rng();
  let cum = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    cum += WEIGHTS[i];
    if (roll < cum) return RESOURCE_TYPES[i];
  }
  return RESOURCE_TYPES[0];
}

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

function playerCamp(p) {
  // If player has never explicitly set camp, treat spawn as camp
  return p.camp_placed_at
    ? { campQ: p.camp_q, campR: p.camp_r, campPlacedAt: p.camp_placed_at }
    : { campQ: p.grid_x, campR: p.grid_y, campPlacedAt: 0 };
}

// ── Routes ────────────────────────────────────────────────────────────────

app.post('/api/player/join', async (req, res) => {
  const { name, lat, lng } = req.body;
  if (!name || lat == null || lng == null)
    return res.status(400).json({ error: 'missing fields' });

  const { q, r } = latLngToHex(lat, lng);
  const now = Date.now();

  const { data: existing } = await db
    .from('players').select('*').eq('name', name).maybeSingle();

  if (existing) {
    const { data: player, error } = await db
      .from('players')
      .update({ lat, lng, grid_x: q, grid_y: r, last_seen: now })
      .eq('id', existing.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    const camp = playerCamp(player);
    return res.json({
      id: player.id, name: player.name, lat, lng,
      hexQ: player.grid_x, hexR: player.grid_y,
      inventory: player.inventory || {},
      ...camp,
    });
  }

  const id = uuidv4();
  const { data: player, error } = await db
    .from('players')
    .insert({ id, name, lat, lng, grid_x: q, grid_y: r, last_seen: now,
              inventory: {}, camp_q: q, camp_r: r, camp_placed_at: 0 })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: player.id, name: player.name, lat, lng,
    hexQ: player.grid_x, hexR: player.grid_y,
    inventory: player.inventory || {},
    campQ: q, campR: r, campPlacedAt: 0,
  });
});

app.post('/api/player/move', async (req, res) => {
  const { playerId, lat, lng, hexQ, hexR } = req.body;
  const { error } = await db
    .from('players')
    .update({ lat, lng, grid_x: hexQ, grid_y: hexR, last_seen: Date.now() })
    .eq('id', playerId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/api/resources', async (req, res) => {
  const cutoff = Date.now() - RESPAWN_MS;
  const { data, error } = await db
    .from('collected').select('key, collected_at').gt('collected_at', cutoff);
  if (error) return res.status(500).json({ error: error.message });
  const collected = {};
  for (const row of data) collected[row.key] = row.collected_at;
  res.json({ collected, now: Date.now() });
});

app.post('/api/collect', async (req, res) => {
  try {
    const { playerId, hexQ, hexR } = req.body;
    const key = `${hexQ}_${hexR}`;
    const now = Date.now();

    const resourceType = getResourceType(Number(hexQ), Number(hexR));
    if (!resourceType) return res.status(400).json({ error: 'no resource at this cell' });

    const cutoff = now - RESPAWN_MS;
    const { data: existing } = await db
      .from('collected').select('collected_at').eq('key', key).gt('collected_at', cutoff).maybeSingle();
    if (existing) {
      const respawnsIn = Math.ceil((RESPAWN_MS - (now - existing.collected_at)) / 1000);
      return res.status(409).json({ error: 'already collected', respawnsIn });
    }

    const { data: player, error: pErr } = await db
      .from('players').select('*').eq('id', playerId).single();
    if (pErr || !player) return res.status(404).json({ error: 'player not found' });

    const inventory = { ...(player.inventory || {}) };
    inventory[resourceType] = (inventory[resourceType] || 0) + 1;

    const [cr, ir] = await Promise.all([
      db.from('collected').upsert({ key, collected_by: playerId, collected_at: now, resource_type: resourceType }),
      db.from('players').update({ inventory }).eq('id', playerId),
    ]);
    if (cr.error) throw new Error(cr.error.message);
    if (ir.error) throw new Error(ir.error.message);

    res.json({ ok: true, inventory, resourceType });
  } catch (err) {
    console.error('collect error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/make-camp', async (req, res) => {
  const { playerId } = req.body;
  const { data: player, error } = await db
    .from('players').select('*').eq('id', playerId).single();
  if (error || !player) return res.status(404).json({ error: 'player not found' });

  const now = Date.now();
  const elapsed = now - (player.camp_placed_at || 0);
  if (elapsed < CAMP_COOLDOWN_MS)
    return res.status(429).json({ error: 'cooldown', remainingMs: CAMP_COOLDOWN_MS - elapsed });

  const inv = { ...(player.inventory || {}) };
  for (const [res, amt] of Object.entries(CAMP_COST)) {
    if ((inv[res] || 0) < amt)
      return res.status(400).json({ error: `not enough ${res}`, need: amt, have: inv[res] || 0 });
  }
  for (const [res, amt] of Object.entries(CAMP_COST)) inv[res] -= amt;

  const { error: upErr } = await db.from('players').update({
    camp_q: player.grid_x, camp_r: player.grid_y,
    camp_placed_at: now, inventory: inv,
  }).eq('id', playerId);
  if (upErr) return res.status(500).json({ error: upErr.message });

  res.json({ ok: true, campQ: player.grid_x, campR: player.grid_y, campPlacedAt: now, inventory: inv });
});

app.get('/api/players/nearby', async (req, res) => {
  const { lat, lng, playerId } = req.query;
  const cutoff = Date.now() - 120_000;
  const { data, error } = await db
    .from('players').select('id, name, lat, lng')
    .neq('id', playerId).gt('last_seen', cutoff)
    .gte('lat', parseFloat(lat) - 0.008).lte('lat', parseFloat(lat) + 0.008)
    .gte('lng', parseFloat(lng) - 0.008).lte('lng', parseFloat(lng) + 0.008);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ players: data });
});

app.listen(PORT, () => console.log(`RPG-Go running → http://localhost:${PORT}`));
