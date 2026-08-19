import {
  getFirebaseAccount,
  sendFirebaseVerificationEmail,
  signInFirebaseUser,
} from "../../../service/firebase-auth.js";
import { resendValidation } from "../validation/user.validation.js";

/**
 * Autentica a conta e solicita um novo e-mail de verificacao ao Firebase.
 */
export async function resendVerificationCodeController(
  request,
  response,
  next,
) {
  try {
    const { email, password } = await resendValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const session = await signInFirebaseUser(email, password);
    const firebaseUser = await getFirebaseAccount(session.idToken);

    if (firebaseUser?.emailVerified) {
      return response.status(200).json({ message: "E-mail ja validado" });
    }

    const delivery = await sendFirebaseVerificationEmail(session.idToken);

    response.status(200).json({
      message: "Novo link de verificacao enviado pelo Firebase",
      recipient: delivery.email,
      deliveryStatus: "accepted",
    });
  } catch (error) {
    next(error);
  }
}
