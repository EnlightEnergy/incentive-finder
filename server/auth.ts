import type { Request, Response, NextFunction } from "express";

// Basic authentication for admin routes
// In production, this should be replaced with a more robust authentication system
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

function basicAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Decode the Base64 credentials
  const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.isAuthenticated = true;
    next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}

// Simple API key authentication for admin routes (alternative approach)
function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.ADMIN_API_KEY || 'enlighting-admin-key-2025';

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

// For production use, the ADMIN_USERNAME and ADMIN_PASSWORD should be set via environment variables
// Example: ADMIN_USERNAME=admin ADMIN_PASSWORD=secure_password_123

export { basicAuth, apiKeyAuth };