const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { infrastructureState, accessPassword } = await req.json();

    // Verify demo access password
    const DEMO_ACCESS_PASSWORD = Deno.env.get('DEMO_ACCESS_PASSWORD');
    if (!accessPassword || accessPassword !== DEMO_ACCESS_PASSWORD) {
      console.error('Invalid demo access password');
      return new Response(
        JSON.stringify({ error: 'Invalid demo access password. Please enter the correct password.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!infrastructureState) {
      return new Response(
        JSON.stringify({ error: 'infrastructureState is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const infraJson = JSON.stringify(infrastructureState, null, 2);

    console.log('Starting multi-agent coordination...');

    // Cost Optimizer Agent
    const costPrompt = `You are a cost optimization agent.
        
Analyze this infrastructure state and provide cost optimization recommendations:

${infraJson}

Focus on:
- Oversized resources
- Idle resources
- Better pricing models
- Regional cost differences

Be specific about potential savings in dollars per month.`;

    console.log('Calling Cost Optimizer Agent...');
    const costRecommendations = await callClaude(costPrompt, ANTHROPIC_API_KEY);

    // Incident Responder Agent
    const reliabilityPrompt = `You are an incident response agent focused on system reliability.

Evaluate the reliability impact of these proposed changes:

${costRecommendations}

Current system state:
${infraJson}

Consider:
- Service availability impact
- Potential failure modes
- Rollback complexity
- Blast radius

Assess each proposed change and categorize risk as LOW, MEDIUM, or HIGH.`;

    console.log('Calling Incident Responder Agent...');
    const reliabilityAssessment = await callClaude(reliabilityPrompt, ANTHROPIC_API_KEY);

    // Synthesize recommendations
    const synthesisPrompt = `Synthesize these agent recommendations into a balanced final recommendation:

Cost Optimizer Analysis:
${costRecommendations}

Incident Responder Assessment:
${reliabilityAssessment}

Provide:
1. Which optimizations to APPROVE, which to hold, and which to reject
2. Expected monthly savings
3. Phased implementation plan
4. Key metrics to monitor

Balance cost savings with reliability requirements.`;

    console.log('Synthesizing final recommendations...');
    const finalRecommendation = await callClaude(synthesisPrompt, ANTHROPIC_API_KEY);

    console.log('Multi-agent coordination completed successfully');

    return new Response(
      JSON.stringify({
        cost_analysis: costRecommendations,
        reliability_assessment: reliabilityAssessment,
        final_recommendation: finalRecommendation,
        timestamp: new Date().toISOString(),
        model_used: 'claude-sonnet-4-20250514'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in multi-agent:', error);
    
    if (error instanceof Error && error.message.includes('429')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (error instanceof Error && error.message.includes('401')) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key. Please check your Anthropic API key.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
