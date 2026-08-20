import assert from "node:assert/strict";
import test from "node:test";

import { startServer } from "../../app.js";
import { httpError } from "../service/app-error.js";
import {
  resetFirebaseAuthAdapter,
  setFirebaseAuthAdapter,
} from "../service/firebase-auth.js";
import {
  resetFirebaseAdminAdapter,
  setFirebaseAdminAdapter,
} from "../service/firebase-admin.js";
import { prisma } from "../service/prisma.js";
import { waitForServer } from "./helpers/server.js";

/**
 * Envia uma requisicao JSON para o backend iniciado durante o teste.
 */
// Envia uma requisição JSON ao servidor de teste.
async function request(port, path, body) {
  const response = await fetch(`http://localhost:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

/**
 * Cria uma implementacao Firebase previsivel para os testes de integracao.
 */
// Cria uma implementação local do Firebase REST.
function createFirebaseFake() {
  const users = new Map();
  const tokens = new Map();
  let sequence = 0;

  function createSession(user) {
    sequence += 1;
    const idToken = `id-token-${sequence}`;
    tokens.set(idToken, user);

    return {
      localId: user.localId,
      email: user.email,
      idToken,
      refreshToken: `refresh-token-${sequence}`,
      expiresIn: "3600",
    };
  }

  return {
    users,

    // Simula a criação de uma conta Firebase.
    signUp(email, password) {
      if (users.has(email)) {
        throw httpError(
          "E-mail ja cadastrado",
          409,
          "EMAIL_ALREADY_EXISTS",
        );
      }

      const user = {
        localId: `firebase-${sequence + 1}`,
        email,
        password,
        emailVerified: false,
      };
      users.set(email, user);
      return createSession(user);
    },

    // Simula o login de uma conta Firebase.
    signIn(email, password) {
      const user = users.get(email);

      if (!user || user.password !== password) {
        throw httpError(
          "Credenciais invalidas",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      return createSession(user);
    },

    // Simula a consulta de uma conta pelo token.
    getAccount(idToken) {
      return tokens.get(idToken);
    },

    // Simula a atualização de perfil da conta.
    updateProfile(idToken, displayName, photoUrl) {
      const user = tokens.get(idToken);
      user.displayName = displayName;
      user.photoUrl = photoUrl;
      return user;
    },

    // Simula o envio do e-mail de verificação.
    sendEmailVerification(idToken) {
      const user = tokens.get(idToken);
      user.verificationEmailCount =
        (user.verificationEmailCount || 0) + 1;
      return { email: user.email };
    },

    // Simula a exclusão de uma conta de teste.
    deleteAccount(idToken) {
      const user = tokens.get(idToken);

      if (user) {
        users.delete(user.email);
      }

      return {};
    },
  };
}

// Cria uma implementação local do Firebase Admin.
function createFirebaseAdminFake() {
  return {
    // Simula a criação de cookie de sessão.
    createSessionCookie(idToken) {
      return `session-${idToken}`;
    },
    // Impede uso inesperado da verificação de ID token.
    verifyIdToken() {
      throw new Error("Não usado neste teste");
    },
    // Impede uso inesperado da verificação de sessão.
    verifySessionCookie() {
      throw new Error("Não usado neste teste");
    },
    // Simula a revogação de tokens.
    revokeRefreshTokens() {
      return undefined;
    },
    // Simula a atualização de conta administrativa.
    updateUser() {
      return undefined;
    },
  };
}

test("fluxo Firebase de cadastro, verificacao e login", async () => {
  const firebase = createFirebaseFake();
  setFirebaseAuthAdapter(firebase);
  setFirebaseAdminAdapter(createFirebaseAdminFake());

  const server = startServer(0);
  await waitForServer(server);
  const { port } = server.address();
  const email = `firebase-${Date.now()}@example.com`;
  const password = "SenhaSegura@123";
  const registration = {
    name: "Usuario Firebase",
    email,
    password,
    phone: "+55 11 99999-9999",
    profilePhoto:
      "https://firebasestorage.googleapis.com/v0/b/na-estrada/o/profile.jpg",
  };

  try {
    const invalidEmail = await request(port, "/auth/register", {
      ...registration,
      email: "email-invalido",
    });
    assert.equal(invalidEmail.status, 400);

    const insecurePhoto = await request(port, "/auth/register", {
      ...registration,
      profilePhoto: "http://example.com/profile.jpg",
    });
    assert.equal(insecurePhoto.status, 400);

    const registered = await request(port, "/auth/register", registration);
    assert.equal(registered.status, 201);
    assert.equal(registered.body.emailVerified, false);
    assert.match(registered.body.firebaseUid, /^firebase-/);
    assert.equal(registered.body.token, undefined);
    assert.equal(registered.body.refreshToken, undefined);
    assert.equal(registered.body.emailDelivery.recipient, email);
    assert.equal(registered.body.emailDelivery.status, "accepted");

    const localUser = await prisma.user.findUnique({ where: { email } });
    assert.ok(localUser);
    assert.equal(localUser.firebaseUid, registered.body.firebaseUid);
    assert.equal(firebase.users.get(email).verificationEmailCount, 1);

    const duplicate = await request(port, "/auth/register", registration);
    assert.equal(duplicate.status, 409);

    const loginBeforeVerification = await request(port, "/auth/login", {
      email,
      password,
    });
    assert.equal(loginBeforeVerification.status, 403);
    assert.equal(
      loginBeforeVerification.body.code,
      "EMAIL_NOT_VERIFIED",
    );

    const resent = await request(port, "/auth/resend-code", {
      email,
      password,
    });
    assert.equal(resent.status, 200);
    assert.equal(firebase.users.get(email).verificationEmailCount, 2);

    const firebaseUser = firebase.users.get(email);
    firebaseUser.emailVerified = true;

    const verifiedSession = await firebase.signIn(email, password);
    const verified = await request(port, "/auth/verify-email", {
      idToken: verifiedSession.idToken,
    });
    assert.equal(verified.status, 200);

    const login = await request(port, "/auth/login", { email, password });
    assert.equal(login.status, 200);
    assert.equal(login.body.token, undefined);
    assert.equal(login.body.refreshToken, undefined);
    assert.equal(login.body.expiresIn, 3600);
    assert.equal(login.body.user.email, email);

    const activeUser = await prisma.user.findUnique({ where: { email } });
    assert.equal(activeUser.emailVerified, true);
    assert.ok(activeUser.emailVerifiedAt);
  } finally {
    resetFirebaseAuthAdapter();
    resetFirebaseAdminAdapter();
    await prisma.user.deleteMany({ where: { email } });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Firebase rejeita credenciais incorretas", async () => {
  const firebase = createFirebaseFake();
  setFirebaseAuthAdapter(firebase);
  setFirebaseAdminAdapter(createFirebaseAdminFake());

  const server = startServer(0);
  await waitForServer(server);
  const { port } = server.address();
  const email = `firebase-login-${Date.now()}@example.com`;
  const password = "SenhaSegura@123";

  try {
    const registered = await request(port, "/auth/register", {
      name: "Usuario Login",
      email,
      password,
      phone: "+55 11 98888-8888",
      profilePhoto:
        "https://firebasestorage.googleapis.com/v0/b/na-estrada/o/login.jpg",
    });
    assert.equal(registered.status, 201);

    const invalidLogin = await request(port, "/auth/login", {
      email,
      password: "SenhaIncorreta123",
    });
    assert.equal(invalidLogin.status, 401);
    assert.equal(invalidLogin.body.code, "INVALID_CREDENTIALS");
  } finally {
    resetFirebaseAuthAdapter();
    resetFirebaseAdminAdapter();
    await prisma.user.deleteMany({ where: { email } });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
