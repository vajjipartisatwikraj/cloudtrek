import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { db, USERS_TABLE } from '../db.js';
import { signToken } from '../auth.js';
import crypto from 'node:crypto';

/** Authentication endpoints for account creation and token issuance. */
const router = Router();

/**
 * Creates a user after normalizing the email, validating the password, and
 * hashing the password before it is persisted. The response contains identity
 * data and a JWT, never the stored password hash.
 */
router.post('/signup', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email.includes('@') || password.length < 6) {
    return res.status(400).json({ error: 'Valid email and 6+ char password required' });
  }

  const exists = await db.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { email },
  }));
  if (exists.Item) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: crypto.randomUUID(), email, password_hash: hash };
  await db.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));

  res.status(201).json({ token: signToken(user), user: { id: user.id, email: user.email } });
});

/**
 * Verifies credentials and returns the same token shape as signup, allowing
 * the frontend to use one login state regardless of how the session started.
 */
router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const { Item: user } = await db.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { email },
  }));
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
});

export default router;
