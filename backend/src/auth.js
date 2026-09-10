import jwt from 'jsonwebtoken';

/**
 * JWT signing key loaded once when the API starts.
 * Keeping this required at startup prevents the server from issuing tokens
 * with an accidental empty or development-only secret.
 */
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET is missing in .env');

/**
 * Creates the small set of user claims needed by authenticated routes.
 * The password hash is deliberately excluded from the token payload.
 *
 * @param {{ id: string, email: string }} user User identity to encode.
 * @returns {string} A JWT valid for seven days.
 */
export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });

/**
 * Express middleware that authenticates Bearer tokens.
 * A successful verification adds the decoded claims to `req.user`; notes
 * handlers then use that ID as the DynamoDB partition key for data isolation.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
