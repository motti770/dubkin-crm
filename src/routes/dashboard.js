const router = require('express').Router();
const db = require('../db');

// GET /dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    // Active deals (not archived) + pipeline sum
    const dealsResult = await db.query(`
      SELECT
        COUNT(*)::int AS active_deals,
        COALESCE(SUM(d.value), 0)::float AS pipeline_total
      FROM deals d
      JOIN pipeline_stages ps ON ps.id = d.stage_id
      WHERE ps.name NOT IN ('archive')
    `);

    // Deals in 'closing' stage
    const closingResult = await db.query(`
      SELECT COUNT(*)::int AS closing_count
      FROM deals d
      JOIN pipeline_stages ps ON ps.id = d.stage_id
      WHERE ps.name = 'closing'
    `);

    // Overdue follow-ups (status=pending, due_date < now)
    const overdueResult = await db.query(`
      SELECT
        f.*,
        c.name  AS contact_name,
        c.phone AS contact_phone,
        c.whatsapp_id
      FROM follow_ups f
      LEFT JOIN contacts c ON c.id = f.contact_id
      WHERE f.status = 'pending' AND f.due_date < NOW()
      ORDER BY f.due_date ASC
    `);

    // Monthly goal progress: closed deals this month (stage = 'active')
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const monthlyClosedResult = await db.query(`
      SELECT COALESCE(SUM(d.value), 0)::float AS month_closed
      FROM deals d
      JOIN pipeline_stages ps ON ps.id = d.stage_id
      WHERE ps.name = 'active'
        AND d.closed_at >= $1 AND d.closed_at < $2
    `, [monthStart, monthEnd]);

    // Yearly closed
    const yearlyClosedResult = await db.query(`
      SELECT COALESCE(SUM(d.value), 0)::float AS year_closed
      FROM deals d
      JOIN pipeline_stages ps ON ps.id = d.stage_id
      WHERE ps.name = 'active'
        AND d.closed_at >= $1 AND d.closed_at < $2
    `, [`${year}-01-01`, `${year + 1}-01-01`]);

    // Annual goal
    const goalResult = await db.query(`
      SELECT * FROM goals WHERE type = 'annual' AND year = $1 LIMIT 1
    `, [year]);

    const annualGoal = goalResult.rows[0] || null;
    const yearClosed = yearlyClosedResult.rows[0].year_closed;
    const monthClosed = monthlyClosedResult.rows[0].month_closed;
    const targetAmount = annualGoal ? parseFloat(annualGoal.target_amount) : 0;
    const monthlyTarget = targetAmount > 0 ? targetAmount / 12 : 0;
    const yearPercent = targetAmount > 0 ? Math.round((yearClosed / targetAmount) * 100) : 0;

    res.json({
      active_deals: dealsResult.rows[0].active_deals,
      pipeline_total: dealsResult.rows[0].pipeline_total,
      closing_count: closingResult.rows[0].closing_count,
      overdue_follow_ups: overdueResult.rows,
      overdue_count: overdueResult.rows.length,
      annual_goal: annualGoal,
      year_closed: yearClosed,
      year_percent: yearPercent,
      month_closed: monthClosed,
      monthly_target: monthlyTarget,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
