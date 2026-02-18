const router = require('express').Router();
const db = require('../db');

// GET /contacts — list all (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search, source } = req.query;
    let query = `SELECT * FROM contacts`;
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR company ILIKE $${params.length})`);
    }
    if (source) {
      params.push(source);
      conditions.push(`source = $${params.length}`);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /contacts/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /contacts
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, company, source, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { rows } = await db.query(
      `INSERT INTO contacts (name, phone, email, company, source, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, phone, email, company, source, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /contacts/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, company, source, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE contacts SET
         name=$1, phone=$2, email=$3, company=$4, source=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [name, phone, email, company, source, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /contacts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM contacts WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
