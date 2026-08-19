import { loginUserController } from "../application/auth/controller/loginUser.controller.js";
import { registerUserController } from "../application/auth/controller/registerUser.controller.js";
import { resendVerificationCodeController } from "../application/auth/controller/resendVerificationCode.controller.js";
import { verifyEmailController } from "../application/auth/controller/verifyEmail.controller.js";

/**
 * Responde ao monitoramento de saude da aplicacao.
 */
function healthCheck(_request, response) {
  response.status(200).json({ status: "ok" });
}

export default function routes(app) {
  app.get("/health", healthCheck);
  app.post("/auth/register", registerUserController);
  app.post("/auth/verify-email", verifyEmailController);
  app.post("/auth/resend-code", resendVerificationCodeController);
  app.post("/auth/login", loginUserController);
}
