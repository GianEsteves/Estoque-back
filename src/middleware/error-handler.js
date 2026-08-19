/**
 * Converte erros da aplicacao, validacao e banco em respostas HTTP padronizadas.
 */
export function errorHandler(error, _request, response, _next) {
  if (error.name === "ValidationError") {
    return response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Dados invalidos",
      errors: error.errors,
    });
  }

  if (error.code === "P2002") {
    const fields = Array.isArray(error.meta?.target)
      ? error.meta.target
      : [error.meta?.target];
    const uniqueErrors = {
      cnh: {
        code: "CNH_ALREADY_EXISTS",
        message: "CNH ja cadastrada",
      },
      plate: {
        code: "VEHICLE_PLATE_ALREADY_EXISTS",
        message: "Placa ja cadastrada",
      },
      userId: {
        code: "DRIVER_PROFILE_ALREADY_EXISTS",
        message: "Usuario ja possui perfil de motorista",
      },
    };
    const conflict = fields
      .flatMap((field) => String(field || "").split(","))
      .map((field) => field.replace(/[^a-zA-Z]/g, ""))
      .map((field) => uniqueErrors[field])
      .find(Boolean);

    return response.status(409).json({
      code: conflict?.code || "EMAIL_ALREADY_EXISTS",
      message: conflict?.message || "E-mail ja cadastrado",
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(error);
  }

  return response.status(statusCode).json({
    code: error.code || "INTERNAL_SERVER_ERROR",
    message: statusCode === 500 ? "Erro interno do servidor" : error.message,
  });
}
