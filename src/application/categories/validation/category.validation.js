import * as yup from "yup";

const fields = {
  name: yup.string().trim().min(2).max(100),
  description: yup.string().trim().max(1000).nullable(),
  isActive: yup.boolean(),
};

export const createCategoryValidation = yup.object({
  ...fields,
  name: fields.name.required("Nome é obrigatório"),
});
export const updateCategoryValidation = yup.object(fields);
export const listCategoriesValidation = yup.object({
  search: yup.string().trim().max(100),
  isActive: yup
    .boolean()
    .transform((value, original) =>
      original === "true" ? true : original === "false" ? false : value,
    ),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
