import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import {
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../repository/category.repository.js";
import {
  createCategoryValidation,
  listCategoriesValidation,
  updateCategoryValidation,
} from "../validation/category.validation.js";

export async function listCategoriesController(request, response, next) {
  try {
    const filters = await listCategoriesValidation.validate(request.query, {
      stripUnknown: true,
    });
    const { categories, total } = await listCategories(filters);
    response.json({
      categories,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function getCategoryController(request, response, next) {
  try {
    const category = await getCategoryById(request.params.id);
    if (!category)
      throw httpError("Categoria não encontrada", 404, "CATEGORY_NOT_FOUND");
    response.json({ category });
  } catch (error) {
    next(error);
  }
}
export async function createCategoryController(request, response, next) {
  try {
    const data = await createCategoryValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const category = await createCategory(data);
    await audit({
      actorId: request.auth.user.id,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(201).json({ category });
  } catch (error) {
    next(error);
  }
}
export async function updateCategoryController(request, response, next) {
  try {
    const data = await updateCategoryValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (!Object.keys(data).length)
      throw httpError("Nenhuma alteração informada", 400, "EMPTY_UPDATE");
    const category = await getCategoryById(request.params.id);
    if (!category)
      throw httpError("Categoria não encontrada", 404, "CATEGORY_NOT_FOUND");
    if (data.isActive === false && category._count.products)
      throw httpError(
        "Não é possível inativar categoria com produtos vinculados",
        409,
        "CATEGORY_IN_USE",
      );
    const updated = await updateCategory(category.id, data);
    await audit({
      actorId: request.auth.user.id,
      action:
        data.isActive === false ? "CATEGORY_DEACTIVATED" : "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: updated.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.json({ category: updated });
  } catch (error) {
    next(error);
  }
}
