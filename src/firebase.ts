import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "./config.ts";
import serviceAccount from "../config/service.json" assert { type: "json" };

const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_AUTH_DOMAIN,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID,
    measurementId: config.FIREBASE_MEASUREMENT_ID
};

export const firebase = initializeApp({
    credential: applicationDefault()
});

export const firestore = getFirestore(firebase);

export const getDocumentCountForCollection = async (collectionName: string) => {
    const query = await firestore.collection(collectionName).get();
    return query.size;
}

export const getApplicationCount = async () => {
    return await getDocumentCountForCollection("applications");
}

export const getApplicationDraftCount = async () => {
    return await getDocumentCountForCollection("application-drafts");
};
