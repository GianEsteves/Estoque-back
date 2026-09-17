import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import {
  createFirebaseUser,
  deleteFirebaseUserByUid,
  revokeFirebaseSessions,
  updateFirebaseUser,
} from "../../../service/firebase-admin.js";
import {
  countActiveAdmins,
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
} from "../repository/user.repository.js";
import {
  createUserValidation,
  listUsersValidation,
  updateUserValidation,
} from "../validation/user.validation.js";

// Lista usuários e informa os metadados de paginação.
export async function listUsersController(request, response, next) {
  try {
    const filters = await listUsersValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    const { users, total } = await listUsers(filters);

    response.status(200).json({
      users,
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

// Consulta os dados de um usuário específico.
export async function getUserController(request, response, next) {
  try {
    const user = await getUserById(request.params.id);

    if (!user) {
      throw httpError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    }

    response.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

// Cria uma conta por ação de um administrador.
export async function createUserController(request, response, next) {
  let firebaseUser;

  try {
    const data = await createUserValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (await getUserByEmail(data.email)) {
      throw httpError("E-mail já cadastrado", 409, "EMAIL_ALREADY_EXISTS");
    }

    firebaseUser = await createFirebaseUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      photoURL: data.profilePhoto || undefined,
      disabled: false,
    });
    const user = await createUser({
      firebaseUid: firebaseUser.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      profilePhoto: data.profilePhoto || null,
      role: data.role,
      mfaRequired: data.mfaRequired,
    });

    await audit({
      actorId: request.auth.user.id,
      action: "USER_CREATED_BY_ADMIN",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role, mfaRequired: user.mfaRequired },
    });
    response.status(201).json({
      user,
      message:
        "Usuário criado. Solicite que ele valide o e-mail antes do primeiro acesso.",
    });
  } catch (error) {
    if (firebaseUser?.uid) {
      await deleteFirebaseUserByUid(firebaseUser.uid).catch(() => {});
    }
    next(error);
  }
}

// Atualiza perfil, papel, estado e requisito de MFA.
export async function updateUserController(request, response, next) {
  try {
    const data = await updateUserValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const target = await getUserById(request.params.id);

    if (!target) {
      throw httpError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    }

    if (!Object.keys(data).length) {
      throw httpError("Nenhuma alteração informada", 400, "EMPTY_UPDATE");
    }

    const losesAdminAccess =
      target.role === "ADMIN" &&
      target.isActive &&
      ((data.role && data.role !== "ADMIN") || data.isActive === false);

    if (losesAdminAccess && (await countActiveAdmins(target.id)) === 0) {
      throw httpError(
        "Deve existir pelo menos um administrador ativo",
        400,
        "LAST_ADMIN_FORBIDDEN",
      );
    }

    if (
      request.auth.user.id === target.id &&
      (data.isActive === false || (data.role && data.role !== "ADMIN"))
    ) {
      throw httpError(
        "Você não pode remover seu próprio acesso administrativo",
        400,
        "SELF_ACCESS_CHANGE_FORBIDDEN",
      );
    }

    const firebaseChanges = {
      ...(data.name ? { displayName: data.name } : {}),
      ...(data.profilePhoto !== undefined
        ? { photoURL: data.profilePhoto || null }
        : {}),
      ...(data.isActive !== undefined ? { disabled: !data.isActive } : {}),
    };

    if (Object.keys(firebaseChanges).length) {
      await updateFirebaseUser(target.firebaseUid, firebaseChanges);
    }

    const user = await updateUser(target.id, data);
    const mustRevokeSessions =
      data.isActive === false ||
      data.role !== undefined ||
      data.mfaRequired !== undefined;

    if (mustRevokeSessions) {
      await revokeFirebaseSessions(target.firebaseUid);
    }

    await audit({
      actorId: request.auth.user.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: user.id,
      metadata: data,
    });
    response.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
