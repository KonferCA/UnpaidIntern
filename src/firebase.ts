import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs } from "firebase/firestore";
import { config } from "./config.ts";

const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_AUTH_DOMAIN,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID,
    measurementId: config.FIREBASE_MEASUREMENT_ID
};

const firebase = initializeApp(firebaseConfig);
const firestore = getFirestore(firebase);

const getDocumentCountForCollection = async (collectionName: string) => {
    const query = await getDocs(collection(firestore, collectionName));
    return query.size;
}

const getApplicationCount = async () => {
    return await getDocumentCountForCollection("applications");
}

const getApplicationDraftCount = async () => {
    return await getDocumentCountForCollection("application-drafts");
};


export { firebase, firestore, getDocumentCountForCollection, getApplicationCount, getApplicationDraftCount };
