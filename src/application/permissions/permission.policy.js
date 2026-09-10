const allPermissions = ["*"];

export const rolePermissions = Object.freeze({
  ADMIN: allPermissions,
  VENDEDOR: [
    "customers:read",
    "customers:write",
    "products:read",
    "sales:read",
    "sales:write",
    "dashboard:sales:read",
  ],
  ESTOQUISTA: [
    "categories:read",
    "categories:write",
    "products:read",
    "products:write",
    "suppliers:read",
    "suppliers:write",
    "inventory:read",
    "inventory:write",
    "movements:read",
    "alerts:read",
    "dashboard:stock:read",
  ],
});

// Retorna a lista de permissões atribuídas a um papel.
export function getPermissionsForRole(role) {
  return rolePermissions[role] || [];
}

// Confirma se o papel possui a permissão solicitada.
export function hasPermission(role, permission) {
  const permissions = getPermissionsForRole(role);
  return permissions.includes("*") || permissions.includes(permission);
}
