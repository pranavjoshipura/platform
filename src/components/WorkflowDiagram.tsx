import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";

interface WorkflowDiagramProps {
  demoId: string;
}

const WorkflowDiagram = ({ demoId }: WorkflowDiagramProps) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  const diagrams: Record<string, { title: string; diagram: string; legend: string[] }> = {
    "workflow-diagnostic": {
      title: "Workflow Diagnostic Agent Flow",
      diagram: `graph TD
    A[CI/CD Pipeline Running] -->|Failure Detected| B[🤖 Agent Triggered]
    B -->|Automatic| C[Collect Error Logs]
    C -->|Automatic| D[Gather Workflow Context]
    D -->|Automatic| E[Claude API Analysis]
    E -->|AI Reasoning| F[Root Cause Identified]
    F -->|Automatic| G[Generate Fix Recommendations]
    G -->|Automatic| H[Create Prevention Strategies]
    H -->|Manual Review| I[Engineer Reviews Analysis]
    I -->|Manual Action| J[Apply Fix]
    J --> K[Re-run Pipeline]
    
    style B fill:#4ade80,color:#0f172a
    style E fill:#60a5fa,color:#0f172a
    style I fill:#fbbf24,color:#0f172a
    style J fill:#fbbf24,color:#0f172a
    
    L[Before: Manual log diving, 30+ mins] -.->|vs| M[After: Automatic analysis, 2 mins]`,
      legend: [
        "🟢 Green: Automatic AI-powered steps",
        "🔵 Blue: AI reasoning/analysis",
        "🟡 Yellow: Manual intervention required",
        "📊 Before/After: Time savings comparison"
      ]
    },
    "release-readiness": {
      title: "Release Readiness Agent Flow",
      diagram: `graph TD
    A[Pull Request Opened] -->|Trigger| B[🤖 Quality Gate Agent]
    B -->|Automatic| C[Collect Test Coverage]
    B -->|Automatic| D[Gather Performance Metrics]
    B -->|Automatic| E[Run Security Scans]
    B -->|Automatic| F[Check Code Quality]
    
    C --> G[Aggregate All Metrics]
    D --> G
    E --> G
    F --> G
    
    G -->|Automatic| H[Claude API Evaluation]
    H -->|AI Reasoning| I{Decision Point}
    I -->|Deploy| J[✅ Approve Release]
    I -->|Hold| K[⏸️ Request Changes]
    I -->|Rollback| L[❌ Block Release]
    
    J -->|Manual Review| M[Engineering Approval]
    K -->|Manual Action| N[Developer Fixes Issues]
    L -->|Manual Review| O[Emergency Review]
    
    M --> P[Deploy to Production]
    N --> A
    
    style B fill:#4ade80,color:#0f172a
    style H fill:#60a5fa,color:#0f172a
    style I fill:#8b5cf6,color:#0f172a
    style M fill:#fbbf24,color:#0f172a
    style N fill:#fbbf24,color:#0f172a
    style O fill:#fbbf24,color:#0f172a
    
    Q[Before: 2-hour manual review meetings] -.->|vs| R[After: 5-min AI analysis + human decision]`,
      legend: [
        "🟢 Green: Automatic collection & triggering",
        "🔵 Blue: AI analysis with Claude",
        "🟣 Purple: AI decision point with reasoning",
        "🟡 Yellow: Human review & approval",
        "📊 Time Savings: 2 hours → 5 minutes"
      ]
    },
    "multi-agent": {
      title: "Multi-Agent Coordination Flow",
      diagram: `graph TD
    A[Infrastructure State Snapshot] -->|Input| B[Agent Orchestrator]
    
    B -->|Parallel| C[💰 Cost Optimizer Agent]
    B -->|Parallel| D[🛡️ Incident Responder Agent]
    
    C -->|Analyze| E[Identify Cost Savings]
    E --> F[Oversized Resources]
    E --> G[Idle Resources]
    E --> H[Pricing Optimizations]
    
    D -->|Assess| I[Reliability Impact]
    I --> J[Availability Risks]
    I --> K[Failure Modes]
    I --> L[Rollback Complexity]
    
    F --> M[Conflict Resolution Agent]
    G --> M
    H --> M
    J --> M
    K --> M
    L --> M
    
    M -->|Claude Synthesis| N{Balance Cost vs Reliability}
    N -->|Approve| O[✅ Low-Risk Optimizations]
    N -->|Conditional| P[⚠️ Staged Rollout]
    N -->|Reject| Q[❌ High-Risk Changes]
    
    O -->|Automatic| R[Apply Changes]
    P -->|Manual Review| S[Gradual Implementation]
    Q -->|Manual Override| T[Emergency Review]
    
    style C fill:#4ade80,color:#0f172a
    style D fill:#4ade80,color:#0f172a
    style M fill:#60a5fa,color:#0f172a
    style N fill:#8b5cf6,color:#0f172a
    style S fill:#fbbf24,color:#0f172a
    style T fill:#fbbf24,color:#0f172a
    
    U[Before: Siloed decisions, cost overruns OR outages] -.->|vs| V[After: Balanced AI coordination, 45% cost savings with 99.9% SLA]`,
      legend: [
        "🟢 Green: Specialized AI agents working in parallel",
        "🔵 Blue: Conflict resolution & synthesis",
        "🟣 Purple: Balanced decision making",
        "🟡 Yellow: Human oversight for staged changes",
        "💡 Key Insight: Multiple AI perspectives prevent one-sided optimization"
      ]
    },
    "developer-portal": {
      title: "Developer Portal Agent Flow",
      diagram: `graph TD
    A[Developer Question] -->|Query| B[🤖 Portal Agent]
    B -->|Automatic| C[Load Developer Context]
    C --> D[Experience Level]
    C --> E[Tech Stack]
    C --> F[Team Info]
    C --> G[Past Questions]
    
    D --> H[Claude API Analysis]
    E --> H
    F --> H
    G --> H
    
    H -->|AI Reasoning| I[Generate Personalized Answer]
    I --> J[Code Examples]
    I --> K[Documentation Links]
    I --> L[Task List]
    I --> M[Related Topics]
    
    J --> N[Deliver Response]
    K --> N
    L --> N
    M --> N
    
    N -->|Automatic| O[Developer Receives Help]
    O -->|Optional| P[Follow-up Questions]
    P --> B
    
    O -->|Manual Action| Q[Developer Implements Solution]
    Q -->|Success| R[✅ Task Complete]
    Q -->|Issues| P
    
    style B fill:#4ade80,color:#0f172a
    style H fill:#60a5fa,color:#0f172a
    style I fill:#8b5cf6,color:#0f172a
    style Q fill:#fbbf24,color:#0f172a
    
    S[Before: 2-day wait for platform team, context switching] -.->|vs| T[After: Instant AI help, self-service onboarding]`,
      legend: [
        "🟢 Green: Automatic context loading & analysis",
        "🔵 Blue: Claude-powered personalization",
        "🟣 Purple: Tailored response generation",
        "🟡 Yellow: Developer implements solution",
        "🔄 Loop: Conversational follow-ups supported",
        "⚡ Impact: 2-day wait → instant response"
      ]
    }
  };

  const config = diagrams[demoId] || diagrams["workflow-diagnostic"];

  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidRef.current) return;
      
      try {
        // Wait for mermaid to be available
        const waitForMermaid = (): Promise<any> => {
          return new Promise((resolve) => {
            const check = () => {
              if (typeof (window as any).mermaid !== 'undefined') {
                resolve((window as any).mermaid);
              } else {
                setTimeout(check, 50);
              }
            };
            check();
          });
        };
        
        const mermaid = await waitForMermaid();
        
        // Clear any previous content
        mermaidRef.current.innerHTML = '';
        mermaidRef.current.removeAttribute('data-processed');
        
        // Generate unique ID
        const uniqueId = `mermaid-${demoId}-${Date.now()}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, config.diagram);
        
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `
            <div class="text-destructive p-4">
              <p class="font-semibold">Error rendering diagram</p>
              <p class="text-sm mt-2">Please refresh the page to try again.</p>
            </div>
          `;
        }
      }
    };
    
    // Small delay to ensure component is mounted
    const timeoutId = setTimeout(renderMermaid, 100);
    return () => clearTimeout(timeoutId);
  }, [demoId, config.diagram]);

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Visualizing the agent workflow: automatic triggers, AI reasoning, and manual interventions
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 overflow-x-auto">
        <div ref={mermaidRef} className="mermaid" />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Legend:</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {config.legend.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default WorkflowDiagram;
