import { httpError } from "../../../service/app-error.js";
import {
  createFirebaseUser,
  deleteFirebaseUser,
  sendFirebaseVerificationEmail,
  updateFirebaseProfile,
} from "../../../service/firebase-auth.js";
import {
  createUser,
  deleteUser,
  getUserByEmail,
} from "../repository/user.repository.js";
import { registerValidation } from "../validation/user.validation.js";

/**
 * Cria a conta Firebase, salva o perfil local e envia o link de verificacao.
 */
export async function registerUserController(request, response, next) {
  let firebaseSession;
  let user;

  try {
    const data = await registerValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const existingUser = await getUserByEmail(data.email);

    if (existingUser) {
      throw httpError("E-mail ja cadastrado", 409, "EMAIL_ALREADY_EXISTS");
    }

    firebaseSession = await createFirebaseUser(data.email, data.password);
    await updateFirebaseProfile(
      firebaseSession.idToken,
      data.name,
      data.profilePhoto,
    );

    user = await createUser({
      firebaseUid: firebaseSession.localId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      profilePhoto: data.profilePhoto,
    });

    await audit({
      actorId: user.id,
      action: "AUTH_REGISTERED",
      entityType: "User",
      entityId: user.id,
    });

    const delivery = await sendFirebaseVerificationEmail(
      firebaseSession.idToken,
    );

    response.set("Cache-Control", "no-store").status(201).json({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      emailVerified: false,
      emailDelivery: {
        recipient: delivery.email,
        status: "accepted",
      },
      message:
        "Cadastro realizado. Abra o link enviado pelo Firebase para validar o e-mail.",
    });
  } catch (error) {
    if (user?.id) {
      await deleteUser(user.id).catch(() => {});
    }

    if (firebaseSession?.idToken) {
      await deleteFirebaseUser(firebaseSession.idToken).catch(() => {});
    }

    next(error);
  }
}
import { audit } from "../../../service/audit.js";
