import * as yup from "yup";

const email = yup
  .string()
  .trim()
  .lowercase()
  .email("E-mail invalido")
  .required("E-mail e obrigatorio");

/**
 * Valida se a foto de perfil aponta para uma URL HTTPS, como a do Firebase.
 */
// Confirma que a URL utiliza HTTPS.
function isHttpsUrl(value) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const registerValidation = yup.object({
  name: yup.string().trim().min(2).max(100).required("Nome é obrigatorio"),
  email,
  password: yup
    .string()
    .min(12, "A senha deve possuir no mínimo 12 caracteres")
    .max(64)
    .matches(/[a-z]/, "A senha deve possuir letra minúscula")
    .matches(/[A-Z]/, "A senha deve possuir letra maiúscula")
    .matches(/[0-9]/, "A senha deve possuir número")
    .matches(/[^A-Za-z0-9]/, "A senha deve possuir símbolo")
    .required("Senha e obrigatoria"),
  phone: yup
    .string()
    .trim()
    .matches(/^\+?[0-9 ()-]{8,20}$/, "Telefone invalido")
    .required("Telefone é obrigatorio"),
  profilePhoto: yup
    .string()
    .trim()
    .test(
      "https-url",
      "Foto de perfil deve ser uma URL HTTPS valida",
      isHttpsUrl,
    )
    .nullable()
    .optional(),
});

export const verifyEmailValidation = yup.object({
  idToken: yup.string().trim().required("Firebase ID token e obrigatorio"),
});

export const loginValidation = yup.object({
  email,
  password: yup.string().required("Senha é obrigatoria"),
});

export const resendValidation = loginValidation;

export const passwordResetValidation = yup.object({ email });

export const changePasswordValidation = yup.object({
  currentPassword: yup.string().required("Senha atual é obrigatória"),
  newPassword: registerValidation.fields.password,
});

export const updateUserValidation = yup.object({
  role: yup.mixed().oneOf(["ADMIN", "VENDEDOR", "ESTOQUISTA"]),
  isActive: yup.boolean(),
  mfaRequired: yup.boolean(),
});
