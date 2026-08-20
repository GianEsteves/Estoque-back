import { sendFirebasePasswordResetEmail } from "../../../service/firebase-auth.js";
import { passwordResetValidation } from "../validation/user.validation.js";

// Solicita o envio das instruções de recuperação de senha.
export async function passwordResetController(request, response, next) {
  try {
    const { email } = await passwordResetValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    await sendFirebasePasswordResetEmail(email).catch(() => {});
    response.status(200).json({
      message: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.",
    });
  } catch (error) {
    next(error);
  }
}
