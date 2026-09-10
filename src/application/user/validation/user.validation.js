import * as yup from "yup";

const roles = ["ADMIN", "VENDEDOR", "ESTOQUISTA"];

const phone = yup
  .string()
  .trim()
  .matches(/^\+?[0-9 ()-]{8,20}$/, "Telefone inválido");

// Confirma que a foto de perfil possui uma URL HTTPS válida.
function isHttpsUrl(value) {
  if (!value) return true;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const profilePhoto = yup
  .string()
  .trim()
  .test("https-url", "Foto de perfil deve ser uma URL HTTPS válida", isHttpsUrl)
  .nullable();

const password = yup
  .string()
  .min(12, "A senha deve possuir no mínimo 12 caracteres")
  .max(64)
  .matches(/[a-z]/, "A senha deve possuir letra minúscula")
  .matches(/[A-Z]/, "A senha deve possuir letra maiúscula")
  .matches(/[0-9]/, "A senha deve possuir número")
  .matches(/[^A-Za-z0-9]/, "A senha deve possuir símbolo");

export const createUserValidation = yup.object({
  name: yup.string().trim().min(2).max(100).required("Nome é obrigatório"),
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("E-mail inválido")
    .required("E-mail é obrigatório"),
  password: password.required("Senha é obrigatória"),
  phone: phone.required("Telefone é obrigatório"),
  profilePhoto: profilePhoto.optional(),
  role: yup.mixed().oneOf(roles).default("ESTOQUISTA"),
  mfaRequired: yup.boolean().default(false),
});

export const updateUserValidation = yup.object({
  name: yup.string().trim().min(2).max(100),
  phone,
  profilePhoto,
  role: yup.mixed().oneOf(roles),
  isActive: yup.boolean(),
  mfaRequired: yup.boolean(),
});

export const listUsersValidation = yup.object({
  search: yup.string().trim().max(100),
  role: yup.mixed().oneOf(roles),
  isActive: yup
    .boolean()
    .transform((value, originalValue) =>
      originalValue === "true" ? true : originalValue === "false" ? false : value,
    ),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
