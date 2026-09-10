import {
  getPermissionsForRole,
  rolePermissions,
} from "../permission.policy.js";

// Retorna a matriz completa de permissões para administradores.
export function listPermissionsController(_request, response) {
  response.status(200).json({ roles: rolePermissions });
}

// Retorna o papel e as permissões da sessão autenticada.
export function getMyPermissionsController(request, response) {
  const { user } = request.auth;

  response.status(200).json({
    role: user.role,
    permissions: getPermissionsForRole(user.role),
  });
}
