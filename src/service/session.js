import { randomBytes } from "node:crypto";

import { sessionDuration } from "./firebase-admin.js";

const isProduction = process.env.NODE_ENV === "production";

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: sessionDuration,
  path: "/",
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: "lax",
  maxAge: sessionDuration,
  path: "/",
};

// Define os cookies de sessão e proteção CSRF.
export function setSession(response, sessionCookie) {
  response.cookie("session", sessionCookie, sessionCookieOptions);
  response.cookie(
    "csrf_token",
    randomBytes(32).toString("hex"),
    csrfCookieOptions,
  );
}

// Remove os cookies de sessão do cliente.
export function clearSession(response) {
  response.clearCookie("session", sessionCookieOptions);
  response.clearCookie("csrf_token", csrfCookieOptions);
}
