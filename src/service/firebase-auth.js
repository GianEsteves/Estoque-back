import { httpError } from "./app-error.js";

const FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts";

let testAdapter;

/**
 * Retorna a chave publica usada pelas operacoes REST do Firebase Auth.
 */
// Obtém a chave pública usada pela API REST do Firebase.
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
// Traduz um código do Firebase para um erro da aplicação.
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
    httpError("Falha ao autenticar com Firebase", 502, "FIREBASE_AUTH_ERROR")
  );
}

/**
 * Executa uma operacao na API REST do Firebase Authentication.
 */
// Executa uma requisição autenticada à API REST do Firebase.
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
  // Cria uma conta com e-mail e senha.
  signUp(email, password) {
    return firebaseRequest("signUp", {
      email,
      password,
      returnSecureToken: true,
    });
  },

  // Autentica uma conta com e-mail e senha.
  signIn(email, password) {
    return firebaseRequest("signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
  },

  // Busca a conta vinculada a um ID token.
  // Busca a conta associada ao token informado.
  async getAccount(idToken) {
    const data = await firebaseRequest("lookup", { idToken });
    return data.users?.[0];
  },

  // Atualiza os dados públicos da conta.
  updateProfile(idToken, displayName, photoUrl) {
    return firebaseRequest("update", {
      idToken,
      displayName,
      photoUrl,
      returnSecureToken: true,
    });
  },

  // Solicita a verificação do endereço de e-mail.
  sendEmailVerification(idToken) {
    return firebaseRequest("sendOobCode", {
      requestType: "VERIFY_EMAIL",
      idToken,
    });
  },

  // Exclui uma conta criada parcialmente.
  deleteAccount(idToken) {
    return firebaseRequest("delete", { idToken });
  },

  // Solicita o e-mail de recuperação de senha.
  sendPasswordResetEmail(email) {
    return firebaseRequest("sendOobCode", {
      requestType: "PASSWORD_RESET",
      email,
    });
  },
};

/**
 * Retorna o adaptador real ou o substituto configurado nos testes.
 */
// Retorna o adaptador Firebase real ou o simulado.
function getAdapter() {
  return testAdapter || firebaseRestAdapter;
}

/**
 * Substitui temporariamente a integracao Firebase durante testes.
 */
// Define o adaptador Firebase usado nos testes.
export function setFirebaseAuthAdapter(adapter) {
  testAdapter = adapter;
}

/**
 * Restaura a integracao Firebase REST original.
 */
// Restaura o adaptador Firebase padrão.
export function resetFirebaseAuthAdapter() {
  testAdapter = undefined;
}

/**
 * Cria uma conta no Firebase Authentication.
 */
// Cria uma conta no Firebase Authentication.
export function createFirebaseUser(email, password) {
  return getAdapter().signUp(email, password);
}

/**
 * Autentica uma conta no Firebase Authentication.
 */
// Autentica uma conta no Firebase Authentication.
export function signInFirebaseUser(email, password) {
  return getAdapter().signIn(email, password);
}

/**
 * Busca os dados da conta Firebase pelo ID token.
 */
// Obtém os dados de uma conta pelo ID token.
export function getFirebaseAccount(idToken) {
  return getAdapter().getAccount(idToken);
}

/**
 * Atualiza nome e foto no perfil Firebase.
 */
// Atualiza o nome e a foto do perfil Firebase.
export function updateFirebaseProfile(idToken, displayName, photoUrl) {
  return getAdapter().updateProfile(idToken, displayName, photoUrl);
}

/**
 * Solicita ao Firebase o envio do link de verificacao.
 */
// Envia a mensagem de verificação de e-mail.
export function sendFirebaseVerificationEmail(idToken) {
  return getAdapter().sendEmailVerification(idToken);
}

/**
 * Exclui uma conta Firebase criada durante um cadastro incompleto.
 */
// Exclui a conta Firebase em caso de rollback.
export function deleteFirebaseUser(idToken) {
  return getAdapter().deleteAccount(idToken);
}

// Envia o e-mail de recuperação de senha.
export function sendFirebasePasswordResetEmail(email) {
  return getAdapter().sendPasswordResetEmail(email);
}
