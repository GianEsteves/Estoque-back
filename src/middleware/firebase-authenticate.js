import { AppError } from "../service/app-error.js";
import { getFirebaseAccount } from "../service/firebase-auth.js";

/**
 * Valida o Bearer token do Firebase e disponibiliza seus dados na requisicao.
 */
export async function firebaseAuthenticate(request, _response, next) {
  try {
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(" ") || [];

    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        "Token de autenticacao ausente",
        401,
        "AUTH_TOKEN_MISSING",
      );
    }

    const firebaseUser = await getFirebaseAccount(token);

    if (!firebaseUser) {
      throw new AppError(
        "Token de autenticacao invalido",
        401,
        "INVALID_FIREBASE_TOKEN",
      );
    }

    request.firebaseUser = firebaseUser;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(
      new AppError(
        "Token de autenticacao invalido",
        401,
        "INVALID_FIREBASE_TOKEN",
      ),
    );
  }
}
