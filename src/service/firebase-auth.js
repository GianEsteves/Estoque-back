import { httpError } from "./app-error.js";

const FIREBASE_AUTH_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts";

let testAdapter;

/**
 * Retorna a chave publica usada pelas operacoes REST do Firebase Auth.
 */
function getFirebaseApiKey() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY deve ser configurado");
  }

  return apiKey;
}

/**
 * Traduz erros do Firebase para respostas conhecidas pela aplicacao.
 */
function mapFirebaseError(firebaseCode) {
  const normalizedCode = firebaseCode?.split(" : ")[0];
  const errors = {
    EMAIL_EXISTS: httpError(
      "E-mail ja cadastrado",
      409,
      "EMAIL_ALREADY_EXISTS",
    ),
    EMAIL_NOT_FOUND: httpError(
      "Credenciais invalidas",
      401,
      "INVALID_CREDENTIALS",
    ),
    INVALID_PASSWORD: httpError(
      "Credenciais invalidas",
      401,
      "INVALID_CREDENTIALS",
    ),
    INVALID_LOGIN_CREDENTIALS: httpError(
      "Credenciais invalidas",
      401,
      "INVALID_CREDENTIALS",
    ),
    USER_DISABLED: httpError("Conta desativada", 403, "USER_DISABLED"),
    TOO_MANY_ATTEMPTS_TRY_LATER: httpError(
      "O Firebase bloqueou temporariamente novos envios. Aguarde antes de tentar novamente.",
      429,
      "TOO_MANY_ATTEMPTS",
    ),
    RESET_PASSWORD_EXCEED_LIMIT: httpError(
      "O limite temporario de e-mails do Firebase foi atingido.",
      429,
      "EMAIL_SEND_LIMIT_EXCEEDED",
    ),
    QUOTA_EXCEEDED: httpError(
      "A cota de e-mails do Firebase foi atingida.",
      429,
      "EMAIL_SEND_LIMIT_EXCEEDED",
    ),
    WEAK_PASSWORD: httpError(
      "Senha nao atende aos requisitos do Firebase",
      400,
      "WEAK_PASSWORD",
    ),
  };

  return (
    errors[normalizedCode] ||
    httpError(
      "Falha ao autenticar com Firebase",
      502,
      "FIREBASE_AUTH_ERROR",
    )
  );
}

/**
 * Executa uma operacao na API REST do Firebase Authentication.
 */
async function firebaseRequest(endpoint, body) {
  const response = await fetch(
    `${FIREBASE_AUTH_URL}:${endpoint}?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw mapFirebaseError(data.error?.message);
  }

  return data;
}

const firebaseRestAdapter = {
  signUp(email, password) {
    return firebaseRequest("signUp", {
      email,
      password,
      returnSecureToken: true,
    });
  },

  signIn(email, password) {
    return firebaseRequest("signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
  },

  async getAccount(idToken) {
    const data = await firebaseRequest("lookup", { idToken });
    return data.users?.[0];
  },

  updateProfile(idToken, displayName, photoUrl) {
    return firebaseRequest("update", {
      idToken,
      displayName,
      photoUrl,
      returnSecureToken: true,
    });
  },

  sendEmailVerification(idToken) {
    return firebaseRequest("sendOobCode", {
      requestType: "VERIFY_EMAIL",
      idToken,
    });
  },

  deleteAccount(idToken) {
    return firebaseRequest("delete", { idToken });
  },
};

/**
 * Retorna o adaptador real ou o substituto configurado nos testes.
 */
function getAdapter() {
  return testAdapter || firebaseRestAdapter;
}

/**
 * Substitui temporariamente a integracao Firebase durante testes.
 */
export function setFirebaseAuthAdapter(adapter) {
  testAdapter = adapter;
}

/**
 * Restaura a integracao Firebase REST original.
 */
export function resetFirebaseAuthAdapter() {
  testAdapter = undefined;
}

/**
 * Cria uma conta no Firebase Authentication.
 */
export function createFirebaseUser(email, password) {
  return getAdapter().signUp(email, password);
}

/**
 * Autentica uma conta no Firebase Authentication.
 */
export function signInFirebaseUser(email, password) {
  return getAdapter().signIn(email, password);
}

/**
 * Busca os dados da conta Firebase pelo ID token.
 */
export function getFirebaseAccount(idToken) {
  return getAdapter().getAccount(idToken);
}

/**
 * Atualiza nome e foto no perfil Firebase.
 */
export function updateFirebaseProfile(idToken, displayName, photoUrl) {
  return getAdapter().updateProfile(idToken, displayName, photoUrl);
}

/**
 * Solicita ao Firebase o envio do link de verificacao.
 */
export function sendFirebaseVerificationEmail(idToken) {
  return getAdapter().sendEmailVerification(idToken);
}

/**
 * Exclui uma conta Firebase criada durante um cadastro incompleto.
 */
export function deleteFirebaseUser(idToken) {
  return getAdapter().deleteAccount(idToken);
}
