import { httpError } from "../service/app-error.js";

// Restringe a rota aos papéis informados.
export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.user.role)) {
      next(httpError("Permissão insuficiente", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}
