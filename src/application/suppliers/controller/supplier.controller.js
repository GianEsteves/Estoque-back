import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import {
  createSupplier,
  getSupplierById,
  listSuppliers,
  updateSupplier,
} from "../repository/supplier.repository.js";
import {
  createSupplierValidation,
  listSuppliersValidation,
  updateSupplierValidation,
} from "../validation/supplier.validation.js";

// Lista fornecedores com filtros e paginação.
export async function listSuppliersController(request, response, next) {
  try {
    const filters = await listSuppliersValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    const { suppliers, total } = await listSuppliers(filters);

    response.status(200).json({
      suppliers,
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

// Retorna o fornecedor solicitado.
export async function getSupplierController(request, response, next) {
  try {
    const supplier = await getSupplierById(request.params.id);

    if (!supplier) {
      throw httpError("Fornecedor não encontrado", 404, "SUPPLIER_NOT_FOUND");
    }

    response.status(200).json({ supplier });
  } catch (error) {
    next(error);
  }
}

// Cadastra um novo fornecedor.
export async function createSupplierController(request, response, next) {
  try {
    const data = await createSupplierValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const supplier = await createSupplier(data);

    await audit({
      actorId: request.auth.user.id,
      action: "SUPPLIER_CREATED",
      entityType: "Supplier",
      entityId: supplier.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(201).json({ supplier });
  } catch (error) {
    next(error);
  }
}

// Atualiza ou inativa um fornecedor existente.
export async function updateSupplierController(request, response, next) {
  try {
    const data = await updateSupplierValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!Object.keys(data).length) {
      throw httpError("Nenhuma alteração informada", 400, "EMPTY_UPDATE");
    }

    if (!(await getSupplierById(request.params.id))) {
      throw httpError("Fornecedor não encontrado", 404, "SUPPLIER_NOT_FOUND");
    }

    const supplier = await updateSupplier(request.params.id, data);
    await audit({
      actorId: request.auth.user.id,
      action:
        data.isActive === false ? "SUPPLIER_DEACTIVATED" : "SUPPLIER_UPDATED",
      entityType: "Supplier",
      entityId: supplier.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(200).json({ supplier });
  } catch (error) {
    next(error);
  }
}
