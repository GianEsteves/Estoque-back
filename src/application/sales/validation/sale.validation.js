import * as yup from "yup";

const saleItem = yup.object({
  productId: yup.string().trim().required(),
  quantity: yup.number().integer().positive().required(),
  discount: yup.number().min(0).default(0),
});
export const createSaleValidation = yup.object({
  customerId: yup.string().trim().nullable(),
  paymentMethod: yup.string().trim().min(2).max(50).required(),
  discount: yup.number().min(0).default(0),
  items: yup.array().of(saleItem).min(1).required(),
});
export const cancelSaleValidation = yup.object({
  reason: yup.string().trim().min(3).max(500).required("Motivo é obrigatório"),
});
function dateTransform(_value, original) {
  if (!original) return undefined;
  return new Date(original);
}
export const listSalesValidation = yup.object({
  customerId: yup.string().trim(),
  userId: yup.string().trim(),
  status: yup.mixed().oneOf(["COMPLETED", "CANCELLED"]),
  from: yup.date().transform(dateTransform),
  to: yup.date().transform(dateTransform),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
