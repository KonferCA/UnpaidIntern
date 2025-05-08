import * as admin from 'firebase-admin';
import { getFirestore, CollectionReference, DocumentData } from 'firebase-admin/firestore';
import { config } from '../config';

// Initialize Firebase Admin
let firebaseApp: admin.app.App;
const firebaseConfig = {
	apiKey: config.FIREBASE_API_KEY,
	authDomain: config.FIREBASE_AUTH_DOMAIN,
	projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
	messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
	appId: config.FIREBASE_APP_ID,
	measurementId: config.FIREBASE_MEASUREMENT_ID
};


try {
  // Initialize Firebase with service account
  firebaseApp = admin.initializeApp(firebaseConfig);
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  throw error;
}

// Initialize Firestore
const db = getFirestore(firebaseApp);

/**
 * Firestore Database Service
 * Handles all interactions with Firestore database
 */
export class FirestoreService {
  /**
   * Get a document by ID from a collection
   */
  async getDocument<T = DocumentData>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = db.collection(collectionName).doc(documentId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.log(`Document not found: ${collectionName}/${documentId}`);
        return null;
      }

      return doc.data() as T;
    } catch (error) {
      console.error(`Error fetching document ${collectionName}/${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get all documents from a collection
   */
  async getAllDocuments<T = DocumentData>(
    collectionName: string
  ): Promise<T[]> {
    try {
      const snapshot = await db.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`No documents found in collection: ${collectionName}`);
        return [];
      }

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      console.error(`Error fetching documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Query documents from a collection with filters
   */
  async queryDocuments<T = DocumentData>(
    collectionName: string,
    field: string,
    operator: admin.firestore.WhereFilterOp,
    value: any
  ): Promise<T[]> {
    try {
      const query = db.collection(collectionName).where(field, operator, value);
      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log(`No matching documents found in ${collectionName}`);
        return [];
      }

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * List all collections in the database
   */
  async listCollections(): Promise<string[]> {
    try {
      const collections = await db.listCollections();
      return collections.map(collection => collection.id);
    } catch (error) {
      console.error('Error listing collections:', error);
      throw error;
    }
  }

  /**
   * Create or update a document in a collection
   */
  async setDocument(
    collectionName: string,
    documentId: string,
    data: DocumentData
  ): Promise<void> {
    try {
      await db.collection(collectionName).doc(documentId).set(data, { merge: true });
      console.log(`Document ${collectionName}/${documentId} saved successfully`);
    } catch (error) {
      console.error(`Error saving document ${collectionName}/${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document from a collection
   */
  async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    try {
      await db.collection(collectionName).doc(documentId).delete();
      console.log(`Document ${collectionName}/${documentId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting document ${collectionName}/${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get a reference to a collection for complex queries
   */
  getCollectionRef(collectionName: string): CollectionReference<DocumentData> {
    return db.collection(collectionName);
  }
}

// Export a singleton instance of the Firestore service
export const firestoreService = new FirestoreService();

// Export Firestore database instance for advanced usage
export { db };

export default firestoreService;

