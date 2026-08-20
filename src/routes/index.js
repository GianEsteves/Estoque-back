import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireCsrf } from "../middleware/csrf.js";
import {
  loginRateLimit,
  registrationRateLimit,
} from "../middleware/rate-limit.js";
import { changePasswordController } from "../application/auth/controller/changePassword.controller.js";
import { loginUserController } from "../application/auth/controller/loginUser.controller.js";
import { logoutController } from "../application/auth/controller/logout.controller.js";
import { meController } from "../application/auth/controller/me.controller.js";
import { passwordResetController } from "../application/auth/controller/passwordReset.controller.js";
import { registerUserController } from "../application/auth/controller/registerUser.controller.js";
import { resendVerificationCodeController } from "../application/auth/controller/resendVerificationCode.controller.js";
import {
  listUsersController,
  updateUserController,
} from "../application/auth/controller/users.controller.js";
import { verifyEmailController } from "../application/auth/controller/verifyEmail.controller.js";

/**
 * Responde ao monitoramento de saude da aplicacao.
 */
// Confirma que a API está disponível.
function healthCheck(_request, response) {
  response.status(200).json({ status: "ok" });
}

export default function routes(app) {
  app.get("/health", healthCheck);
  app.post("/auth/register", registrationRateLimit, registerUserController);
  app.post("/auth/verify-email", loginRateLimit, verifyEmailController);
  app.post("/auth/resend-code", loginRateLimit, resendVerificationCodeController);
  app.post("/auth/login", loginRateLimit, loginUserController);
  app.post("/auth/password-reset", loginRateLimit, passwordResetController);
  app.get("/auth/me", authenticate, meController);
  app.post("/auth/logout", authenticate, requireCsrf, logoutController);
  app.post(
    "/auth/change-password",
    authenticate,
    requireCsrf,
    changePasswordController,
  );

  app.get("/users", authenticate, authorize("ADMIN"), listUsersController);
  app.patch(
    "/users/:id",
    authenticate,
    authorize("ADMIN"),
    requireCsrf,
    updateUserController,
  );
}
