/** Validates req.body (default) or req.query with a zod schema. Parsed query lands in req.parsedQuery. */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const error = result.error.issues
      .map((i) => `${i.path.join('.') || source}: ${i.message}`)
      .join('; ');
    return res.status(400).json({ error });
  }
  if (source === 'body') req.body = result.data;
  else req.parsedQuery = result.data;
  next();
};
