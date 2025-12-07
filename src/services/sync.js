import {
  getUnsynedSubmissions,
  updateSubmission,
  addToSyncQueue,
  removeFromSyncQueue,
  getSyncQueue,
  updateSyncQueueItem
} from './storage.js';
import { blobToBase64 } from './compression.js';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 2000; // 2 seconds

/**
 * Check if online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Send a single submission to n8n webhook
 * @param {Object} submission - The submission to send
 * @returns {Promise<Object>} - Response from server
 */
export async function sendSubmissionToN8N(submission) {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N webhook URL not configured. Please set VITE_N8N_WEBHOOK_URL in .env');
  }

  try {
    console.log('Sending submission to n8n:', submission.id);

    // Prepare the payload
    const payload = {
      id: submission.id,
      mediaType: submission.mediaType,
      author: submission.author,
      relationship: submission.relationship,
      dateRange: submission.dateRange,
      location: submission.location,
      emotion: submission.emotion,
      people: submission.people,
      description: submission.description,
      category: submission.category,
      timestamp: submission.timestamp,
      status: submission.status,
    };

    // Convert media to base64 if it exists
    if (submission.media) {
      if (typeof submission.media === 'string') {
        // Already base64
        payload.mediaBase64 = submission.media;
      } else {
        // Convert blob to base64
        payload.mediaBase64 = await blobToBase64(submission.media);
      }
    }

    // Send to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Successfully sent to n8n:', submission.id, result);

    return result;
  } catch (error) {
    console.error('Error sending to n8n:', error);
    throw error;
  }
}

/**
 * Sync a single submission with retry logic
 * @param {Object} submission - The submission to sync
 * @param {number} retryCount - Current retry count
 * @returns {Promise<boolean>} - True if successful
 */
export async function syncSubmissionWithRetry(submission, retryCount = 0) {
  try {
    // Check if online
    if (!isOnline()) {
      console.log('Offline - will retry later');
      return false;
    }

    // Try to send
    await sendSubmissionToN8N(submission);

    // Update submission as synced
    await updateSubmission(submission.id, {
      syncStatus: 'synced',
      syncedAt: Date.now(),
    });

    // Remove from sync queue
    await removeFromSyncQueue(submission.id);

    console.log('Submission synced successfully:', submission.id);
    return true;
  } catch (error) {
    console.error(`Error syncing submission (attempt ${retryCount + 1}):`, error);

    // Check if we should retry
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      // Calculate delay with exponential backoff
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);

      // Update sync queue item
      try {
        await updateSyncQueueItem(submission.id, {
          retryCount: retryCount + 1,
          lastAttempt: Date.now(),
          error: error.message,
        });
      } catch (queueError) {
        console.error('Error updating sync queue:', queueError);
      }

      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return await syncSubmissionWithRetry(submission, retryCount + 1);
    } else {
      // Max retries reached - mark as failed
      await updateSubmission(submission.id, {
        syncStatus: 'failed',
        syncError: error.message,
      });

      // Update sync queue
      try {
        await updateSyncQueueItem(submission.id, {
          retryCount: retryCount + 1,
          lastAttempt: Date.now(),
          error: error.message,
        });
      } catch (queueError) {
        console.error('Error updating sync queue:', queueError);
      }

      console.error('Max retry attempts reached for:', submission.id);
      return false;
    }
  }
}

/**
 * Sync all pending submissions
 * @returns {Promise<Object>} - Sync results
 */
export async function syncAllPendingSubmissions() {
  console.log('Starting sync of all pending submissions...');

  try {
    // Get all unsynced submissions
    const unsynced = await getUnsynedSubmissions();

    if (unsynced.length === 0) {
      console.log('No submissions to sync');
      return {
        success: true,
        total: 0,
        synced: 0,
        failed: 0,
      };
    }

    console.log(`Found ${unsynced.length} submissions to sync`);

    // Add all to sync queue if not already there
    for (const submission of unsynced) {
      try {
        await addToSyncQueue(submission);
      } catch (error) {
        // Might already be in queue
        console.log('Submission already in queue or error:', submission.id);
      }
    }

    // Sync each submission
    let synced = 0;
    let failed = 0;

    for (const submission of unsynced) {
      const success = await syncSubmissionWithRetry(submission);
      if (success) {
        synced++;
      } else {
        failed++;
      }
    }

    const result = {
      success: synced > 0,
      total: unsynced.length,
      synced,
      failed,
    };

    console.log('Sync complete:', result);
    return result;
  } catch (error) {
    console.error('Error in syncAllPendingSubmissions:', error);
    return {
      success: false,
      total: 0,
      synced: 0,
      failed: 0,
      error: error.message,
    };
  }
}

/**
 * Retry failed syncs from queue
 * @returns {Promise<Object>} - Retry results
 */
export async function retryFailedSyncs() {
  console.log('Retrying failed syncs...');

  try {
    const queue = await getSyncQueue();

    if (queue.length === 0) {
      console.log('No items in sync queue');
      return {
        success: true,
        total: 0,
        synced: 0,
        failed: 0,
      };
    }

    console.log(`Found ${queue.length} items in sync queue`);

    let synced = 0;
    let failed = 0;

    for (const queueItem of queue) {
      // Get the actual submission
      const { getSubmission } = await import('./storage.js');
      const submission = await getSubmission(queueItem.submissionId);

      if (!submission) {
        console.warn('Submission not found for queue item:', queueItem.id);
        await removeFromSyncQueue(queueItem.id);
        continue;
      }

      const success = await syncSubmissionWithRetry(submission, queueItem.retryCount || 0);
      if (success) {
        synced++;
      } else {
        failed++;
      }
    }

    const result = {
      success: synced > 0,
      total: queue.length,
      synced,
      failed,
    };

    console.log('Retry complete:', result);
    return result;
  } catch (error) {
    console.error('Error in retryFailedSyncs:', error);
    return {
      success: false,
      total: 0,
      synced: 0,
      failed: 0,
      error: error.message,
    };
  }
}

/**
 * Setup background sync (if supported)
 */
export async function setupBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-submissions');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Error registering background sync:', error);
    }
  } else {
    console.log('Background sync not supported');
  }
}

/**
 * Listen for online/offline events and auto-sync
 */
export function setupAutoSync() {
  window.addEventListener('online', () => {
    console.log('Connection restored - syncing...');
    syncAllPendingSubmissions();
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost - will sync when online');
  });

  // Also try to sync on page load if online
  if (isOnline()) {
    setTimeout(() => {
      syncAllPendingSubmissions();
    }, 2000); // Wait 2 seconds after page load
  }
}
