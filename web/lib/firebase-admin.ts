import * as admin from "firebase-admin";
import { cert, getApps, initializeApp } from "firebase-admin/app";

function normalizarPrivateKey(privateKey?: string) {
  if (!privateKey) {
    throw new Error("Falta la variable FIREBASE_PRIVATE_KEY");
  }

  return privateKey
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
}

function inicializarFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizarPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId) {
    throw new Error("Falta la variable FIREBASE_PROJECT_ID");
  }

  if (!clientEmail) {
    throw new Error("Falta la variable FIREBASE_CLIENT_EMAIL");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

inicializarFirebaseAdmin();

export default admin;