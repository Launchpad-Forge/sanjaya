// ponytail: in-memory fixed window per IP; use a shared store if the server is scaled out.
export function rateLimit({ limit, windowMs, message = 'Too many requests; try again later.' }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [k, h] of hits) if (now - h.start > windowMs) hits.delete(k);
    const h = hits.get(req.ip);
    if (!h || now - h.start > windowMs) hits.set(req.ip, { start: now, n: 1 });
    else if (++h.n > limit) return res.status(429).json({ error: message });
    next();
  };
}
