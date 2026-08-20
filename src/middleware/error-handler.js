/**
 * Converte erros da aplicacao, validacao e banco em respostas HTTP padronizadas.
 */
// Converte falhas internas em respostas HTTP seguras.
export function errorHandler(error, _request, response, _next) {
  if (error.name === "ValidationError") {
    return response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Dados invalidos",
      errors: error.errors,
    });
  }

  if (error.code === "P2002") {
    return response.status(409).json({
      code: "RESOURCE_ALREADY_EXISTS",
      message: "Registro ja cadastrado",
    });
  }

  if (error.code === "ECONNREFUSED") {
    return response.status(503).json({
      code: "DATABASE_UNAVAILABLE",
      message: "Serviço temporariamente indisponível",
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
