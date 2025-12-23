import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Download, 
  X, 
  Terminal, 
  Code2,
  Loader2,
  Eye,
  Workflow,
  FileText,
  Code
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CodeBlock from "./CodeBlock";
import { getDemoEndpoint, getPayloadForDemo, formatDemoOutput, getInputPreview } from "./DemoRunnerHelpers";
import WorkflowDiagram from "./WorkflowDiagram";
import ReactMarkdown from "react-markdown";

interface DemoRunnerProps {
  demo: {
    id: string;
    title: string;
    description: string;
    pythonFile: string;
  };
  onClose: () => void;
}

const DemoRunner = ({ demo, onClose }: DemoRunnerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [executionMode, setExecutionMode] = useState<"cloud" | "local">("cloud");
  const [localApiKey, setLocalApiKey] = useState("");
  const [viewMode, setViewMode] = useState<"raw" | "formatted">("raw");
  const [demoPassword, setDemoPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  const pythonCode = generatePythonCode(demo.id);

  const runDemo = async () => {
    if (executionMode === "local") {
      runLocalDemo();
    } else {
      runCloudDemo();
    }
  };

  const runLocalDemo = async () => {
    if (!localApiKey) {
      toast.error("Please enter your Anthropic API key for local execution");
      return;
    }

    setIsRunning(true);
    setOutput([
      `🏠 Running locally with direct Claude API...`,
      `📡 Connecting to Claude...`
    ]);

    try {
      const payload = getPayloadForDemo(demo.id);
      const prompt = generatePromptForDemo(demo.id, payload);
      
      setOutput(prev => [...prev, `🔍 Analyzing with Claude Sonnet 4...`]);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': localApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        
        if (response.status === 429) {
          toast.error('Rate limit exceeded');
          setOutput(prev => [...prev, '❌ <error>Error: Rate limit exceeded</error>']);
        } else if (response.status === 401) {
          toast.error('Invalid API key');
          setOutput(prev => [...prev, '❌ <error>Error: Invalid API key</error>']);
        } else {
          toast.error('Claude API error');
          setOutput(prev => [...prev, `❌ <error>Error: ${errorText}</error>`]);
        }
        setIsRunning(false);
        return;
      }

      const data = await response.json();
      const result = data.content?.[0]?.text || 'No response generated';
      
      setOutput(prev => [...prev, `✓ <success>Analysis complete!</success>`, ``, result]);
      toast.success("Demo completed successfully!");

    } catch (error) {
      console.error('Error running local demo:', error);
      toast.error('An unexpected error occurred');
      setOutput(prev => [...prev, `❌ <error>Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}</error>`]);
    } finally {
      setIsRunning(false);
    }
  };

  const runCloudDemo = async () => {
    if (!demoPassword) {
      toast.error("Please enter the demo access password");
      return;
    }

    setIsRunning(true);
    setOutput([`🚀 Initializing ${demo.title}...`, `🔐 Verifying access...`, `📡 Calling backend...`]);
    
    try {
      const payload = getPayloadForDemo(demo.id);
      const endpoint = getDemoEndpoint(demo.id);
      
      setOutput(prev => [...prev, `🔍 Analyzing with AI...`]);
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { ...payload, accessPassword: demoPassword }
      });

      if (error) {
        console.error('Edge function error:', error);
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
          setOutput(prev => [...prev, '❌ <error>Error: Rate limit exceeded</error>']);
        } else if (error.message.includes('402')) {
          toast.error('AI credits exhausted.');
          setOutput(prev => [...prev, '❌ <error>Error: AI credits exhausted</error>']);
        } else {
          toast.error('Failed to run demo: ' + error.message);
          setOutput(prev => [...prev, `❌ <error>Error: ${error.message}</error>`]);
        }
        setIsRunning(false);
        return;
      }

      setOutput(prev => [...prev, `✓ <success>Analysis complete!</success>`, ``, formatDemoOutput(demo.id, data)]);
      toast.success("Demo completed successfully!");
      
    } catch (error) {
      console.error('Error running demo:', error);
      toast.error('An unexpected error occurred');
      setOutput(prev => [...prev, '❌ <error>Unexpected error occurred</error>']);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadSource = () => {
    const blob = new Blob([pythonCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = demo.pythonFile;
    a.click();
    toast.success(`Downloaded ${demo.pythonFile}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{demo.title}</h2>
          <p className="text-muted-foreground">{demo.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs">
            <Eye className="w-4 h-4 mr-2" />
            Inputs
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Workflow className="w-4 h-4 mr-2" />
            Agentic Workflow
          </TabsTrigger>
          <TabsTrigger value="run">
            <Terminal className="w-4 h-4 mr-2" />
            Agent Execution
          </TabsTrigger>
          <TabsTrigger value="source">
            <Code2 className="w-4 h-4 mr-2" />
            Source
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-primary" />
              Demo Inputs Preview
            </h3>
            {getInputPreview(demo.id)}
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <WorkflowDiagram demoId={demo.id} />
        </TabsContent>

        <TabsContent value="run" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="mode">Execution Mode</Label>
                <Select value={executionMode} onValueChange={(v) => setExecutionMode(v as "cloud" | "local")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">☁️ Cloud Backend</SelectItem>
                    <SelectItem value="local">🖥️ Local Machine (Direct API)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {executionMode === "cloud" 
                    ? "Uses cloud backend functions with secure API key storage" 
                    : "⚠️ Runs directly from your browser - requires your API key"}
                </p>
              </div>

              {executionMode === "local" && (
                <div>
                  <Label htmlFor="localApiKey">Anthropic API Key</Label>
                  <Input
                    id="localApiKey"
                    type="password"
                    placeholder="sk-ant-..."
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-destructive mt-1">
                    ⚠️ Warning: API key will be sent directly from your browser to Anthropic
                  </p>
                </div>
              )}

              {executionMode === "cloud" && (
                <div>
                  <Label htmlFor="demoPassword">Demo Access Password</Label>
                  <Input
                    id="demoPassword"
                    type="password"
                    placeholder="Enter password provided by instructor"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    🔐 Required to use cloud-hosted API key
                  </p>
                </div>
              )}

              <Button
                onClick={runDemo}
                disabled={isRunning || (executionMode === "local" && !localApiKey) || (executionMode === "cloud" && !demoPassword)}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Demo
                  </>
                )}
              </Button>
            </div>
          </Card>

          {output.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Terminal className="w-5 h-5 mr-2 text-primary" />
                  Output
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "raw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("raw")}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Raw
                  </Button>
                  <Button
                    variant={viewMode === "formatted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("formatted")}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Formatted
                  </Button>
                </div>
              </div>
              
              {viewMode === "raw" ? (
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                  {output.map((line, index) => (
                    <div 
                      key={index} 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: line
                          .replace(/<error>(.*?)<\/error>/g, '<span class="text-destructive font-bold">$1</span>')
                          .replace(/<success>(.*?)<\/success>/g, '<span class="text-success font-bold">$1</span>')
                          .replace(/<warning>(.*?)<\/warning>/g, '<span class="text-warning font-bold">$1</span>')
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-6 max-h-96 overflow-y-auto">
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-code:text-slate-900 dark:prose-code:text-slate-100">
                    <ReactMarkdown>
                      {output
                        .join('\n')
                        .replace(/<error>(.*?)<\/error>/g, '**❌ Error: $1**')
                        .replace(/<success>(.*?)<\/success>/g, '**✅ $1**')
                        .replace(/<warning>(.*?)<\/warning>/g, '**⚠️ $1**')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="source" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Python Source Code</h3>
              <Button onClick={downloadSource} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download {demo.pythonFile}
              </Button>
            </div>
            <CodeBlock code={pythonCode} language="python" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function generatePromptForDemo(demoId: string, payload: any): string {
  switch (demoId) {
    case "workflow-diagnostic":
      return `You are a platform engineering diagnostic agent. 
    
A CI/CD workflow has failed with the following error:

${payload.errorLog}

Workflow Context:
${payload.workflowContext}

Please provide:
1. Root cause analysis
2. Step-by-step fix recommendations
3. Prevention strategies for future occurrences

Format your response as structured analysis with clear sections.`;

    case "release-readiness":
      return `You are a release readiness evaluation agent.

Analyze the following quality metrics and provide a release decision:

${JSON.stringify(payload.qualityMetrics, null, 2)}

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

    case "multi-agent":
      return `You are coordinating multiple agents to balance cost and reliability.

Infrastructure State:
${JSON.stringify(payload.infrastructureState, null, 2)}

Provide a comprehensive analysis covering:
1. Cost optimization opportunities
2. Reliability impact assessment
3. Balanced recommendations
4. Implementation plan`;

    case "developer-portal":
      return `You are an intelligent developer portal agent.

Developer Context:
${JSON.stringify(payload.developerContext, null, 2)}

Developer Query: ${payload.query}

Provide:
1. Clear, actionable answer
2. Code examples if applicable
3. Next steps as a task list`;

    default:
      return "";
  }
}

function generatePythonCode(demoId: string): string {
  const commonNote = `# NOTE: This Python code shows the traditional approach using Anthropic API directly.
# The web demo can run in two modes:
# 1. Cloud Backend - Uses secure backend functions (recommended)
# 2. Local Machine - Direct API calls from your local environment
# 
# To run this Python script on your local machine, you'll need: pip install anthropic

`;

  const commonImports = `import os
import anthropic
import json
from typing import Dict, List, Any

# Initialize Claude client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
`;

  switch (demoId) {
    case "workflow-diagnostic":
      return `${commonNote}${commonImports}
def diagnose_workflow_failure(error_log: str, workflow_context: str) -> Dict[str, Any]:
    """
    Diagnoses failed CI/CD workflows using Claude to analyze logs and provide fixes.
    
    Args:
        error_log: The error output from the failed workflow
        workflow_context: Additional context about the workflow (config, environment, etc.)
    
    Returns:
        Dictionary containing root cause analysis and suggested fixes
    """
    
    prompt = f"""You are a platform engineering diagnostic agent. 
    
A CI/CD workflow has failed with the following error:

{error_log}

Workflow Context:
{workflow_context}

Please provide:
1. Root cause analysis
2. Step-by-step fix recommendations
3. Prevention strategies for future occurrences

Format your response as structured analysis."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "diagnosis": message.content[0].text,
        "status": "analyzed",
        "model_used": "claude-sonnet-4-20250514"
    }

if __name__ == "__main__":
    # Example usage
    sample_error = """
    Error: Terraform apply failed
    │ Error: Error creating S3 bucket: BucketAlreadyExists: 
    │ The requested bucket name is not available
    """
    
    sample_context = """
    Repository: infrastructure/terraform
    Branch: main
    Triggered by: push event
    Environment: production
    """
    
    result = diagnose_workflow_failure(sample_error, sample_context)
    print(json.dumps(result, indent=2))
`;

    case "release-readiness":
      return `${commonNote}${commonImports}
def evaluate_release_readiness(quality_metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates release readiness based on quality metrics and provides intelligent decisions.
    
    Args:
        quality_metrics: Dictionary containing test coverage, performance, security, and code quality metrics
    
    Returns:
        Dictionary containing release decision, confidence score, and detailed rationale
    """
    
    prompt = f"""You are a release readiness evaluation agent.

Analyze the following quality metrics and provide a release decision:

{json.dumps(quality_metrics, indent=2)}

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

Be specific and actionable."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "evaluation": message.content[0].text,
        "status": "evaluated",
        "model_used": "claude-sonnet-4-20250514"
    }

if __name__ == "__main__":
    # Example usage
    sample_metrics = {
        "testCoverage": 78,
        "performanceScore": 92,
        "securityScan": "2 medium vulnerabilities",
        "codeQuality": 75
    }
    
    result = evaluate_release_readiness(sample_metrics)
    print(json.dumps(result, indent=2))
`;

    case "multi-agent":
      return `${commonNote}${commonImports}
def coordinate_agents(infrastructure_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Coordinates multiple agents (cost optimizer and incident responder) to balance efficiency and reliability.
    
    Args:
        infrastructure_state: Dictionary containing current infrastructure metrics
    
    Returns:
        Dictionary containing balanced recommendations from both agents
    """
    
    prompt = f"""You are coordinating multiple agents to balance cost and reliability.

Infrastructure State:
{json.dumps(infrastructure_state, indent=2)}

Provide a comprehensive analysis covering:
1. Cost optimization opportunities
2. Reliability impact assessment
3. Balanced recommendations
4. Implementation plan

Consider both cost efficiency and system reliability."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "coordination": message.content[0].text,
        "status": "coordinated",
        "model_used": "claude-sonnet-4-20250514"
    }

if __name__ == "__main__":
    # Example usage
    sample_state = {
        "totalMonthlyCost": 45000,
        "oversizedResources": ["db-prod-1", "cache-cluster-2"],
        "idleResources": ["staging-env-3"],
        "uptime": "99.7%"
    }
    
    result = coordinate_agents(sample_state)
    print(json.dumps(result, indent=2))
`;

    case "developer-portal":
      return `${commonNote}${commonImports}
def handle_developer_query(developer_context: Dict[str, Any], query: str) -> Dict[str, Any]:
    """
    AI-driven developer portal that provides personalized guidance and onboarding.
    
    Args:
        developer_context: Dictionary containing developer's experience level, tech stack, team info
        query: The developer's question or request
    
    Returns:
        Dictionary containing personalized answer with code examples and next steps
    """
    
    prompt = f"""You are an intelligent developer portal agent.

Developer Context:
{json.dumps(developer_context, indent=2)}

Developer Query: {query}

Provide:
1. Clear, actionable answer
2. Code examples if applicable
3. Next steps as a task list

Tailor your response to the developer's experience level and tech stack."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "response": message.content[0].text,
        "status": "answered",
        "model_used": "claude-sonnet-4-20250514"
    }

if __name__ == "__main__":
    # Example usage
    sample_context = {
        "experienceLevel": "intermediate",
        "techStack": ["Python", "FastAPI", "PostgreSQL"],
        "team": "Backend Platform",
        "recentQueries": ["How to set up CI/CD?"]
    }
    
    sample_query = "How do I implement caching in our API?"
    
    result = handle_developer_query(sample_context, sample_query)
    print(json.dumps(result, indent=2))
`;

    default:
      return commonNote + commonImports + "\n# Demo-specific code...";
  }
}

export default DemoRunner;
