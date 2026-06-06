import { verifyJwt } from "../utils/jwt.js";

/**
 * Requires a valid Bearer JWT; attaches the user's DB id as req.userId.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyJwt(token);
    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
