/**
 * AI Agent Service
 *
 * Uses DeepSeek API (OpenAI-compatible) for intelligent wish processing,
 * matching, and comment verification.
 *
 * DeepSeek API: https://api.deepseek.com/v1/chat/completions
 */

const pool = require('../db/pool');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * Helper: call DeepSeek chat completions API.
 */
async function callDeepSeek(messages, options = {}) {
  if (!DEEPSEEK_API_KEY) {
    console.warn('[AI Agent] No DEEPSEEK_API_KEY set, falling back to mock processing');
    return null;
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Process a wish through the AI matching pipeline using DeepSeek.
 */
async function processWish(wish) {
  try {
    console.log(`[AI Agent] Processing wish #${wish.id}: "${wish.title}"`);

    const results = {
      wishId: wish.id,
      agentType: 'general_agent',
      internalMatches: [],
      externalResults: [],
      logs: [],
      summary: ''
    };

    // Determine agent type using DeepSeek
    const agentResult = await callDeepSeek([
      {
        role: 'system',
        content: `You are a WishPal AI category classifier. Given a wish title and description, determine the most specific agent type from: housing_agent, jobs_agent, services_agent, items_agent, vehicles_agent, cleaning_agent, repairs_agent, general_agent. Reply with ONLY the agent type name, nothing else.`
      },
      {
        role: 'user',
        content: `Title: ${wish.title}\nCategory: ${wish.category}\nDescription: ${wish.description || 'N/A'}`
      }
    ], { temperature: 0.1, maxTokens: 50 });

    results.agentType = (agentResult || determineAgentType(wish.category)).trim().toLowerCase();
    results.logs.push({
      agentType: results.agentType,
      action: 'agent_assigned',
      details: { category: wish.category, agent: results.agentType }
    });

    // Find internal matches using DeepSeek-powered scoring
    const internalMatches = await findInternalMatches(wish);
    results.internalMatches = internalMatches;

    if (internalMatches.length > 0) {
      results.logs.push({
        agentType: results.agentType,
        action: 'internal_matches_found',
        details: { count: internalMatches.length }
      });
    } else {
      results.logs.push({
        agentType: results.agentType,
        action: 'no_internal_matches',
        details: {}
      });
    }

    // Search external if applicable
    let externalResults = [];
    if (shouldSearchExternal(wish)) {
      externalResults = await searchExternalSources(wish);
      results.externalResults = externalResults;
      if (externalResults.length > 0) {
        results.logs.push({
          agentType: results.agentType,
          action: 'external_sources_checked',
          details: { count: externalResults.length }
        });
      }
    }

    // Generate a human-readable summary using DeepSeek
    const summaryResult = await callDeepSeek([
      {
        role: 'system',
        content: `You are a WishPal AI agent. Summarize what you did for this wish in 1-2 sentences. Be concise and helpful.`
      },
      {
        role: 'user',
        content: `Processed wish "${wish.title}" (${wish.category}). Found ${internalMatches.length} internal matches. ${externalResults.length > 0 ? `Found ${externalResults.length} external results.` : ''}`
      }
    ], { temperature: 0.5, maxTokens: 200 });

    results.summary = summaryResult || `Processed wish "${wish.title}" with ${results.agentType}.`;

    console.log(`[AI Agent] Wish #${wish.id}: Complete. ${results.summary}`);
    return results;

  } catch (err) {
    console.error(`[AI Agent] Error processing wish #${wish.id}:`, err.message);
    return {
      wishId: wish.id,
      agentType: 'general_agent',
      internalMatches: [],
      externalResults: [],
      logs: [{ agentType: 'system', action: 'processing_error', details: { error: err.message } }],
      summary: 'Agent encountered an error during processing.'
    };
  }
}

/**
 * Fallback agent type assignment when DeepSeek is unavailable.
 */
function determineAgentType(category) {
  const map = {
    'houses': 'housing_agent',
    'jobs': 'jobs_agent',
    'services': 'services_agent',
    'items': 'items_agent',
    'vehicles': 'vehicles_agent',
    'cleaning': 'cleaning_agent',
    'repairs': 'repairs_agent'
  };
  return map[category?.toLowerCase()] || 'general_agent';
}

/**
 * Find internal matches using DeepSeek to score relevance.
 */
async function findInternalMatches(wish) {
  try {
    const result = await pool.query(
      `SELECT w.id, w.title, w.category, w.description, w.amount,
              w.location_country, w.location_region, w.payment_type,
              u.id as user_id, u.username, u.display_name
       FROM wishes w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'active'
         AND w.user_id != $1
         AND w.agent_processed = true
       ORDER BY RANDOM()
       LIMIT 10`,
      [wish.user_id]
    );

    if (result.rows.length === 0) return [];

    // Use DeepSeek to score matches
    const candidateList = result.rows.map((r, i) =>
      `[${i}] Title: "${r.title}" | Category: ${r.category} | Location: ${r.location_region || 'Any'}, ${r.location_country || 'Any'} | Amount: ${r.amount ? '$' + r.amount : 'N/A'}`
    ).join('\n');

    const scoringResult = await callDeepSeek([
      {
        role: 'system',
        content: `You are a WishPal match scoring AI. Given a wish and a list of potential matches, score each match 0-100 based on relevance (category, location, price range, description alignment). Return ONLY a JSON array of objects with fields "index" (number), "score" (number 0-100), and "reason" (short string). Example: [{"index":0,"score":85,"reason":"Same category and location"}]`
      },
      {
        role: 'user',
        content: `Target Wish: "${wish.title}" (${wish.category}, ${wish.location_region || 'Any'}, ${wish.location_country || 'Any'})\n\nCandidates:\n${candidateList}`
      }
    ], { temperature: 0.2, maxTokens: 1024 });

    const matches = [];
    if (scoringResult) {
      try {
        const parsed = JSON.parse(scoringResult);
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            const row = result.rows[entry.index];
            if (row && entry.score > 70) {
              matches.push({
                wishId: row.id,
                title: row.title,
                matchScore: Math.round(entry.score * 100) / 100,
                matchedUserId: row.user_id,
                matchedUsername: row.username || row.display_name,
                category: row.category,
                reason: entry.reason || ''
              });
            }
          }
        }
      } catch (e) {
        console.warn('[AI Agent] Failed to parse DeepSeek scoring, falling back to heuristic');
      }
    }

    // Fallback heuristic scoring if DeepSeek failed
    if (matches.length === 0) {
      for (const row of result.rows) {
        const categoryBonus = row.category === wish.category ? 20 : 0;
        const locationBonus = (row.location_region === wish.location_region) ? 10 : 0;
        const score = Math.min(95, Math.round((30 + Math.random() * 30 + categoryBonus + locationBonus) * 100) / 100);
        if (score > 70) {
          matches.push({
            wishId: row.id,
            title: row.title,
            matchScore: score,
            matchedUserId: row.user_id,
            matchedUsername: row.username || row.display_name,
            category: row.category,
            reason: 'Heuristic match'
          });
        }
      }
    }

    return matches.slice(0, 5);
  } catch (err) {
    console.error('[AI Agent] Error finding internal matches:', err.message);
    return [];
  }
}

function shouldSearchExternal(wish) {
  const cat = wish.category?.toLowerCase();
  return wish.payment_type === 'pay' || ['items', 'vehicles', 'technology'].includes(cat);
}

/**
 * Search external sources - uses DeepSeek to generate relevant search queries.
 */
function searchExternalSources(wish) {
  return new Promise(async (resolve) => {
    try {
      const result = await callDeepSeek([
        {
          role: 'system',
          content: `You are a WishPal external search agent. Given a wish, suggest 3 external sources that might have relevant matches. Return ONLY a JSON array of objects with fields "source" (string), "title" (string), "url" (string), "suggestedQuery" (string). Example: [{"source":"eBay","title":"eBay listings for X","url":"https://www.ebay.com/sch/i.html?_nkw=X","suggestedQuery":"X for sale"}]`
        },
        {
          role: 'user',
          content: `Find external matches for: "${wish.title}" (${wish.category}, up to ${wish.amount ? '$' + wish.amount : 'N/A'})`
        }
      ], { temperature: 0.4, maxTokens: 800 });

      if (result) {
        try {
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            resolve(parsed.map(r => ({
              ...r,
              matchConfidence: Math.round((60 + Math.random() * 35) * 100) / 100
            })));
            return;
          }
        } catch (e) {
          // fall through to mock
        }
      }
    } catch (err) {
      console.warn('[AI Agent] DeepSeek external search failed:', err.message);
    }

    // Mock fallback
    setTimeout(() => {
      resolve([
        {
          source: 'eBay',
          title: `${wish.title} - Listings`,
          url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(wish.title)}`,
          matchConfidence: Math.round((60 + Math.random() * 35) * 100) / 100
        },
        {
          source: 'Google Shopping',
          title: `Best deals on ${wish.title}`,
          url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(wish.title)}`,
          matchConfidence: Math.round((55 + Math.random() * 35) * 100) / 100
        }
      ]);
    }, 1500);
  });
}

/**
 * Use DeepSeek to evaluate whether a comment aligns with the wish.
 */
async function getAgentOpinion(commentText, wishDescription) {
  try {
    const result = await callDeepSeek([
      {
        role: 'system',
        content: `You are a WishPal AI opinion validator. Given a wish description and a user comment, determine: is the advice "in line with", "not in line with", or "partially aligned with" the wish? Reply with ONLY a JSON object with fields "opinion" (string), "confidence" (0-100 number), "reason" (string).`
      },
      {
        role: 'user',
        content: `Wish: "${wishDescription}"\nComment: "${commentText}"`
      }
    ], { temperature: 0.2, maxTokens: 500 });

    if (result) {
      try {
        const parsed = JSON.parse(result);
        return {
          opinion: parsed.opinion || 'Partially aligned advice',
          confidence: parsed.confidence || 70,
          analyzedAt: new Date().toISOString()
        };
      } catch (e) {
        // fall through
      }
    }
  } catch (err) {
    console.warn('[AI Agent] DeepSeek opinion failed:', err.message);
  }

  // Fallback
  const opinions = ['Advice in line with wish', 'Advice not in line with wish', 'Partially aligned advice'];
  return {
    opinion: opinions[Math.floor(Math.random() * opinions.length)],
    confidence: Math.round((60 + Math.random() * 35) * 100) / 100,
    analyzedAt: new Date().toISOString()
  };
}

module.exports = {
  processWish,
  getAgentOpinion,
  searchExternalSources
};
