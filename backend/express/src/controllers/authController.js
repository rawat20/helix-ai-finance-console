import { OAuth2Client } from "google-auth-library";
import prisma from "../services/prisma.js";
import { createJwt } from "../utils/jwt.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /auth/google
 * Verifies Google ID token, finds or creates user, returns JWT.
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: "Missing credential" });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, error: "Google OAuth not configured" });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, error: "Invalid Google token" });
    }

    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ success: false, error: "Invalid Google token payload" });
    }

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          name: payload.name ?? null,
          picture: payload.picture ?? null,
        },
      });
    }

    const token = createJwt(user.id);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    next(error);
  }
};
