import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fmbdbzptumkphheqhrgt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYmRienB0dW1rcGhoZXFocmd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODIyNCwiZXhwIjoyMDcwNDk0MjI0fQ.ThGeYUgia-MCeRMrrUnbdmQGPGrIklOnZG1xvkBT6AU'
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY || 'rzp_test_apasTFRm3P1Vuw',
  key_secret: process.env.RAZORPAY_API_SECRET || '54jzFLHUd691JvZiB0Bwoa0B'
});

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tournamentId, userDetails } = JSON.parse(event.body);

    console.log('📋 Payment order request received:', { tournamentId, userDetails });

    // Validate required fields
    if (!tournamentId || !userDetails) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Tournament ID and user details are required' })
      };
    }

    // Validate user details
    const requiredFields = ['name', 'age', 'gameId', 'gameUsername', 'phone', 'email'];
    for (const field of requiredFields) {
      if (!userDetails[field]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: `${field} is required` })
        };
      }
    }

    console.log('✅ Input validation passed');

    // Get tournament details - Handle demo tournament
    let tournament;
    if (tournamentId === 'netlify-demo-tournament' || tournamentId === 'demo-tournament' || tournamentId === 'current-tournament') {
      console.log('🎮 Using demo tournament data');
      tournament = {
        id: tournamentId,
        title: 'Free Fire Championship',
        entry_fee: 75,
        available_seats: 48,
        total_seats: 48
      };
    } else {
      console.log('🔍 Fetching tournament from database:', tournamentId);
      const { data: dbTournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error('❌ Tournament fetch error:', tournamentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Tournament not found' })
        };
      }
      
      tournament = dbTournament;
    }

    console.log('✅ Tournament data:', tournament);

    // Check if seats available
    if (tournament.available_seats <= 0) {
      console.error('❌ No seats available');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'No seats available for this tournament' })
      };
    }

    console.log('💰 Creating Razorpay order...');
    
    // Create Razorpay order with proper receipt format (max 40 chars)
    const receiptId = `T${tournamentId.slice(-10)}_${Date.now().toString().slice(-8)}`;
    const options = {
      amount: tournament.entry_fee * 100, // Convert to paise
      currency: 'INR',
      receipt: receiptId, // Keep under 40 characters
      notes: {
        tournament_id: tournamentId,
        user_email: userDetails.email,
        user_name: userDetails.name
      }
    };

    console.log('💳 Razorpay order options:', options);
    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order.id);

    // Store temporary registration data (will be confirmed after payment)
    const registrationData = {
      tournament_id: tournamentId,
      user_name: userDetails.name,
      age: parseInt(userDetails.age),
      game_id: userDetails.gameId,
      game_username: userDetails.gameUsername,
      phone_number: userDetails.phone,
      email: userDetails.email,
      razorpay_order_id: order.id,
      payment_status: 'pending',
      terms_accepted: userDetails.termsAccepted || false,
      refund_policy_accepted: userDetails.refundPolicyAccepted || false
    };

    console.log('💾 Creating registration record:', registrationData);
    
    try {
      // Try to save to database, fallback to demo mode
      let tempRegistration;
      
      try {
        const { data, error: regError } = await supabase
          .from('registrations')
          .insert(registrationData)
          .select()
          .single();

        if (regError) throw regError;
        tempRegistration = data;
        console.log('✅ Registration created successfully:', tempRegistration.id);
      } catch (dbError) {
        console.log('🔄 Database unavailable, using demo registration...');
        tempRegistration = {
          id: 'netlify-demo-reg-' + Date.now(),
          ...registrationData
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order,
          registrationId: tempRegistration.id
        })
      };

    } catch (dbError) {
      console.error('❌ Registration creation failed:', dbError);
      
      // Demo mode fallback
      console.log('🔄 Using demo registration...');
      const demoRegistration = {
        id: 'netlify-demo-reg-' + Date.now(),
        ...registrationData
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order,
          registrationId: demoRegistration.id
        })
      };
    }

  } catch (error) {
    console.error('❌ Payment order creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to create payment order: ' + error.message })
    };
  }
}
