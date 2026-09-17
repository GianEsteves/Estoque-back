import { httpError } from "../../../service/app-error.js";
import {
  getMovementById,
  listMovements,
} from "../repository/movement.repository.js";
import { listMovementsValidation } from "../validation/movement.validation.js";

// Lista o histórico de movimentações com filtros e paginação.
export async function listMovementsController(request, response, next) {
  try {
    const filters = await listMovementsValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (filters.from && filters.to && filters.from > filters.to) {
      throw httpError(
        "Data inicial não pode ser posterior à data final",
        400,
        "INVALID_DATE_RANGE",
      );
    }

    const { movements, total } = await listMovements(filters);
    response.status(200).json({
      movements,
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

// Retorna o detalhe imutável de uma movimentação.
export async function getMovementController(request, response, next) {
  try {
    const movement = await getMovementById(request.params.id);

    if (!movement) {
      throw httpError("Movimentação não encontrada", 404, "MOVEMENT_NOT_FOUND");
    }

    response.status(200).json({ movement });
  } catch (error) {
    next(error);
  }
}
