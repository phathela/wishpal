/**
 * Agent Worker
 *
 * Background worker that periodically processes unprocessed wishes through
 * the AI agent pipeline. Runs on a setInterval every 30 seconds.
 *
 * The worker:
 *   1. Finds wishes with status='active' and agent_processed=false
 *   2. Processes each through aiAgent.processWish()
 *   3. Creates match records for matches with score > 70%
 *   4. Creates agent_log entries
 *   5. Updates wish status if matched
 *   6. Emits socket events for real-time updates
 */

const pool = require('../db/pool');
const { processWish } = require('../services/aiAgent');

// In-memory set to track wishes currently being processed (prevents double-processing)
const processingWishes = new Set();

let intervalHandle = null;
let ioInstance = null;

/**
 * Initialize the worker with a Socket.io instance for emitting events.
 *
 * @param {Object} io - Socket.io server instance
 */
function initWorker(io) {
  ioInstance = io;
  console.log('[AgentWorker] Initialized with Socket.io instance');
}

/**
 * Start the agent worker loop.
 * Runs processPendingWishes every 30 seconds.
 */
function startWorker() {
  if (intervalHandle) {
    console.log('[AgentWorker] Worker already running');
    return;
  }

  console.log('[AgentWorker] Starting worker (interval: 30s)');
  intervalHandle = setInterval(processPendingWishes, 30000);

  // Run an initial cycle immediately
  processPendingWishes();
}

/**
 * Stop the agent worker loop.
 */
function stopWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[AgentWorker] Worker stopped');
  }
}

/**
 * Main worker function: finds and processes unprocessed wishes.
 */
async function processPendingWishes() {
  try {
    // Find active wishes that haven't been processed by the agent
    // and aren't currently being processed
    const result = await pool.query(
      `SELECT w.*, u.username, u.display_name
       FROM wishes w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'active'
         AND w.agent_processed = false
       ORDER BY w.created_at ASC
       LIMIT 10`
    );

    if (result.rows.length === 0) {
      return; // No pending wishes
    }

    console.log(`[AgentWorker] Found ${result.rows.length} unprocessed wish(es)`);

    for (const wish of result.rows) {
      // Skip if already being processed
      if (processingWishes.has(wish.id)) {
        continue;
      }

      processingWishes.add(wish.id);

      // Process asynchronously - don't block the worker loop
      processSingleWish(wish).finally(() => {
        processingWishes.delete(wish.id);
      }).catch(err => {
        console.error(`[AgentWorker] Unhandled error processing wish #${wish.id}:`, err);
      });
    }
  } catch (err) {
    console.error('[AgentWorker] Error in processPendingWishes:', err.message);
  }
}

/**
 * Process a single wish through the AI agent pipeline.
 *
 * @param {Object} wish - The wish object from the database
 */
async function processSingleWish(wish) {
  try {
    console.log(`[AgentWorker] Processing wish #${wish.id}: "${wish.title}"`);

    // Emit processing started event
    if (ioInstance) {
      ioInstance.to(`user_${wish.user_id}`).emit('agent_update', {
        wishId: wish.id,
        status: 'processing',
        message: `AI agent is processing "${wish.title}"...`
      });
    }

    // Run the AI agent processing pipeline
    const results = await processWish(wish);

    // Mark wish as agent_processed
    await pool.query(
      'UPDATE wishes SET agent_processed = true, updated_at = NOW() WHERE id = $1',
      [wish.id]
    );

    // Create agent log entries
    for (const log of results.logs) {
      await pool.query(
        `INSERT INTO agent_logs (wish_id, agent_type, action, details)
         VALUES ($1, $2, $3, $4)`,
        [wish.id, log.agentType, log.action, JSON.stringify(log.details)]
      );
    }

    let matchCount = 0;

    // Create match records for internal matches above threshold
    for (const match of results.internalMatches) {
      if (match.matchScore > 70) {
        const matchResult = await pool.query(
          `INSERT INTO matches (wish_id, matched_to_user_id, match_score, match_type)
           VALUES ($1, $2, $3, 'internal')
           RETURNING id`,
          [wish.id, match.matchedUserId, match.matchScore]
        );

        console.log(`[AgentWorker] Match created: wish #${wish.id} <-> user #${match.matchedUserId} (score: ${match.matchScore})`);

        matchCount++;

        // Emit match_found event to both users
        if (ioInstance) {
          // Notify the wish owner
          ioInstance.to(`user_${wish.user_id}`).emit('match_found', {
            matchId: matchResult.rows[0].id,
            wishId: wish.id,
            wishTitle: wish.title,
            matchedWith: match.matchedUsername,
            matchScore: match.matchScore,
            message: `New match found for "${wish.title}"!`
          });

          // Notify the matched user
          ioInstance.to(`user_${match.matchedUserId}`).emit('match_found', {
            matchId: matchResult.rows[0].id,
            wishId: match.wishId,
            wishTitle: match.title,
            matchScore: match.matchScore,
            message: `Your wish matched with "${wish.title}"!`
          });
        }
      }
    }

    // Create external match records
    for (const ext of results.externalResults) {
      await pool.query(
        `INSERT INTO matches (wish_id, match_type, external_source, external_url, external_title, match_score)
         VALUES ($1, 'external', $2, $3, $4, $5)`,
        [wish.id, ext.source, ext.url, ext.title, ext.matchConfidence || 0]
      );
    }

    // If internal matches found with high score, consider updating status
    // Currently we leave wishes active so they can be matched to multiple users
    // Future: could set status to 'matched' after configurable number of matches

    // Emit processing complete event
    if (ioInstance) {
      ioInstance.to(`user_${wish.user_id}`).emit('agent_update', {
        wishId: wish.id,
        status: 'completed',
        matchCount,
        externalCount: results.externalResults.length,
        message: `AI agent finished processing "${wish.title}"`
      });
    }

    console.log(`[AgentWorker] Completed wish #${wish.id}: ${matchCount} match(es), ${results.externalResults.length} external`);
  } catch (err) {
    console.error(`[AgentWorker] Error processing wish #${wish.id}:`, err.message);

    // Still mark as processed to avoid re-processing failed wishes infinitely
    try {
      await pool.query(
        'UPDATE wishes SET agent_processed = true, updated_at = NOW() WHERE id = $1',
        [wish.id]
      );

      // Log the error
      await pool.query(
        `INSERT INTO agent_logs (wish_id, agent_type, action, details)
         VALUES ($1, 'system', 'processing_error', $2)`,
        [wish.id, JSON.stringify({ error: err.message })]
      );
    } catch (logErr) {
      console.error('[AgentWorker] Failed to log error:', logErr.message);
    }

    // Emit error event
    if (ioInstance) {
      ioInstance.to(`user_${wish.user_id}`).emit('agent_update', {
        wishId: wish.id,
        status: 'error',
        message: `AI agent encountered an error processing "${wish.title}"`
      });
    }
  }
}

module.exports = {
  initWorker,
  startWorker,
  stopWorker,
  processPendingWishes
};
