import * as yup from "yup";

export const movementTypes = [
  "ENTRY",
  "EXIT",
  "SALE",
  "CANCELLATION",
  "ADJUSTMENT",
];
export const movementOrigins = [
  "MANUAL",
  "PURCHASE",
  "SALE",
  "CANCELLATION",
  "ADJUSTMENT",
];

// Converte um filtro de data para um objeto Date válido.
function parseDate(_value, originalValue) {
  if (!originalValue) return undefined;
  const date = new Date(originalValue);
  return Number.isNaN(date.getTime()) ? new Date("") : date;
}

export const listMovementsValidation = yup.object({
  productId: yup.string().trim(),
  userId: yup.string().trim(),
  type: yup.mixed().oneOf(movementTypes),
  origin: yup.mixed().oneOf(movementOrigins),
  from: yup
    .date()
    .transform(parseDate)
    .max(new Date(), "Data inicial inválida"),
  to: yup.date().transform(parseDate).max(new Date(), "Data final inválida"),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
