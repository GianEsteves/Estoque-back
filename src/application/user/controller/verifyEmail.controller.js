import { AppError } from "../../../service/app-error.js";
import { getFirebaseAccount } from "../../../service/firebase-auth.js";
import {
  getUserByFirebaseUid,
  updateEmailVerification,
} from "../repository/user.repository.js";
import { verifyEmailValidation } from "../validation/user.validation.js";

/**
 * Sincroniza no PostgreSQL o e-mail ja validado pelo link do Firebase.
 */
export async function verifyEmailController(request, response, next) {
  try {
    const { idToken } = await verifyEmailValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const firebaseUser = await getFirebaseAccount(idToken);

    if (!firebaseUser) {
      throw new AppError(
        "Token Firebase invalido",
        401,
        "INVALID_FIREBASE_TOKEN",
      );
    }

    if (!firebaseUser.emailVerified) {
      throw new AppError(
        "E-mail ainda nao foi validado no Firebase",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }

    const user = await getUserByFirebaseUid(firebaseUser.localId);

    if (!user) {
      throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
    }

    await updateEmailVerification(user.id, true);
    response.status(200).json({ message: "E-mail validado com sucesso" });
  } catch (error) {
    next(error);
  }
}
