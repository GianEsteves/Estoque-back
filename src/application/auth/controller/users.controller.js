import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import { revokeFirebaseSessions } from "../../../service/firebase-admin.js";
import { listUsers, updateUser } from "../repository/user.repository.js";
import { updateUserValidation } from "../validation/user.validation.js";

// Lista usuários para o painel administrativo.
export async function listUsersController(_request, response, next) {
  try {
    response.status(200).json({ users: await listUsers() });
  } catch (error) {
    next(error);
  }
}

// Atualiza permissões e estado de uma conta.
export async function updateUserController(request, response, next) {
  try {
    const data = await updateUserValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const { user: actor } = request.auth;
    const userId = request.params.id;

    if (!Object.keys(data).length) {
      throw httpError("Nenhuma alteração informada", 400, "EMPTY_UPDATE");
    }

    if (
      actor.id === userId &&
      (data.isActive === false || (data.role && data.role !== "ADMIN"))
    ) {
      throw httpError(
        "Você não pode remover seu próprio acesso administrativo",
        400,
        "SELF_ACCESS_CHANGE_FORBIDDEN",
      );
    }

    const user = await updateUser(userId, data);

    if (data.isActive === false) {
      await revokeFirebaseSessions(user.firebaseUid);
    }

    await audit({
      actorId: actor.id,
      action: "USER_ACCESS_UPDATED",
      entityType: "User",
      entityId: user.id,
      metadata: data,
    });
    response.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
