const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLAUDE_MODEL = 'claude-3-haiku-20240307';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qualityMetrics, accessPassword } = await req.json();

    // Verify demo access password
    const DEMO_ACCESS_PASSWORD = Deno.env.get('DEMO_ACCESS_PASSWORD');
    if (!accessPassword || accessPassword !== DEMO_ACCESS_PASSWORD) {
      console.error('Invalid demo access password');
      return new Response(
        JSON.stringify({ error: 'Invalid demo access password. Please enter the correct password.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!qualityMetrics) {
      return new Response(
        JSON.stringify({ error: 'qualityMetrics is required' }),
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

    const metricsJson = JSON.stringify(qualityMetrics, null, 2);
    
    const prompt = `You are a release readiness evaluation agent.

Analyze the following quality metrics and provide a release decision:

${metricsJson}

Quality Gates:
- Test Coverage: Minimum 80% (Critical)
- Performance: Response time < 200ms (High)
- Security Scan: No critical vulnerabilities (Critical)
- Code Quality: Maintainability score > 70 (Medium)

Provide:
1. Overall release recommendation (Deploy/Rollback/Hold)
2. Confidence score (0-100%)
3. Detailed rationale for each quality gate
4. Risk assessment and mitigation strategies

Be specific and actionable.`;

    console.log('Calling Claude API for release evaluation...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key. Please check your Anthropic API key.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Claude API error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const evaluation = data.content?.[0]?.text || 'No evaluation generated';

    console.log('Release evaluation completed successfully');

    return new Response(
      JSON.stringify({
        evaluation,
        timestamp: new Date().toISOString(),
        model_used: CLAUDE_MODEL
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in release-readiness:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
