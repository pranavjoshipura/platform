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
    const { errorLog, workflowContext, accessPassword } = await req.json();

    // Verify demo access password
    const DEMO_ACCESS_PASSWORD = Deno.env.get('DEMO_ACCESS_PASSWORD');
    if (!accessPassword || accessPassword !== DEMO_ACCESS_PASSWORD) {
      console.error('Invalid demo access password');
      return new Response(
        JSON.stringify({ error: 'Invalid demo access password. Please enter the correct password.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!errorLog) {
      return new Response(
        JSON.stringify({ error: 'errorLog is required' }),
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

    const prompt = `You are a platform engineering diagnostic agent. 
    
A CI/CD workflow has failed with the following error:

${errorLog}

Workflow Context:
${workflowContext || 'No additional context provided'}

Please provide:
1. Root cause analysis
2. Step-by-step fix recommendations
3. Prevention strategies for future occurrences

Format your response as structured analysis with clear sections.`;

    console.log('Calling Claude API...');
    
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
    const diagnosis = data.content?.[0]?.text || 'No diagnosis generated';

    console.log('Diagnosis generated successfully');

    return new Response(
      JSON.stringify({
        diagnosis,
        status: 'analyzed',
        model_used: CLAUDE_MODEL,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in workflow-diagnostic:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
