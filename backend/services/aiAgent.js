/**
 * AI Agent Service
 *
 * Mock service that simulates AI agent processing for wish matching.
 * All async operations use setTimeout + Promise to simulate real API calls.
 * TODO: Replace mock implementations with actual AI API calls.
 */

const pool = require('../db/pool');

/**
 * Simulates processing a wish through the AI matching agent pipeline.
 * Steps:
 *   1. Category classification and agent assignment
 *   2. Internal matching against other active wishes
 *   3. External source search (if applicable)
 *
 * @param {Object} wish - The wish object from the database
 * @returns {Object} Processing results with matches and logs
 */
function processWish(wish) {
  return new Promise((resolve) => {
    const delay = 3000 + Math.random() * 2000; // 3-5 seconds

    console.log(`[AI Agent] Processing wish #${wish.id}: "${wish.title}" (${delay.toFixed(0)}ms)`);

    setTimeout(async () => {
      try {
        const results = {
          wishId: wish.id,
          agentType: determineAgentType(wish.category),
          internalMatches: [],
          externalResults: [],
          logs: []
        };

        // Step 1: Log agent assignment
        results.logs.push({
          agentType: results.agentType,
          action: 'agent_assigned',
          details: { category: wish.category, agent: results.agentType }
        });

        console.log(`[AI Agent] Wish #${wish.id}: Assigned ${results.agentType} agent`);

        // Step 2: Search for internal matches
        // TODO: Replace with actual embedding similarity search or ML-based matching
        const internalMatches = await findInternalMatches(wish);
        results.internalMatches = internalMatches;

        if (internalMatches.length > 0) {
          results.logs.push({
            agentType: results.agentType,
            action: 'internal_matches_found',
            details: { count: internalMatches.length, matches: internalMatches.map(m => m.wishId) }
          });
          console.log(`[AI Agent] Wish #${wish.id}: Found ${internalMatches.length} internal match(es)`);
        } else {
          results.logs.push({
            agentType: results.agentType,
            action: 'no_internal_matches',
            details: {}
          });
          console.log(`[AI Agent] Wish #${wish.id}: No internal matches found`);
        }

        // Step 3: Search external sources if applicable
        // TODO: Replace with actual external API calls (e.g., eBay, Etsy, Craigslist)
        if (shouldSearchExternal(wish)) {
          const externalResults = await searchExternalSources(wish);
          results.externalResults = externalResults;

          if (externalResults.length > 0) {
            results.logs.push({
              agentType: results.agentType,
              action: 'external_sources_checked',
              details: { count: externalResults.length, sources: externalResults.map(r => r.source) }
            });
            console.log(`[AI Agent] Wish #${wish.id}: Found ${externalResults.length} external result(s)`);
          }
        }

        resolve(results);
      } catch (err) {
        console.error(`[AI Agent] Error processing wish #${wish.id}:`, err.message);
        resolve({
          wishId: wish.id,
          agentType: 'unknown',
          internalMatches: [],
          externalResults: [],
          logs: [{
            agentType: 'system',
            action: 'processing_error',
            details: { error: err.message }
          }]
        });
      }
    }, delay);
  });
}

/**
 * Determines the appropriate agent type based on wish category.
 * TODO: Replace with ML classification model.
 */
function determineAgentType(category) {
  const agentMap = {
    'education': 'edu_agent',
    'career': 'career_agent',
    'health': 'health_agent',
    'finance': 'finance_agent',
    'travel': 'travel_agent',
    'shopping': 'shopping_agent',
    'community': 'community_agent',
    'creative': 'creative_agent',
    'food': 'food_agent',
    'technology': 'tech_agent'
  };

  return agentMap[category.toLowerCase()] || 'general_agent';
}

/**
 * Searches for internal matches against other active wishes.
 * TODO: Replace with cosine similarity on embeddings, vector DB query, or ML matching.
 */
async function findInternalMatches(wish) {
  try {
    // Find active wishes that might match, excluding the current user's own wishes
    const result = await pool.query(
      `SELECT w.id, w.title, w.category, w.description, w.amount, w.location_country, w.location_region,
              u.id as user_id, u.username, u.display_name
       FROM wishes w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'active'
         AND w.user_id != $1
         AND w.agent_processed = true
         AND (w.category = $2 OR $2 IS NULL)
       ORDER BY RANDOM()
       LIMIT 5`,
      [wish.user_id, wish.category]
    );

    const matches = [];
    for (const row of result.rows) {
      // Calculate a mock match score based on category match and random factor
      // TODO: Replace with actual scoring algorithm
      const categoryBonus = row.category === wish.category ? 20 : 0;
      const score = Math.min(95, Math.round((40 + Math.random() * 40 + categoryBonus) * 100) / 100);

      // Only include matches above 70% threshold
      if (score > 70) {
        matches.push({
          wishId: row.id,
          title: row.title,
          matchScore: score,
          matchedUserId: row.user_id,
          matchedUsername: row.username || row.display_name,
          category: row.category
        });
      }
    }

    return matches;
  } catch (err) {
    console.error('[AI Agent] Error finding internal matches:', err.message);
    return [];
  }
}

/**
 * Determines whether to search external sources based on wish attributes.
 */
function shouldSearchExternal(wish) {
  // Search external for wishes with payment_type='pay' or exchange items
  const externalCategories = ['shopping', 'technology', 'travel', 'food'];
  return wish.payment_type === 'pay' || externalCategories.includes(wish.category?.toLowerCase());
}

/**
 * Searches external sources for matching items/services.
 * TODO: Replace with actual API integrations:
 *   - eBay Finding API
 *   - Etsy API
 *   - Google Shopping API
 *   - Craigslist search
 *
 * @param {Object} wish - The wish object
 * @returns {Array} Array of external source results
 */
function searchExternalSources(wish) {
  return new Promise((resolve) => {
    const delay = 2000 + Math.random() * 2000; // 2-4 seconds

    setTimeout(() => {
      const mockResults = [
        {
          source: 'eBay',
          title: `eBay listing: ${wish.title} - Like New`,
          url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(wish.title)}`,
          price: wish.amount ? wish.amount * (0.7 + Math.random() * 0.5) : null,
          matchConfidence: Math.round((60 + Math.random() * 35) * 100) / 100
        },
        {
          source: 'Etsy',
          title: `Handcrafted ${wish.title} - Custom Order`,
          url: `https://www.etsy.com/search?q=${encodeURIComponent(wish.title)}`,
          price: wish.amount ? wish.amount * (0.9 + Math.random() * 0.8) : null,
          matchConfidence: Math.round((50 + Math.random() * 40) * 100) / 100
        },
        {
          source: 'Google Shopping',
          title: `Best deals on ${wish.title}`,
          url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(wish.title)}`,
          price: wish.amount ? wish.amount * (0.6 + Math.random() * 0.4) : null,
          matchConfidence: Math.round((55 + Math.random() * 35) * 100) / 100
        }
      ];

      resolve(mockResults);
    }, delay);
  });
}

/**
 * Generates an agent opinion on a comment relative to a wish.
 * TODO: Replace with NLP sentiment/alignment analysis (e.g., Anthropic or OpenAI API).
 *
 * @param {string} commentText - The comment text to evaluate
 * @param {string} wishDescription - The wish description for context
 * @returns {Object} The agent's opinion result
 */
function getAgentOpinion(commentText, wishDescription) {
  return new Promise((resolve) => {
    const delay = 1000 + Math.random() * 1000; // 1-2 seconds

    setTimeout(() => {
      // Mock opinion logic
      // TODO: Use LLM to evaluate whether comment aligns with wish
      const opinions = [
        'Advice in line with wish',
        'Advice not in line with wish',
        'Partially aligned advice'
      ];

      const randomIndex = Math.floor(Math.random() * opinions.length);
      const opinion = opinions[randomIndex];

      resolve({
        opinion,
        confidence: Math.round((60 + Math.random() * 35) * 100) / 100,
        analyzedAt: new Date().toISOString()
      });
    }, delay);
  });
}

module.exports = {
  processWish,
  getAgentOpinion,
  searchExternalSources
};
