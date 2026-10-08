import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // We use your SUPABASE_JWT_SECRET to verify the token sent from the frontend
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    
    // Attach the user info to the request for your controllers to use
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
