import { AppError } from "../../../service/app-error.js";
import {
  getFirebaseAccount,
  signInFirebaseUser,
} from "../../../service/firebase-auth.js";
import {
  getUserByFirebaseUid,
  updateEmailVerification,
} from "../repository/user.repository.js";
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
      throw new AppError(
        "Perfil local nao encontrado",
        404,
        "USER_PROFILE_NOT_FOUND",
      );
    }

    if (!firebaseUser?.emailVerified) {
      throw new AppError(
        "Valide seu e-mail antes de acessar",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }

    if (!user.emailVerified) {
      await updateEmailVerification(user.id, true);
    }

    response.set("Cache-Control", "no-store").status(200).json({
      token: session.idToken,
      expiresIn: Number(session.expiresIn),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
}
