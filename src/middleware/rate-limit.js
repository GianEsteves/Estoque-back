import { rateLimit } from "express-rate-limit";

// Monta a resposta retornada ao exceder um limite.
function message(message) {
  return { code: "RATE_LIMITED", message };
}

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: message("Muitas requisições. Tente novamente mais tarde."),
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: message("Muitas tentativas. Aguarde antes de tentar novamente."),
});

export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: message("Limite de cadastros atingido. Tente novamente mais tarde."),
});
