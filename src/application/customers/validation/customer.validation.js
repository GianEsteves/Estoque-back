import * as yup from "yup";

// Remove caracteres não numéricos do CPF ou CNPJ.
function normalizeDocument(value) {
  return String(value || "").replace(/\D/g, "");
}

// Confirma os dígitos verificadores de um CPF.
function isValidCpf(document) {
  if (document.length !== 11 || /^(\d)\1+$/.test(document)) return false;

  const digit = (length) => {
    const sum = document
      .slice(0, length)
      .split("")
      .reduce(
        (total, value, index) => total + Number(value) * (length + 1 - index),
        0,
      );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return digit(9) === Number(document[9]) && digit(10) === Number(document[10]);
}

// Confirma os dígitos verificadores de um CNPJ.
function isValidCnpj(document) {
  if (document.length !== 14 || /^(\d)\1+$/.test(document)) return false;

  const digit = (length) => {
    let factor = length === 12 ? 5 : 6;
    const sum = document
      .slice(0, length)
      .split("")
      .reduce((total, value) => {
        const next = total + Number(value) * factor;
        factor = factor === 2 ? 9 : factor - 1;
        return next;
      }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    digit(12) === Number(document[12]) && digit(13) === Number(document[13])
  );
}

// Confirma se o documento informado é CPF ou CNPJ válido.
function isValidFiscalDocument(value) {
  if (!value) return true;
  const document = normalizeDocument(value);
  return isValidCpf(document) || isValidCnpj(document);
}

const document = yup
  .string()
  .transform((_value, originalValue) =>
    originalValue ? normalizeDocument(originalValue) : null,
  )
  .test("fiscal-document", "CPF/CNPJ inválido", isValidFiscalDocument)
  .nullable();

const address = yup
  .object({
    street: yup.string().trim().max(150).required("Logradouro é obrigatório"),
    number: yup.string().trim().max(20).required("Número é obrigatório"),
    complement: yup.string().trim().max(100).nullable(),
    neighborhood: yup.string().trim().max(100).required("Bairro é obrigatório"),
    city: yup.string().trim().max(100).required("Cidade é obrigatória"),
    state: yup
      .string()
      .trim()
      .uppercase()
      .length(2, "UF deve ter 2 letras")
      .required("UF é obrigatória"),
    zipCode: yup
      .string()
      .transform((_value, originalValue) =>
        String(originalValue || "").replace(/\D/g, ""),
      )
      .matches(/^\d{8}$/, "CEP inválido")
      .required("CEP é obrigatório"),
  })
  .default(undefined);

const customerFields = {
  name: yup.string().trim().min(2).max(150),
  document,
  email: yup.string().trim().lowercase().email("E-mail inválido").nullable(),
  phone: yup
    .string()
    .trim()
    .matches(/^\+?[0-9 ()-]{8,20}$/, "Telefone inválido")
    .nullable(),
  address,
  isActive: yup.boolean(),
};

export const createCustomerValidation = yup.object({
  ...customerFields,
  name: customerFields.name.required("Nome é obrigatório"),
  address: address.required("Endereço é obrigatório"),
});

export const updateCustomerValidation = yup.object(customerFields);

export const listCustomersValidation = yup.object({
  search: yup.string().trim().max(150),
  isActive: yup
    .boolean()
    .transform((value, originalValue) =>
      originalValue === "true"
        ? true
        : originalValue === "false"
          ? false
          : value,
    ),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
