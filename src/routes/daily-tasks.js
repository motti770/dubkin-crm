const router = require('express').Router();
const db = require('../db');

// GET /daily-tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });

    const { rows } = await db.query(
      'SELECT * FROM daily_tasks WHERE date = $1 ORDER BY created_at ASC',
      [date]
    );
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /daily-tasks
router.post('/', async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title and date are required' });

    const { rows } = await db.query(
      'INSERT INTO daily_tasks (title, date) VALUES ($1,$2) RETURNING *',
      [title, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /daily-tasks/:id — toggle is_completed
router.patch('/:id', async (req, res) => {
  try {
    const { is_completed } = req.body;
    const completedAt = is_completed ? 'NOW()' : 'NULL';

    const { rows } = await db.query(
      `UPDATE daily_tasks SET is_completed = $1, completed_at = ${completedAt} WHERE id = $2 RETURNING *`,
      [is_completed, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
