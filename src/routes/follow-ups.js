const router = require('express').Router();
const db = require('../db');

const FU_SELECT = `
  SELECT
    f.*,
    d.name  AS deal_name,
    c.name  AS contact_name,
    c.phone AS contact_phone
  FROM follow_ups f
  LEFT JOIN deals    d ON d.id = f.deal_id
  LEFT JOIN contacts c ON c.id = f.contact_id
`;

// GET /follow-ups?status=pending&deal_id=&contact_id=
router.get('/', async (req, res) => {
  try {
    const { status, deal_id, contact_id } = req.query;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`f.status = $${params.length}`);
    }
    if (deal_id) {
      params.push(deal_id);
      conditions.push(`f.deal_id = $${params.length}`);
    }
    if (contact_id) {
      params.push(contact_id);
      conditions.push(`f.contact_id = $${params.length}`);
    }

    let query = FU_SELECT;
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY f.due_date ASC`;

    const { rows } = await db.query(query, params);
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /follow-ups
router.post('/', async (req, res) => {
  try {
    const { deal_id, contact_id, due_date, type, notes } = req.body;
    if (!due_date) return res.status(400).json({ error: 'due_date is required' });

    const { rows } = await db.query(
      `INSERT INTO follow_ups (deal_id, contact_id, due_date, type, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [deal_id, contact_id, due_date, type, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /follow-ups/:id/done
router.patch('/:id/done', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE follow_ups SET status='done' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /follow-ups/:id/snooze — bonus: דחיית תאריך
router.patch('/:id/snooze', async (req, res) => {
  try {
    const { due_date } = req.body;
    if (!due_date) return res.status(400).json({ error: 'due_date is required for snooze' });

    const { rows } = await db.query(
      `UPDATE follow_ups SET status='snoozed', due_date=$1 WHERE id=$2 RETURNING *`,
      [due_date, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
