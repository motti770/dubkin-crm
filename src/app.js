require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const { authenticate, adminOnly } = require('./middleware/auth');

const authRouter       = require('./routes/auth');
const contactsRouter   = require('./routes/contacts');
const dealsRouter      = require('./routes/deals');
const activitiesRouter = require('./routes/activities');
const pipelineRouter   = require('./routes/pipeline');
const followUpsRouter  = require('./routes/follow-ups');
const marketingRouter  = require('./routes/marketing');
const goalsRouter      = require('./routes/goals');
const dailyTasksRouter = require('./routes/daily-tasks');
const dailyFocusRouter = require('./routes/daily-focus');
const dashboardRouter  = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// ─── Public routes ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dubkin-crm', timestamp: new Date() });
});

app.use('/auth', authRouter);        // /auth/login  /auth/me  /auth/users …

// ─── Protected routes (JWT required) ─────────────────────────────────────────
app.use(authenticate);               // Everything below requires a valid token

// Admin-only
app.use('/contacts',    adminOnly, contactsRouter);
app.use('/deals',       adminOnly, dealsRouter);
app.use('/activities',  adminOnly, activitiesRouter);
app.use('/pipeline',    adminOnly, pipelineRouter);
app.use('/follow-ups',  adminOnly, followUpsRouter);
app.use('/marketing',   adminOnly, marketingRouter);
app.use('/goals',       adminOnly, goalsRouter);
app.use('/daily-tasks', adminOnly, dailyTasksRouter);
app.use('/daily-focus', adminOnly, dailyFocusRouter);
app.use('/dashboard',   adminOnly, dashboardRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Dobkin CRM API running on port ${PORT}`);
  console.log(`🔐 Auth required for all routes (except /health, /auth/login)`);
});

module.exports = app;
