const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const { authenticate, adminOnly, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const TOKEN_EXPIRES = '7d';

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
      [username.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last_login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ─── POST /auth/users  (admin: create user) ───────────────────────────────────
router.post('/users', authenticate, adminOnly, async (req, res) => {
  const { name, email, password, role = 'client', contact_id } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email, password required' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role, contact_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name, email.toLowerCase().trim(), hash, role, contact_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /auth/users  (admin: list users) ─────────────────────────────────────
router.get('/users', authenticate, adminOnly, async (_req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY id'
  );
  res.json(rows);
});

// ─── PATCH /auth/users/:id (admin: update role / active) ─────────────────────
router.patch('/users/:id', authenticate, adminOnly, async (req, res) => {
  const { role, is_active, name } = req.body;
  const sets = [];
  const vals = [];
  if (role       !== undefined) { sets.push(`role = $${vals.push(role)}`); }
  if (is_active  !== undefined) { sets.push(`is_active = $${vals.push(is_active)}`); }
  if (name       !== undefined) { sets.push(`name = $${vals.push(name)}`); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(req.params.id);
  const { rows } = await db.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}
     RETURNING id, name, email, role, is_active`,
    vals
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// ─── POST /auth/change-password ───────────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: 'old_password and new_password required' });

  const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
  if (!rows.length || !(await bcrypt.compare(old_password, rows[0].password)))
    return res.status(401).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(new_password, 12);
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ message: 'Password updated' });
});

module.exports = router;
