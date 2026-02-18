const router = require('express').Router();
const db = require('../db');

// GET /pipeline — full pipeline view grouped by stage
router.get('/', async (req, res) => {
  try {
    const { rows: stages } = await db.query(
      `SELECT * FROM pipeline_stages ORDER BY position`
    );

    const { rows: deals } = await db.query(`
      SELECT
        d.*,
        c.name  AS contact_name,
        c.phone AS contact_phone,
        c.email AS contact_email,
        pr.name  AS product_name,
        pr.price AS product_price
      FROM deals d
      LEFT JOIN contacts c  ON c.id  = d.contact_id
      LEFT JOIN products pr ON pr.id = d.product_id
      ORDER BY d.created_at DESC
    `);

    // Group deals by stage
    const pipeline = stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage_id === stage.id);
      const totalValue = stageDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
      return {
        stage,
        deals:       stageDeals,
        deal_count:  stageDeals.length,
        total_value: totalValue,
      };
    });

    const grandTotal = deals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);

    res.json({
      pipeline,
      summary: {
        total_deals: deals.length,
        total_value: grandTotal,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
