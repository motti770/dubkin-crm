const router = require('express').Router();
const db = require('../db');

// GET /marketing — all channels with stats
router.get('/', async (req, res) => {
  try {
    const { rows: channels } = await db.query(`
      SELECT
        mc.*,
        COUNT(ca.id) AS total_activities,
        COUNT(CASE WHEN ca.result = 'lead' THEN 1 END) AS leads_count,
        COUNT(CASE WHEN ca.occurred_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS activities_this_week,
        MAX(ca.occurred_at) AS last_activity
      FROM marketing_channels mc
      LEFT JOIN channel_activities ca ON ca.channel_id = mc.id
      GROUP BY mc.id
      ORDER BY mc.id
    `);

    // Contacts/deals that came from each channel (via lead_source on deal)
    const { rows: channelLeads } = await db.query(`
      SELECT
        d.lead_source,
        COUNT(d.id) AS deal_count,
        SUM(d.value) AS total_value
      FROM deals d
      WHERE d.lead_source IS NOT NULL
      GROUP BY d.lead_source
    `);

    res.json({ channels, channel_leads: channelLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing/:id — single channel with activities
router.get('/:id', async (req, res) => {
  try {
    const { rows: channel } = await db.query(
      `SELECT * FROM marketing_channels WHERE id = $1`,
      [req.params.id]
    );
    if (!channel.length) return res.status(404).json({ error: 'Channel not found' });

    const { rows: activities } = await db.query(`
      SELECT
        ca.*,
        c.name AS contact_name,
        c.phone AS contact_phone,
        d.name AS deal_name
      FROM channel_activities ca
      LEFT JOIN contacts c ON c.id = ca.contact_id
      LEFT JOIN deals    d ON d.id = ca.deal_id
      WHERE ca.channel_id = $1
      ORDER BY ca.occurred_at DESC
      LIMIT 50
    `, [req.params.id]);

    res.json({ channel: channel[0], activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing/:id/activities — log activity
router.post('/:id/activities', async (req, res) => {
  try {
    const { type, description, result, contact_id, deal_id, occurred_at } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    const { rows } = await db.query(
      `INSERT INTO channel_activities
         (channel_id, type, description, result, contact_id, deal_id, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, type || 'other', description, result || 'pending',
       contact_id, deal_id, occurred_at || new Date()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /marketing/activities/:id — update result
router.patch('/activities/:id', async (req, res) => {
  try {
    const { result, description } = req.body;
    const { rows } = await db.query(
      `UPDATE channel_activities SET result=$1, description=COALESCE($2, description)
       WHERE id=$3 RETURNING *`,
      [result, description, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Activity not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
