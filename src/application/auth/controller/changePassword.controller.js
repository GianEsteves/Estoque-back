import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import {
  revokeFirebaseSessions,
  updateFirebasePassword,
} from "../../../service/firebase-admin.js";
import { signInFirebaseUser } from "../../../service/firebase-auth.js";
import { clearSession } from "../../../service/session.js";
import { changePasswordValidation } from "../validation/user.validation.js";

// Altera a senha após confirmar a senha atual.
export async function changePasswordController(request, response, next) {
  try {
    const { currentPassword, newPassword } =
      await changePasswordValidation.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });
    const { user } = request.auth;

    await signInFirebaseUser(user.email, currentPassword).catch(() => {
      throw httpError("Senha atual inválida", 401, "INVALID_CREDENTIALS");
    });
    await updateFirebasePassword(user.firebaseUid, newPassword);
    await revokeFirebaseSessions(user.firebaseUid);
    await audit({
      actorId: user.id,
      action: "AUTH_PASSWORD_CHANGED",
      entityType: "User",
      entityId: user.id,
    });
    clearSession(response);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
