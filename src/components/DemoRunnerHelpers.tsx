// Helper functions for DemoRunner component

export function getDemoEndpoint(demoId: string): string {
  const endpoints: Record<string, string> = {
    "workflow-diagnostic": "workflow-diagnostic",
    "release-readiness": "release-readiness",
    "multi-agent": "multi-agent",
    "developer-portal": "developer-portal",
  };
  return endpoints[demoId] || "workflow-diagnostic";
}

export function getPayloadForDemo(demoId: string): any {
  switch (demoId) {
    case "workflow-diagnostic":
      return {
        errorLog: `Error: Terraform apply failed
│ Error: Error creating S3 bucket: BucketAlreadyExists: 
│ The requested bucket name is not available
│ 
│   with aws_s3_bucket.data_lake,
│   on main.tf line 15, in resource "aws_s3_bucket" "data_lake":
│   15: resource "aws_s3_bucket" "data_lake" {`,
        workflowContext: `Repository: infrastructure/terraform
Branch: main
Triggered by: push event
Environment: production
Last successful run: 2 days ago`
      };

    case "release-readiness":
      return {
        qualityMetrics: {
          test_coverage: 85.2,
          performance: {
            avg_response_time_ms: 180,
            p95_response_time_ms: 250,
            p99_response_time_ms: 420
          },
          security: {
            critical_vulnerabilities: 0,
            high_vulnerabilities: 2,
            medium_vulnerabilities: 5,
            last_scan: "2025-01-14T10:30:00Z"
          },
          code_quality: {
            maintainability_score: 75,
            technical_debt_hours: 12,
            code_smells: 8
          },
          deployment_history: {
            last_deployment: "2025-01-12T14:00:00Z",
            success_rate_30d: 94.5,
            rollback_count_30d: 2
          }
        }
      };

    case "multi-agent":
      return {
        infrastructureState: {
          compute: [
            {
              type: "m5.2xlarge",
              utilization: "25%",
              region: "us-east-1",
              monthly_cost: 280,
              purpose: "api-server"
            },
            {
              type: "m5.xlarge",
              utilization: "80%",
              region: "us-west-2",
              monthly_cost: 140,
              purpose: "worker-node"
            }
          ],
          databases: [
            {
              type: "db.r5.large",
              connections: 50,
              capacity: 1000,
              monthly_cost: 360,
              utilization: "45%"
            }
          ],
          storage: {
            s3_usage_gb: 1200,
            monthly_cost: 28
          },
          uptime_sla: "99.9%",
          monthly_total_cost: 808
        }
      };

    case "developer-portal":
      return {
        query: "How do I deploy a new microservice to our staging environment?",
        developerContext: {
          name: "Alex",
          experience_level: "intermediate",
          team: "backend",
          tech_stack: ["Python", "Kubernetes", "PostgreSQL"],
          role: "Software Engineer"
        }
      };

    default:
      return {};
  }
}

export function formatDemoOutput(demoId: string, data: any): string {
  if (!data) return "No output received";

  const modelInfo = data.model_used || "claude-sonnet-4-20250514";

  switch (demoId) {
    case "workflow-diagnostic":
      return `📊 Diagnosis Summary:\n\n${data.diagnosis}\n\n✅ Analysis complete! (Model: ${modelInfo})`;

    case "release-readiness":
      return `🎯 Release Evaluation:\n\n${data.evaluation}\n\n✅ Evaluation complete! (Model: ${modelInfo})`;

    case "multi-agent":
      return `🤝 Multi-Agent Coordination Results:\n\n` +
        `💰 Cost Optimizer Analysis:\n${data.cost_analysis}\n\n` +
        `⚠️  Incident Responder Assessment:\n${data.reliability_assessment}\n\n` +
        `✅ Final Recommendation:\n${data.final_recommendation}\n\n` +
        `(Model: ${modelInfo})`;

    case "developer-portal":
      return `👋 Developer Portal Response:\n\n${data.response}\n\n✅ Response generated! (Model: ${modelInfo})`;

    default:
      return JSON.stringify(data, null, 2);
  }
}

export function getInputPreview(demoId: string): JSX.Element {
  switch (demoId) {
    case "workflow-diagnostic":
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">📋 Failed CI/CD Workflow</h4>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap">
{`Error: Terraform apply failed
│ Error: Error creating S3 bucket: BucketAlreadyExists: 
│ The requested bucket name is not available
│ 
│   with aws_s3_bucket.data_lake,
│   on main.tf line 15, in resource "aws_s3_bucket" "data_lake":
│   15: resource "aws_s3_bucket" "data_lake" {`}
              </pre>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">🔍 Workflow Context</h4>
            <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
              <div><strong>Repository:</strong> infrastructure/terraform</div>
              <div><strong>Branch:</strong> main</div>
              <div><strong>Triggered by:</strong> push event</div>
              <div><strong>Environment:</strong> production</div>
              <div><strong>Last successful run:</strong> 2 days ago</div>
            </div>
          </div>
        </div>
      );

    case "release-readiness":
      return (
        <div className="space-y-4">
          <h4 className="font-semibold mb-3">📊 Existing Quality Gates</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="font-semibold mb-2">✅ Test Coverage</div>
              <div className="text-2xl font-bold text-success">85.2%</div>
              <div className="text-xs text-muted-foreground">Threshold: 80% (Passing)</div>
            </div>
            
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="font-semibold mb-2">⚠️ Performance</div>
              <div className="text-sm space-y-1">
                <div>Avg: <span className="font-bold text-success">180ms ✓</span></div>
                <div>P95: <span className="font-bold text-warning">250ms ⚠️</span></div>
                <div>P99: <span className="font-bold text-destructive">420ms ✗</span></div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Target: &lt;200ms</div>
            </div>
            
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="font-semibold mb-2">🔒 Security</div>
              <div className="text-sm space-y-1">
                <div>Critical: <span className="font-bold text-success">0 ✓</span></div>
                <div>High: <span className="font-bold">2</span></div>
                <div>Medium: <span className="font-bold">5</span></div>
              </div>
            </div>
            
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="font-semibold mb-2">📝 Code Quality</div>
              <div className="text-2xl font-bold text-success">75</div>
              <div className="text-xs text-muted-foreground">Maintainability (Target: &gt;70)</div>
            </div>
          </div>
        </div>
      );

    case "multi-agent":
      return (
        <div className="space-y-4">
          <h4 className="font-semibold mb-3">🏗️ Current Infrastructure State</h4>
          
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-4">
              <div className="font-semibold mb-2">💻 Compute Resources</div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between p-2 bg-destructive/10 rounded">
                  <span>m5.2xlarge (api-server)</span>
                  <div className="text-right">
                    <div className="text-destructive font-bold">25% utilized</div>
                    <div className="text-xs">$280/month</div>
                  </div>
                </div>
                <div className="flex justify-between p-2 bg-success/10 rounded">
                  <span>m5.xlarge (worker)</span>
                  <div className="text-right">
                    <div className="text-success font-bold">80% utilized</div>
                    <div className="text-xs">$140/month</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="font-semibold mb-2">🗄️ Database</div>
              <div className="text-sm flex justify-between">
                <span>db.r5.large</span>
                <div className="text-right">
                  <div className="text-warning font-bold">45% utilized</div>
                  <div className="text-xs">$360/month</div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Monthly Cost:</span>
                <span className="text-2xl font-bold">$808</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">SLA: 99.9% uptime</div>
            </div>
          </div>
        </div>
      );

    case "developer-portal":
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">👤 Developer Context</h4>
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div><strong>Name:</strong> Alex</div>
              <div><strong>Experience:</strong> Intermediate</div>
              <div><strong>Team:</strong> Backend Engineering</div>
              <div><strong>Tech Stack:</strong> Python, Kubernetes, PostgreSQL</div>
              <div><strong>Role:</strong> Software Engineer</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">❓ Developer Query</h4>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm italic">"How do I deploy a new microservice to our staging environment?"</p>
            </div>
          </div>
        </div>
      );

    default:
      return <div className="text-muted-foreground">No input preview available for this demo</div>;
  }
}
