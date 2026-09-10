import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import {
  createProduct,
  getActiveCategoryById,
  getProductById,
  listProducts,
  updateProduct,
} from "../repository/product.repository.js";
import {
  createProductValidation,
  listProductsValidation,
  updateProductValidation,
} from "../validation/product.validation.js";

// Lista produtos com filtros, categoria e paginação.
export async function listProductsController(request, response, next) {
  try {
    const filters = await listProductsValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    const { products, total } = await listProducts(filters);

    response.status(200).json({
      products,
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

// Consulta o produto solicitado e seu saldo atual.
export async function getProductController(request, response, next) {
  try {
    const product = await getProductById(request.params.id);

    if (!product) {
      throw httpError("Produto não encontrado", 404, "PRODUCT_NOT_FOUND");
    }

    response.status(200).json({
      product: {
        ...product,
        isLowStock: product.stockQuantity <= product.minimumStock,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Cadastra um produto vinculado a uma categoria ativa.
export async function createProductController(request, response, next) {
  try {
    const data = await createProductValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!(await getActiveCategoryById(data.categoryId))) {
      throw httpError("Categoria inválida ou inativa", 400, "INVALID_CATEGORY");
    }

    const product = await createProduct(data);
    await audit({
      actorId: request.auth.user.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(201).json({ product });
  } catch (error) {
    next(error);
  }
}

// Atualiza ou inativa um produto sem modificar seu saldo.
export async function updateProductController(request, response, next) {
  try {
    const data = await updateProductValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!Object.keys(data).length) {
      throw httpError("Nenhuma alteração informada", 400, "EMPTY_UPDATE");
    }

    if (!(await getProductById(request.params.id))) {
      throw httpError("Produto não encontrado", 404, "PRODUCT_NOT_FOUND");
    }

    if (data.categoryId && !(await getActiveCategoryById(data.categoryId))) {
      throw httpError("Categoria inválida ou inativa", 400, "INVALID_CATEGORY");
    }

    const product = await updateProduct(request.params.id, data);
    await audit({
      actorId: request.auth.user.id,
      action: data.isActive === false ? "PRODUCT_DEACTIVATED" : "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: product.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(200).json({ product });
  } catch (error) {
    next(error);
  }
}
