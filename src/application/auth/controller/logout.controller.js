import { audit } from "../../../service/audit.js";
import { revokeFirebaseSessions } from "../../../service/firebase-admin.js";
import { clearSession } from "../../../service/session.js";

// Revoga as sessões do usuário e encerra o acesso atual.
export async function logoutController(request, response, next) {
  try {
    await revokeFirebaseSessions(request.auth.user.firebaseUid);
    await audit({
      actorId: request.auth.user.id,
      action: "AUTH_LOGOUT_ALL",
      entityType: "User",
      entityId: request.auth.user.id,
    });
    clearSession(response);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
