export function httpError(message, statusCode = 400, code = "BAD_REQUEST") {
  return Object.assign(new Error(message), { statusCode, code });
}
