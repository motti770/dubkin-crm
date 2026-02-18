require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const contactsRouter   = require('./routes/contacts');
const dealsRouter      = require('./routes/deals');
const activitiesRouter = require('./routes/activities');
const pipelineRouter   = require('./routes/pipeline');
const followUpsRouter  = require('./routes/follow-ups');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dubkin-crm', timestamp: new Date() });
});

// Routes
app.use('/contacts',   contactsRouter);
app.use('/deals',      dealsRouter);
app.use('/activities', activitiesRouter);
app.use('/pipeline',    pipelineRouter);
app.use('/follow-ups', followUpsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Dubkin CRM API running on port ${PORT}`);
});

module.exports = app;
