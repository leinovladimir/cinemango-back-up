export function authMiddleware(req, res, next) {
  const password = process.env.PASSWORD || '1234';
  const provided = req.headers['x-password'] || req.query.password;
  if (provided !== password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
