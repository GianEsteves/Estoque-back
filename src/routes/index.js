import { loginUserController } from "../application/user/controller/loginUser.controller.js";
import { registerUserController } from "../application/user/controller/registerUser.controller.js";
import { resendVerificationCodeController } from "../application/user/controller/resendVerificationCode.controller.js";
import { verifyEmailController } from "../application/user/controller/verifyEmail.controller.js";
import { firebaseAuthenticate } from "../middleware/firebase-authenticate.js";

/**
 * Responde ao monitoramento de saude da aplicacao.
 */
function healthCheck(_request, response) {
  response.status(200).json({ status: "ok" });
}

/**
 * Registra as rotas HTTP disponiveis na instancia do Express.
 */
export default function routes(app) {
  app.get("/health", healthCheck);
  app.post("/auth/register", registerUserController);
  app.post("/auth/verify-email", verifyEmailController);
  app.post("/auth/resend-code", resendVerificationCodeController);
  app.post("/auth/resend-verification", resendVerificationCodeController);
  app.post("/auth/login", loginUserController);

}
