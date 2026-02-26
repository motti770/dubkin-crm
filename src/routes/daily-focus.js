const router = require('express').Router();
const db = require('../db');

// GET /daily-focus?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });

    const { rows } = await db.query(
      'SELECT * FROM daily_focus WHERE date = $1',
      [date]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /daily-focus — upsert by date
router.put('/', async (req, res) => {
  try {
    const { date, focus_text } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const { rows } = await db.query(
      `INSERT INTO daily_focus (date, focus_text)
       VALUES ($1, $2)
       ON CONFLICT (date) DO UPDATE SET focus_text = $2
       RETURNING *`,
      [date, focus_text || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
