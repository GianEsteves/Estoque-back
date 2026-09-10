import { httpError } from "../service/app-error.js";
import { hasPermission } from "../application/permissions/permission.policy.js";

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

// Restringe a rota a uma permissão específica da matriz.
export function authorizePermission(permission) {
  return (request, _response, next) => {
    if (!request.auth || !hasPermission(request.auth.user.role, permission)) {
      next(httpError("Permissão insuficiente", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}
