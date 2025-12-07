import { openDB } from 'idb';

const DB_NAME = 'soussou-souvenirs-db';
const DB_VERSION = 1;

// Initialize IndexedDB
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Create submissions store
        if (!db.objectStoreNames.contains('submissions')) {
          const submissionsStore = db.createObjectStore('submissions', {
            keyPath: 'id',
            autoIncrement: false
          });
          submissionsStore.createIndex('status', 'status', { unique: false });
          submissionsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          submissionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created submissions store');
        }

        // Create authors store
        if (!db.objectStoreNames.contains('authors')) {
          db.createObjectStore('authors', {
            keyPath: 'name',
            autoIncrement: false
          });
          console.log('Created authors store');
        }

        // Create sync-queue store
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncQueueStore = db.createObjectStore('sync-queue', {
            keyPath: 'id',
            autoIncrement: false
          });
          syncQueueStore.createIndex('retryCount', 'retryCount', { unique: false });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created sync-queue store');
        }
      },
    });

    console.log('IndexedDB initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    throw error;
  }
}

// Submissions operations
export async function saveSubmission(submission) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.put('submissions', submission);
    console.log('Submission saved:', submission.id);
    return submission;
  } catch (error) {
    console.error('Error saving submission:', error);
    throw error;
  }
}

export async function getSubmission(id) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const submission = await db.get('submissions', id);
    return submission;
  } catch (error) {
    console.error('Error getting submission:', error);
    throw error;
  }
}

export async function getAllSubmissions() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const submissions = await db.getAll('submissions');
    return submissions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting all submissions:', error);
    throw error;
  }
}

export async function getSubmissionsByStatus(status) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const index = db.transaction('submissions').store.index('status');
    const submissions = await index.getAll(status);
    return submissions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting submissions by status:', error);
    throw error;
  }
}

export async function getUnsynedSubmissions() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const allSubmissions = await db.getAll('submissions');
    return allSubmissions.filter(s =>
      s.status === 'validated' &&
      (s.syncStatus === 'pending' || s.syncStatus === 'failed')
    );
  } catch (error) {
    console.error('Error getting unsynced submissions:', error);
    throw error;
  }
}

export async function updateSubmission(id, updates) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const existing = await db.get('submissions', id);
    if (!existing) {
      throw new Error(`Submission ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    await db.put('submissions', updated);
    console.log('Submission updated:', id);
    return updated;
  } catch (error) {
    console.error('Error updating submission:', error);
    throw error;
  }
}

export async function deleteSubmission(id) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.delete('submissions', id);
    console.log('Submission deleted:', id);
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw error;
  }
}

// Authors operations
export async function saveAuthor(name) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.put('authors', { name, timestamp: Date.now() });
    console.log('Author saved:', name);
  } catch (error) {
    console.error('Error saving author:', error);
    throw error;
  }
}

export async function getAllAuthors() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const authors = await db.getAll('authors');
    return authors.map(a => a.name).sort();
  } catch (error) {
    console.error('Error getting authors:', error);
    return [];
  }
}

// Sync queue operations
export async function addToSyncQueue(submission) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const queueItem = {
      id: submission.id,
      submissionId: submission.id,
      timestamp: Date.now(),
      retryCount: 0,
      lastAttempt: null,
      error: null
    };
    await db.put('sync-queue', queueItem);
    console.log('Added to sync queue:', submission.id);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
}

export async function removeFromSyncQueue(id) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.delete('sync-queue', id);
    console.log('Removed from sync queue:', id);
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    throw error;
  }
}

export async function getSyncQueue() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const queue = await db.getAll('sync-queue');
    return queue.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

export async function updateSyncQueueItem(id, updates) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const existing = await db.get('sync-queue', id);
    if (!existing) {
      throw new Error(`Sync queue item ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    await db.put('sync-queue', updated);
    console.log('Sync queue item updated:', id);
    return updated;
  } catch (error) {
    console.error('Error updating sync queue item:', error);
    throw error;
  }
}

// Clear all data (for testing/reset)
export async function clearAllData() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.clear('submissions');
    await db.clear('authors');
    await db.clear('sync-queue');
    console.log('All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

// Get database stats
export async function getStats() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const submissions = await db.getAll('submissions');
    const authors = await db.getAll('authors');
    const syncQueue = await db.getAll('sync-queue');

    return {
      totalSubmissions: submissions.length,
      draftSubmissions: submissions.filter(s => s.status === 'draft').length,
      validatedSubmissions: submissions.filter(s => s.status === 'validated').length,
      syncedSubmissions: submissions.filter(s => s.syncStatus === 'synced').length,
      pendingSync: submissions.filter(s => s.syncStatus === 'pending').length,
      failedSync: submissions.filter(s => s.syncStatus === 'failed').length,
      totalAuthors: authors.length,
      syncQueueLength: syncQueue.length
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}
