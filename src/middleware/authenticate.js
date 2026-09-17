import { httpError } from "../service/app-error.js";
import {
  verifyFirebaseIdToken,
  verifyFirebaseSession,
} from "../service/firebase-admin.js";
import { prisma } from "../service/prisma.js";

// Extrai o token Bearer do cabeçalho de autorização.
function getBearerToken(authorization) {
  const [scheme, token] = authorization?.split(" ") || [];
  return scheme === "Bearer" && token ? token : undefined;
}

// Valida a sessão e carrega o usuário autenticado.
export async function authenticate(request, _response, next) {
  try {
    const token = getBearerToken(request.headers.authorization);
    const decodedToken = token
      ? await verifyFirebaseIdToken(token)
      : request.cookies.session
        ? await verifyFirebaseSession(request.cookies.session)
        : undefined;

    if (!decodedToken) {
      throw httpError("Autenticação obrigatória", 401, "AUTH_REQUIRED");
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user || !user.isActive) {
      throw httpError("Conta indisponível", 403, "ACCOUNT_DISABLED");
    }

    if (!user.emailVerified || !decodedToken.email_verified) {
      throw httpError("E-mail não verificado", 403, "EMAIL_NOT_VERIFIED");
    }

    if (user.mfaRequired && !decodedToken.firebase?.sign_in_second_factor) {
      throw httpError(
        "Autenticação multifator obrigatória",
        403,
        "MFA_REQUIRED",
      );
    }

    request.auth = { firebase: decodedToken, user };
    next();
  } catch (error) {
    if (error.name?.startsWith("Prisma")) {
      next(error);
      return;
    }

    next(
      error.statusCode
        ? error
        : httpError("Token inválido ou expirado", 401, "INVALID_TOKEN"),
    );
  }
}
