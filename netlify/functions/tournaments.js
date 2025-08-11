import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get tournaments
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .gte('tournament_date', new Date().toISOString())
        .order('tournament_date', { ascending: true });

      if (error) {
        // Return demo tournament if database is not set up
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            tournaments: [{
              id: 'netlify-demo-tournament',
              title: 'Free Fire Championship',
              description: 'Ultimate Free Fire tournament with exciting prizes',
              entry_fee: 75,
              total_seats: 48,
              available_seats: 48,
              tournament_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              prize_pool: { first: 1000, second: 700, third: 500, total: 2200 },
              status: 'upcoming'
            }]
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, tournaments })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Tournament API error:', error);
    
    // Return demo data on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tournaments: [{
          id: 'netlify-demo-tournament',
          title: 'Free Fire Championship',
          description: 'Ultimate Free Fire tournament with exciting prizes',
          entry_fee: 75,
          total_seats: 48,
          available_seats: 48,
          tournament_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          prize_pool: { first: 1000, second: 700, third: 500, total: 2200 },
          status: 'upcoming'
        }]
      })
    };
  }
}
