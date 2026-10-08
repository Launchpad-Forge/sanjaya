/** Validate req[where] with a Zod schema and replace it with the parsed value. */
export const validate = (schema, where = 'body') => (req, res, next) => {
  const r = schema.safeParse(req[where]);
  if (!r.success) {
    return res.status(400).json({
      error: 'Invalid request',
      issues: r.error.issues.map((i) => `${i.path.join('.') || where}: ${i.message}`),
    });
  }
  req[where] = r.data;
  next();
};
