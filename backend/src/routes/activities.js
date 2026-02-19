const router = require('express').Router();
const db = require('../db');

const ACTIVITY_SELECT = `
  SELECT
    a.*,
    d.name  AS deal_name,
    c.name  AS contact_name
  FROM activities a
  LEFT JOIN deals    d ON d.id = a.deal_id
  LEFT JOIN contacts c ON c.id = a.contact_id
`;

// GET /activities
router.get('/', async (req, res) => {
  try {
    const { deal_id, contact_id, type } = req.query;
    let query = ACTIVITY_SELECT;
    const params = [];
    const conditions = [];

    if (deal_id) {
      params.push(deal_id);
      conditions.push(`a.deal_id = $${params.length}`);
    }
    if (contact_id) {
      params.push(contact_id);
      conditions.push(`a.contact_id = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`a.type = $${params.length}`);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY a.occurred_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /activities
router.post('/', async (req, res) => {
  try {
    const { deal_id, contact_id, type, description, occurred_at } = req.body;
    const validTypes = ['call', 'email', 'whatsapp', 'meeting', 'note', 'task', 'other'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const { rows } = await db.query(
      `INSERT INTO activities (deal_id, contact_id, type, description, occurred_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [deal_id, contact_id, type, description, occurred_at || new Date()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /activities/:id/complete — toggle task completion
router.patch('/:id/complete', async (req, res) => {
  try {
    const { completed } = req.body;
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }
    const { rows } = await db.query(
      `UPDATE activities SET completed=$1 WHERE id=$2 AND type='task' RETURNING *`,
      [completed, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
