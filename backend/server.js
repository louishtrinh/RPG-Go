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

const HEX_SIZE   = 0.0007;
const SQRT3      = Math.sqrt(3);
const RESPAWN_MS = 5 * 60_000;

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

function getResourceType(gridX, gridY) {
  const rng = seededRandom(hash32(gridX, gridY));
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

// ── Routes ────────────────────────────────────────────────────────────────

app.post('/api/player/join', async (req, res) => {
  const { name, lat, lng } = req.body;
  if (!name || lat == null || lng == null)
    return res.status(400).json({ error: 'missing fields' });

  const { q, r } = latLngToHex(lat, lng);
  const now = Date.now();

  const { data: existing } = await db
    .from('players')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    const { data: player, error } = await db
      .from('players')
      .update({ lat, lng, grid_x: q, grid_y: r, last_seen: now })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ id: player.id, name: player.name, lat, lng, hexQ: player.grid_x, hexR: player.grid_y, inventory: player.inventory || {} });
  }

  const id = uuidv4();
  const { data: player, error } = await db
    .from('players')
    .insert({ id, name, lat, lng, grid_x: q, grid_y: r, last_seen: now, inventory: {} })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: player.id, name: player.name, lat, lng, hexQ: player.grid_x, hexR: player.grid_y, inventory: player.inventory || {} });
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
    .from('collected')
    .select('key, collected_at')
    .gt('collected_at', cutoff);
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
      .from('collected')
      .select('collected_at')
      .eq('key', key)
      .gt('collected_at', cutoff)
      .maybeSingle();

    if (existing) {
      const respawnsIn = Math.ceil((RESPAWN_MS - (now - existing.collected_at)) / 1000);
      return res.status(409).json({ error: 'already collected', respawnsIn });
    }

    const { data: player, error: pErr } = await db
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    if (pErr || !player) return res.status(404).json({ error: 'player not found' });

    const inventory = { ...(player.inventory || {}) };
    inventory[resourceType] = (inventory[resourceType] || 0) + 1;

    const [collectResult, invResult] = await Promise.all([
      db.from('collected').upsert({ key, collected_by: playerId, collected_at: now, resource_type: resourceType }),
      db.from('players').update({ inventory }).eq('id', playerId),
    ]);
    if (collectResult.error) throw new Error(collectResult.error.message);
    if (invResult.error) throw new Error(invResult.error.message);

    res.json({ ok: true, inventory, resourceType });
  } catch (err) {
    console.error('collect error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/players/nearby', async (req, res) => {
  const { lat, lng, playerId } = req.query;
  const cutoff = Date.now() - 120_000;

  const { data, error } = await db
    .from('players')
    .select('id, name, lat, lng')
    .neq('id', playerId)
    .gt('last_seen', cutoff)
    .gte('lat', parseFloat(lat) - 0.008)
    .lte('lat', parseFloat(lat) + 0.008)
    .gte('lng', parseFloat(lng) - 0.008)
    .lte('lng', parseFloat(lng) + 0.008);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ players: data });
});

app.listen(PORT, () =>
  console.log(`RPG-Go running → http://localhost:${PORT}`)
);
