import * as yup from "yup";

// Remove caracteres não numéricos do CPF ou CNPJ.
function normalizeDocument(value) {
  return String(value || "").replace(/\D/g, "");
}

// Confirma os dígitos verificadores de um CPF.
function isValidCpf(document) {
  if (document.length !== 11 || /^(\d)\1+$/.test(document)) return false;

  const calculateDigit = (length) => {
    const sum = document
      .slice(0, length)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(document[9]) && calculateDigit(10) === Number(document[10]);
}

// Confirma os dígitos verificadores de um CNPJ.
function isValidCnpj(document) {
  if (document.length !== 14 || /^(\d)\1+$/.test(document)) return false;

  const calculateDigit = (length) => {
    let factor = length === 12 ? 5 : 6;
    const sum = document.slice(0, length).split("").reduce((total, digit) => {
      const nextTotal = total + Number(digit) * factor;
      factor = factor === 2 ? 9 : factor - 1;
      return nextTotal;
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === Number(document[12]) && calculateDigit(13) === Number(document[13]);
}

// Confirma se o CPF ou CNPJ é válido.
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

const phone = yup
  .string()
  .trim()
  .matches(/^\+?[0-9 ()-]{8,20}$/, "Telefone inválido")
  .nullable();

const address = yup.object({
  street: yup.string().trim().max(150).required("Logradouro é obrigatório"),
  number: yup.string().trim().max(20).required("Número é obrigatório"),
  complement: yup.string().trim().max(100).nullable(),
  neighborhood: yup.string().trim().max(100).required("Bairro é obrigatório"),
  city: yup.string().trim().max(100).required("Cidade é obrigatória"),
  state: yup.string().trim().uppercase().length(2, "UF deve ter 2 letras").required("UF é obrigatória"),
  zipCode: yup
    .string()
    .transform((_value, originalValue) => String(originalValue || "").replace(/\D/g, ""))
    .matches(/^\d{8}$/, "CEP inválido")
    .required("CEP é obrigatório"),
}).default(undefined);

const supplierFields = {
  legalName: yup.string().trim().min(2).max(150),
  tradeName: yup.string().trim().min(2).max(150).nullable(),
  document,
  email: yup.string().trim().lowercase().email("E-mail inválido").nullable(),
  phone,
  address,
  isActive: yup.boolean(),
};

export const createSupplierValidation = yup.object({
  ...supplierFields,
  legalName: supplierFields.legalName.required("Razão social é obrigatória"),
  address: address.required("Endereço é obrigatório"),
});

export const updateSupplierValidation = yup.object(supplierFields);

export const listSuppliersValidation = yup.object({
  search: yup.string().trim().max(150),
  isActive: yup
    .boolean()
    .transform((value, originalValue) =>
      originalValue === "true" ? true : originalValue === "false" ? false : value,
    ),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
