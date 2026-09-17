import * as yup from "yup";

// Normaliza o SKU para comparação e armazenamento consistentes.
function normalizeSku(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

const sku = yup
  .string()
  .transform((_value, originalValue) => normalizeSku(originalValue))
  .matches(/^[A-Z0-9][A-Z0-9._-]{1,49}$/, "SKU inválido")
  .max(50);

const productFields = {
  name: yup.string().trim().min(2).max(150),
  sku,
  description: yup.string().trim().max(2000).nullable(),
  categoryId: yup.string().trim().required("Categoria é obrigatória"),
  costPrice: yup.number().min(0, "Preço de custo não pode ser negativo"),
  salePrice: yup.number().moreThan(0, "Preço de venda deve ser maior que zero"),
  minimumStock: yup
    .number()
    .integer()
    .min(0, "Estoque mínimo não pode ser negativo"),
  isActive: yup.boolean(),
};

export const createProductValidation = yup.object({
  ...productFields,
  name: productFields.name.required("Nome é obrigatório"),
  sku: sku.required("SKU é obrigatório"),
  costPrice: productFields.costPrice.required("Preço de custo é obrigatório"),
  salePrice: productFields.salePrice.required("Preço de venda é obrigatório"),
  minimumStock: productFields.minimumStock.required(
    "Estoque mínimo é obrigatório",
  ),
});

export const updateProductValidation = yup.object({
  ...productFields,
  categoryId: yup.string().trim(),
});

export const listProductsValidation = yup.object({
  search: yup.string().trim().max(150),
  categoryId: yup.string().trim(),
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
