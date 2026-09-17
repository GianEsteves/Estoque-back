import * as yup from "yup";

const item = yup.object({
  productId: yup.string().trim().required(),
  quantity: yup.number().integer().positive().required(),
  unitCost: yup.number().min(0).required(),
});
export const entryValidation = yup.object({
  supplierId: yup.string().trim().required("Fornecedor é obrigatório"),
  receivedAt: yup.date().max(new Date()),
  notes: yup.string().trim().max(2000).nullable(),
  items: yup.array().of(item).min(1).required(),
});
export const exitValidation = yup.object({
  productId: yup.string().trim().required(),
  quantity: yup.number().integer().positive().required(),
  reason: yup.string().trim().min(3).max(500).required("Motivo é obrigatório"),
  type: yup.mixed().oneOf(["EXIT", "ADJUSTMENT"]).default("EXIT"),
});
export const balanceValidation = yup.object({
  search: yup.string().trim().max(150),
  categoryId: yup.string().trim(),
  isLowStock: yup
    .boolean()
    .transform((value, original) =>
      original === "true" ? true : original === "false" ? false : value,
    ),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
