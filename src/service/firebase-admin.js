import "dotenv/config";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const sessionDuration = 8 * 60 * 60 * 1000;

// Obtém a credencial administrativa configurada para o Firebase.
function getCredential() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return applicationDefault();
  }

  return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
}

if (!getApps().length) {
  initializeApp({ credential: getCredential() });
}

const firebaseAdminAuth = getAuth();
let testAdapter;

// Retorna o cliente Admin real ou o substituto de teste.
function getAdminAuth() {
  return testAdapter || firebaseAdminAuth;
}

// Define um cliente Admin simulado para os testes.
export function setFirebaseAdminAdapter(adapter) {
  testAdapter = adapter;
}

// Restaura o cliente Admin padrão.
export function resetFirebaseAdminAdapter() {
  testAdapter = undefined;
}

// Verifica um ID token Firebase e sua revogação.
export function verifyFirebaseIdToken(token) {
  return getAdminAuth().verifyIdToken(token, true);
}

// Verifica um cookie de sessão Firebase e sua revogação.
export function verifyFirebaseSession(sessionCookie) {
  return getAdminAuth().verifySessionCookie(sessionCookie, true);
}

// Converte um ID token em cookie de sessão temporário.
export function createFirebaseSession(idToken) {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: sessionDuration,
  });
}

// Revoga todas as sessões ativas do usuário Firebase.
export function revokeFirebaseSessions(firebaseUid) {
  return getAdminAuth().revokeRefreshTokens(firebaseUid);
}

// Atualiza a senha no Firebase Authentication.
export function updateFirebasePassword(firebaseUid, password) {
  return getAdminAuth().updateUser(firebaseUid, { password });
}

// Cria uma conta gerenciada pelo Firebase Admin.
export function createFirebaseUser(data) {
  return getAdminAuth().createUser(data);
}

// Atualiza dados administrativos da conta Firebase.
export function updateFirebaseUser(firebaseUid, data) {
  return getAdminAuth().updateUser(firebaseUid, data);
}

// Exclui uma conta Firebase criada em uma operação incompleta.
export function deleteFirebaseUserByUid(firebaseUid) {
  return getAdminAuth().deleteUser(firebaseUid);
}

export { sessionDuration };
