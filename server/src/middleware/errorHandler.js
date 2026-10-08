// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  const message = status === 404 ? 'Not found' : status >= 500 ? 'Internal error' : err.message;
  res.status(status).json({ error: message });
}

/** Express 4 does not catch rejected promises from async handlers. */
export const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
