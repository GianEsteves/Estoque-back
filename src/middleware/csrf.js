import { timingSafeEqual } from "node:crypto";

import { httpError } from "../service/app-error.js";

// Valida o token CSRF para sessões baseadas em cookie.
export function requireCsrf(request, _response, next) {
  if (!request.cookies.session || request.headers.authorization) {
    next();
    return;
  }

  const cookieToken = request.cookies.csrf_token;
  const headerToken = request.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    next(httpError("Token CSRF inválido", 403, "INVALID_CSRF_TOKEN"));
    return;
  }

  const expected = Buffer.from(cookieToken);
  const received = Buffer.from(headerToken);
  const valid =
    expected.length === received.length && timingSafeEqual(expected, received);

  next(
    valid
      ? undefined
      : httpError("Token CSRF inválido", 403, "INVALID_CSRF_TOKEN"),
  );
}
