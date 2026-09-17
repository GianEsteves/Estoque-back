import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import { createFirebaseSession } from "../../../service/firebase-admin.js";
import {
  getFirebaseAccount,
  signInFirebaseUser,
} from "../../../service/firebase-auth.js";
import {
  getUserByFirebaseUid,
  updateUser,
  updateEmailVerification,
} from "../repository/user.repository.js";
import { setSession } from "../../../service/session.js";
import { loginValidation } from "../validation/user.validation.js";

/**
 * Autentica no Firebase e retorna o ID token apenas para contas verificadas.
 */
export async function loginUserController(request, response, next) {
  try {
    const { email, password } = await loginValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const session = await signInFirebaseUser(email, password);
    const firebaseUser = await getFirebaseAccount(session.idToken);
    const user = await getUserByFirebaseUid(session.localId);

    if (!user) {
      throw httpError(
        "Perfil local nao encontrado",
        404,
        "USER_PROFILE_NOT_FOUND",
      );
    }

    if (!user.isActive) {
      throw httpError("Conta desativada", 403, "ACCOUNT_DISABLED");
    }

    if (!firebaseUser?.emailVerified) {
      throw httpError(
        "Valide seu e-mail antes de acessar",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }

    if (!user.emailVerified) {
      await updateEmailVerification(user.id, true);
    }

    const sessionCookie = await createFirebaseSession(session.idToken);
    await updateUser(user.id, { lastLoginAt: new Date() });
    await audit({
      actorId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
    });

    setSession(response, sessionCookie);
    response
      .set("Cache-Control", "no-store")
      .status(200)
      .json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          role: user.role,
        },
      });
  } catch (error) {
    next(error);
  }
}
