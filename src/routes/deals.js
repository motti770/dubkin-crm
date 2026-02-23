const router = require('express').Router();
const db = require('../db');

const DEAL_SELECT = `
  SELECT
    d.*,
    c.name  AS contact_name,
    c.phone AS contact_phone,
    c.email AS contact_email,
    ps.name         AS stage_name,
    ps.display_name AS stage_display,
    ps.color        AS stage_color,
    ps.position     AS stage_position,
    pr.name  AS product_name,
    pr.price AS product_price
  FROM deals d
  LEFT JOIN contacts       c  ON c.id  = d.contact_id
  LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id
  LEFT JOIN products        pr ON pr.id = d.product_id
`;

// GET /deals
router.get('/', async (req, res) => {
  try {
    const { stage, contact_id } = req.query;
    let query = DEAL_SELECT;
    const params = [];
    const conditions = [];

    if (stage) {
      params.push(stage);
      conditions.push(`ps.name = $${params.length}`);
    }
    if (contact_id) {
      params.push(contact_id);
      conditions.push(`d.contact_id = $${params.length}`);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY ps.position, d.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /deals/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`${DEAL_SELECT} WHERE d.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /deals
router.post('/', async (req, res) => {
  try {
    const { contact_id, stage_id, name, value, product_id, notes, expected_close, plan_type, lead_source } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    // Default to first stage if not provided
    let stageId = stage_id;
    if (!stageId) {
      const { rows: stages } = await db.query(`SELECT id FROM pipeline_stages ORDER BY position LIMIT 1`);
      stageId = stages[0]?.id;
    }

    const { rows } = await db.query(
      `INSERT INTO deals (contact_id, stage_id, name, value, product_id, notes, expected_close, plan_type, lead_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [contact_id, stageId, name, value || 0, product_id, notes, expected_close, plan_type || 'managed', lead_source]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /deals/:id
router.put('/:id', async (req, res) => {
  try {
    const { contact_id, stage_id, name, value, product_id, notes, expected_close, plan_type, lead_source } = req.body;
    const { rows } = await db.query(
      `UPDATE deals SET
         contact_id=$1, stage_id=$2, name=$3, value=$4,
         product_id=$5, notes=$6, expected_close=$7,
         plan_type=$8, lead_source=$9
       WHERE id=$10 RETURNING *`,
      [contact_id, stage_id, name, value, product_id, notes, expected_close, plan_type, lead_source, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /deals/:id/stage — move deal to another stage
router.patch('/:id/stage', async (req, res) => {
  try {
    const { stage_name, stage_id } = req.body;

    let targetStageId = stage_id;
    if (!targetStageId && stage_name) {
      const { rows } = await db.query(`SELECT id FROM pipeline_stages WHERE name=$1`, [stage_name]);
      if (!rows.length) return res.status(400).json({ error: `Stage '${stage_name}' not found` });
      targetStageId = rows[0].id;
    }
    if (!targetStageId) return res.status(400).json({ error: 'stage_name or stage_id required' });

    // If moving to onboarding or beyond, record closed_at (deal is won)
    const { rows: stageRows } = await db.query(`SELECT name FROM pipeline_stages WHERE id=$1`, [targetStageId]);
    const stageName = stageRows[0]?.name;
    const closedAt  = ['onboarding', 'active', 'renewal', 'archive'].includes(stageName) ? 'NOW()' : 'NULL';

    const { rows } = await db.query(
      `UPDATE deals SET stage_id=$1, closed_at=${closedAt} WHERE id=$2 RETURNING *`,
      [targetStageId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /deals/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM deals WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Deal not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
