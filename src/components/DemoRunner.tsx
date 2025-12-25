import { useState, useEffect } from "react";
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
  Code,
  History,
  Clock,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CodeBlock from "./CodeBlock";
import { getDemoEndpoint, getPayloadForDemo, formatDemoOutput, getInputPreview } from "./DemoRunnerHelpers";
import WorkflowDiagram from "./WorkflowDiagram";
import ReactMarkdown from "react-markdown";

interface DemoRun {
  id: string;
  demo_id: string;
  demo_title: string;
  input_payload: any;
  output_data: any;
  execution_mode: string;
  model_used: string;
  created_at: string;
}

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
  const [previousRuns, setPreviousRuns] = useState<DemoRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedRun, setSelectedRun] = useState<DemoRun | null>(null);

  const pythonCode = generatePythonCode(demo.id);

  // Load previous runs on mount
  useEffect(() => {
    loadPreviousRuns();
  }, [demo.id]);

  const loadPreviousRuns = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('demo_runs')
        .select('*')
        .eq('demo_id', demo.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading previous runs:', error);
      } else {
        setPreviousRuns(data || []);
      }
    } catch (error) {
      console.error('Error loading previous runs:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveRun = async (outputData: any, payload: any, mode: string) => {
    try {
      const { error } = await supabase
        .from('demo_runs')
        .insert({
          demo_id: demo.id,
          demo_title: demo.title,
          input_payload: payload,
          output_data: outputData,
          execution_mode: mode,
          model_used: outputData.model_used || 'claude-sonnet-4-20250514'
        });

      if (error) {
        console.error('Error saving run:', error);
      } else {
        // Reload history to show new run
        loadPreviousRuns();
      }
    } catch (error) {
      console.error('Error saving run:', error);
    }
  };

  const loadRun = (run: DemoRun) => {
    setSelectedRun(run);
    const formattedOutput = formatDemoOutput(run.demo_id, run.output_data);
    setOutput([
      `📂 Loaded saved run from ${new Date(run.created_at).toLocaleString()}`,
      `🔧 Mode: ${run.execution_mode === 'cloud' ? 'Cloud Backend' : 'Local'}`,
      `🤖 Model: Claude (${run.model_used || 'claude-sonnet-4-20250514'})`,
      ``,
      formattedOutput
    ]);
    toast.success("Loaded previous run");
  };

  const runDemo = async () => {
    setSelectedRun(null);
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
      
      const outputData = {
        result,
        model_used: 'claude-sonnet-4-20250514',
        timestamp: new Date().toISOString()
      };

      // Save the run
      await saveRun(outputData, payload, 'local');
      
      setOutput(prev => [...prev, `✓ <success>Analysis complete!</success>`, `🤖 Model: Claude Sonnet 4`, ``, result]);
      toast.success("Demo completed and saved!");

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
      
      setOutput(prev => [...prev, `🔍 Analyzing with Claude AI...`]);
      
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

      // Save the run
      await saveRun(data, payload, 'cloud');

      setOutput(prev => [...prev, `✓ <success>Analysis complete!</success>`, `🤖 Model: Claude (${data.model_used || 'claude-sonnet-4-20250514'})`, ``, formatDemoOutput(demo.id, data)]);
      toast.success("Demo completed and saved!");
      
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="inputs">
            <Eye className="w-4 h-4 mr-2" />
            Inputs
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Workflow className="w-4 h-4 mr-2" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="run">
            <Terminal className="w-4 h-4 mr-2" />
            Run Demo
          </TabsTrigger>
          <TabsTrigger value="source">
            <Code2 className="w-4 h-4 mr-2" />
            Source
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <History className="w-5 h-5 mr-2 text-primary" />
                Previous Runs
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPreviousRuns}
                disabled={isLoadingHistory}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : previousRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No previous runs found.</p>
                <p className="text-sm">Run the demo to save results here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {previousRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedRun?.id === run.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => loadRun(run)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{formatTimestamp(run.created_at)}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              run.execution_mode === 'cloud' ? 'bg-primary/20 text-primary' : 'bg-secondary'
                            }`}>
                              {run.execution_mode === 'cloud' ? '☁️ Cloud' : '🖥️ Local'}
                            </span>
                            <span>Claude ({run.model_used || 'claude-sonnet-4-20250514'})</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {output.length > 0 && (
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-card z-10 pb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <Terminal className="w-5 h-5 mr-2 text-primary" />
                  {selectedRun ? 'Loaded Output' : 'Latest Output'}
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
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm space-y-1 max-h-[60vh] overflow-y-auto">
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
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-code:bg-slate-200 prose-code:text-slate-900 dark:prose-code:bg-slate-700 dark:prose-code:text-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-200 dark:prose-pre:bg-slate-800 prose-pre:text-slate-900 dark:prose-pre:text-slate-100">
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
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-card z-10 pb-2">
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
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm space-y-1 max-h-[60vh] overflow-y-auto">
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
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-code:bg-slate-200 prose-code:text-slate-900 dark:prose-code:bg-slate-700 dark:prose-code:text-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-200 dark:prose-pre:bg-slate-800 prose-pre:text-slate-900 dark:prose-pre:text-slate-100">
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
      return `You are a platform engineering diagnostic agent powered by Claude. 
    
A CI/CD workflow has failed with the following error:

${payload.errorLog}

Workflow Context:
${payload.workflowContext}

Please provide:
1. Root cause analysis
2. Step-by-step fix recommendations
3. Prevention strategies for future occurrences

Format your response as structured analysis with clear sections. Do not mention or reference any AI model names like Gemini in your response.`;

    case "release-readiness":
      return `You are a release readiness evaluation agent powered by Claude.

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

Be specific and actionable. Do not mention or reference any AI model names like Gemini in your response.`;

    case "multi-agent":
      return `You are coordinating multiple agents (powered by Claude) to balance cost and reliability.

Infrastructure State:
${JSON.stringify(payload.infrastructureState, null, 2)}

Provide a comprehensive analysis covering:
1. Cost optimization opportunities
2. Reliability impact assessment
3. Balanced recommendations
4. Implementation plan

Do not mention or reference any AI model names like Gemini in your response.`;

    case "developer-portal":
      return `You are an intelligent developer portal agent powered by Claude.

Developer Context:
${JSON.stringify(payload.developerContext, null, 2)}

Developer Query: ${payload.query}

Provide:
1. Clear, actionable answer
2. Code examples if applicable
3. Next steps as a task list

Do not mention or reference any AI model names like Gemini in your response.`;

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
# Model: Claude Sonnet 4 (claude-sonnet-4-20250514)

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
