import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET_KEY || "change-this-in-production";
const ALGORITHM = "HS256";
const TOKEN_EXPIRE_DAYS = 7;

export function createJwt(userId) {
  const expire = Math.floor(Date.now() / 1000) + TOKEN_EXPIRE_DAYS * 24 * 60 * 60;
  return jwt.sign({ sub: userId, exp: expire }, SECRET_KEY, { algorithm: ALGORITHM });
}

export function verifyJwt(token) {
  return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
}
