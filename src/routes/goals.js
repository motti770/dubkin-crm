const router = require('express').Router();
const db = require('../db');

// GET /goals — all goals (optional ?year=&type=)
router.get('/', async (req, res) => {
  try {
    const { year, type } = req.query;
    const params = [];
    const conditions = [];

    if (year) {
      params.push(year);
      conditions.push(`year = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    let query = 'SELECT * FROM goals';
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ' ORDER BY year DESC, month ASC NULLS FIRST';

    const { rows } = await db.query(query, params);
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /goals
router.post('/', async (req, res) => {
  try {
    const { type, title, target_amount, year, month } = req.body;
    if (!type || !title || !year) {
      return res.status(400).json({ error: 'type, title, year are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO goals (type, title, target_amount, year, month)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [type, title, target_amount || 0, year, month || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
