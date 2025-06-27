// src/config/firebase.config.ts
import * as dotenv from 'dotenv';
dotenv.config(); 
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join, isAbsolute } from 'path';

let serviceAccount: admin.ServiceAccount;

// 1. Tenta via BASE64
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
      'base64'
    ).toString('utf-8');
    serviceAccount = JSON.parse(decoded);
    console.log('[Firebase] Service account carregada via BASE64.');
  } catch (err) {
    throw new Error(
      'Erro ao decodificar FIREBASE_SERVICE_ACCOUNT_BASE64: ' + err
    );
  }
} else {
  // 2. Fallback (dev local)
  const relPath =
    process.env.FIREBASE_CREDENTIALS_PATH ||
    'src/config/firebase-service-account.json';
  const absPath = isAbsolute(relPath)
    ? relPath
    : join(process.cwd(), relPath);

  if (!existsSync(absPath)) {
    throw new Error(`[Firebase] Service account file não encontrado: ${absPath}`);
  }
  try {
    serviceAccount = JSON.parse(readFileSync(absPath, 'utf-8'));
    console.log('[Firebase] Service account carregada via arquivo.');
  } catch (err) {
    throw new Error('Erro ao ler o arquivo de service account: ' + err);
  }
}

// 3. Inicializa o Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export default admin;
