import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

/**
 * Express application entry point.
 * Middleware is registered before the route groups, and the final error
 * handler provides a consistent response for unexpected route failures.
 */
const app = express();

// Allow the Vite development origin or an explicitly configured frontend origin.
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

/** Lightweight readiness endpoint for local checks and container probes. */
app.get('/health', (_req, res) => res.json({ ok: true }));

// Route prefixes keep authentication and note resources independently organized.
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

/** Convert unhandled route errors into a non-sensitive API response. */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = process.env.PORT || 4000;

// Bind to all interfaces so the API is reachable from Docker or another host.
app.listen(port, "0.0.0.0", () => {
  console.log(`API running on port ${port}`);
});