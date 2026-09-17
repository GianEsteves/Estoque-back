import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireCsrf } from "../middleware/csrf.js";
import {
  loginRateLimit,
  registrationRateLimit,
} from "../middleware/rate-limit.js";
import { changePasswordController } from "../application/auth/controller/changePassword.controller.js";
import { loginUserController } from "../application/auth/controller/loginUser.controller.js";
import { logoutController } from "../application/auth/controller/logout.controller.js";
import { meController } from "../application/auth/controller/me.controller.js";
import { passwordResetController } from "../application/auth/controller/passwordReset.controller.js";
import { registerUserController } from "../application/auth/controller/registerUser.controller.js";
import { resendVerificationCodeController } from "../application/auth/controller/resendVerificationCode.controller.js";
import {
  createUserController,
  getUserController,
  listUsersController,
  updateUserController,
} from "../application/user/controller/user.controller.js";
import { verifyEmailController } from "../application/auth/controller/verifyEmail.controller.js";
import {
  getMyPermissionsController,
  listPermissionsController,
} from "../application/permissions/controller/permission.controller.js";
import {
  createSupplierController,
  getSupplierController,
  listSuppliersController,
  updateSupplierController,
} from "../application/suppliers/controller/supplier.controller.js";
import {
  createCustomerController,
  getCustomerController,
  listCustomersController,
  updateCustomerController,
} from "../application/customers/controller/customer.controller.js";
import {
  createProductController,
  getProductController,
  listProductsController,
  updateProductController,
} from "../application/products/controller/product.controller.js";
import {
  getMovementController,
  listMovementsController,
} from "../application/movements/controller/movement.controller.js";
import {
  createCategoryController,
  getCategoryController,
  listCategoriesController,
  updateCategoryController,
} from "../application/categories/controller/category.controller.js";
import {
  createEntryController,
  createExitController,
  getBalanceController,
  listBalancesController,
} from "../application/inventory/controller/inventory.controller.js";
import {
  alertSummaryController,
  lowStockController,
} from "../application/alerts/controller/alert.controller.js";
import {
  getAuditLogController,
  listAuditLogsController,
} from "../application/audit/controller/audit.controller.js";
import {
  cancelSaleController,
  createSaleController,
  getSaleController,
  listSalesController,
  salesReportController,
} from "../application/sales/controller/sale.controller.js";
import {
  dashboardController,
  stockSummaryController,
  topProductsController,
} from "../application/dashboard/controller/dashboard.controller.js";

/**
 * Responde ao monitoramento de saude da aplicacao.
 */
// Confirma que a API está disponível.
function healthCheck(_request, response) {
  response.status(200).json({ status: "ok" });
}

export default function routes(app) {
  app.get("/health", healthCheck);
  app.post("/auth/register", registrationRateLimit, registerUserController);
  app.post("/auth/verify-email", loginRateLimit, verifyEmailController);
  app.post(
    "/auth/resend-code",
    loginRateLimit,
    resendVerificationCodeController,
  );
  app.post("/auth/login", loginRateLimit, loginUserController);
  app.post("/auth/password-reset", loginRateLimit, passwordResetController);
  app.get("/auth/me", authenticate, meController);
  app.post("/auth/logout", authenticate, requireCsrf, logoutController);
  app.post(
    "/auth/change-password",
    authenticate,
    requireCsrf,
    changePasswordController,
  );

  app.get("/permissions/me", authenticate, getMyPermissionsController);
  app.get(
    "/permissions",
    authenticate,
    authorize("ADMIN"),
    listPermissionsController,
  );

  app.get("/users", authenticate, authorize("ADMIN"), listUsersController);
  app.get("/users/:id", authenticate, authorize("ADMIN"), getUserController);
  app.post(
    "/users",
    authenticate,
    authorize("ADMIN"),
    requireCsrf,
    registrationRateLimit,
    createUserController,
  );
  app.patch(
    "/users/:id",
    authenticate,
    authorize("ADMIN"),
    requireCsrf,
    updateUserController,
  );

  app.get(
    "/suppliers",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    listSuppliersController,
  );
  app.get(
    "/suppliers/:id",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    getSupplierController,
  );
  app.post(
    "/suppliers",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    createSupplierController,
  );
  app.patch(
    "/suppliers/:id",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    updateSupplierController,
  );

  app.get(
    "/customers",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    listCustomersController,
  );
  app.get(
    "/customers/:id",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    getCustomerController,
  );
  app.post(
    "/customers",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    requireCsrf,
    createCustomerController,
  );
  app.patch(
    "/customers/:id",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    requireCsrf,
    updateCustomerController,
  );

  app.get("/products", authenticate, listProductsController);
  app.get("/products/:id", authenticate, getProductController);
  app.post(
    "/products",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    createProductController,
  );
  app.patch(
    "/products/:id",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    updateProductController,
  );

  app.get("/categories", authenticate, listCategoriesController);
  app.get("/categories/:id", authenticate, getCategoryController);
  app.post(
    "/categories",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    createCategoryController,
  );
  app.patch(
    "/categories/:id",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    updateCategoryController,
  );

  app.get("/inventory/balances", authenticate, listBalancesController);
  app.get("/inventory/balances/:productId", authenticate, getBalanceController);
  app.post(
    "/inventory/entries",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    createEntryController,
  );
  app.post(
    "/inventory/exits",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    requireCsrf,
    createExitController,
  );

  app.get(
    "/inventory/movements",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    listMovementsController,
  );
  app.get(
    "/inventory/movements/:id",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    getMovementController,
  );

  app.get(
    "/alerts/low-stock",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    lowStockController,
  );
  app.get(
    "/alerts/summary",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    alertSummaryController,
  );

  app.get(
    "/audit-logs",
    authenticate,
    authorize("ADMIN"),
    listAuditLogsController,
  );
  app.get(
    "/audit-logs/:id",
    authenticate,
    authorize("ADMIN"),
    getAuditLogController,
  );

  app.get(
    "/sales/reports",
    authenticate,
    authorize("ADMIN"),
    salesReportController,
  );
  app.get(
    "/sales",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    listSalesController,
  );
  app.get(
    "/sales/:id",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    getSaleController,
  );
  app.post(
    "/sales",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    requireCsrf,
    createSaleController,
  );
  app.post(
    "/sales/:id/cancel",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    requireCsrf,
    cancelSaleController,
  );

  app.get(
    "/dashboard",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    dashboardController,
  );
  app.get(
    "/dashboard/top-products",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    topProductsController,
  );
  app.get(
    "/dashboard/stock-summary",
    authenticate,
    authorize("ADMIN", "ESTOQUISTA"),
    stockSummaryController,
  );
}
