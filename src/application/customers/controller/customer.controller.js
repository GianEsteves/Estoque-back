import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import {
  createCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from "../repository/customer.repository.js";
import {
  createCustomerValidation,
  listCustomersValidation,
  updateCustomerValidation,
} from "../validation/customer.validation.js";

// Lista clientes com filtros e paginação.
export async function listCustomersController(request, response, next) {
  try {
    const filters = await listCustomersValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    const { customers, total } = await listCustomers(filters);

    response.status(200).json({
      customers,
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

// Retorna o cliente solicitado.
export async function getCustomerController(request, response, next) {
  try {
    const customer = await getCustomerById(request.params.id);

    if (!customer) {
      throw httpError("Cliente não encontrado", 404, "CUSTOMER_NOT_FOUND");
    }

    response.status(200).json({ customer });
  } catch (error) {
    next(error);
  }
}

// Cadastra um novo cliente.
export async function createCustomerController(request, response, next) {
  try {
    const data = await createCustomerValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const customer = await createCustomer(data);

    await audit({
      actorId: request.auth.user.id,
      action: "CUSTOMER_CREATED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
}

// Atualiza ou inativa um cliente existente.
export async function updateCustomerController(request, response, next) {
  try {
    const data = await updateCustomerValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!Object.keys(data).length) {
      throw httpError("Nenhuma alteração informada", 400, "EMPTY_UPDATE");
    }

    if (!(await getCustomerById(request.params.id))) {
      throw httpError("Cliente não encontrado", 404, "CUSTOMER_NOT_FOUND");
    }

    const customer = await updateCustomer(request.params.id, data);
    await audit({
      actorId: request.auth.user.id,
      action: data.isActive === false ? "CUSTOMER_DEACTIVATED" : "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { changedFields: Object.keys(data) },
    });
    response.status(200).json({ customer });
  } catch (error) {
    next(error);
  }
}
