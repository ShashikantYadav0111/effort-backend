import { z } from 'zod';

export const OID_RE = /^[a-f\d]{24}$/i;
export const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export const objectId = z.string().regex(OID_RE, 'Invalid id');
export const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

/** router.param handler: reject malformed :id before hitting the database. */
export function checkId(req, res, next, id) {
  if (OID_RE.test(id)) return next();
  res.status(400).json({ error: 'Invalid id' });
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
