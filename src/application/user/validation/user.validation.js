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
    .min(8, "A senha deve possuir no minimo 8 caracteres")
    .max(64)
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
    .required("Foto de perfil é obrigatoria"),
});

export const verifyEmailValidation = yup.object({
  idToken: yup.string().trim().required("Firebase ID token e obrigatorio"),
});

export const loginValidation = yup.object({
  email,
  password: yup.string().required("Senha é obrigatoria"),
});

export const resendValidation = loginValidation;
