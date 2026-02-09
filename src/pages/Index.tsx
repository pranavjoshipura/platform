import { useState } from "react";
import { 
  Terminal, 
  GitBranch, 
  Shield, 
  Users,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import DemoRunner from "@/components/DemoRunner";

const Index = () => {
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const demos = [
    {
      id: "workflow-diagnostic",
      title: "Workflow Diagnostic Agent",
      description: "Automatically diagnoses failed CI/CD workflows and provides root cause analysis with suggested fixes.",
      icon: Terminal,
      color: "primary",
      problem: "Cryptic error messages in failed workflows waste developer time",
      solution: "Agent analyzes logs, context, and provides actionable explanations",
      pythonFile: "section1_diagnostic_agent.py",
    },
    {
      id: "release-readiness",
      title: "Release Readiness Agent",
      description: "Evaluates quality gates (test coverage, performance, security) to make intelligent release/rollback decisions.",
      icon: GitBranch,
      color: "tech-cyan",
      problem: "Binary pass/fail gates don't capture nuanced deployment risks",
      solution: "Contextual evaluation with confidence scores and full rationale",
      pythonFile: "section2_release_readiness.py",
    },
    {
      id: "multi-agent",
      title: "Multi-Agent Orchestration",
      description: "Cost optimizer and incident responder agents coordinate to balance efficiency with reliability.",
      icon: Users,
      color: "accent",
      problem: "Siloed optimization leads to cost overruns or service degradation",
      solution: "Specialized agents communicate and resolve conflicts intelligently",
      pythonFile: "section3_multi_agent.py",
    },
    {
      id: "developer-portal",
      title: "Developer Portal Agent",
      description: "AI-driven onboarding and self-service endpoint that understands developer needs and provides intelligent guidance.",
      icon: Shield,
      color: "tech-orange",
      problem: "Manual onboarding and documentation hunts slow developer productivity",
      solution: "Conversational AI provides personalized onboarding and context-aware help",
      pythonFile: "section4_developer_portal.py",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-glow opacity-30" />
        <div className="container relative mx-auto px-6 py-20">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Agentic AI in Platform Engineering
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Leverage AI agents to reason through platform engineering challenges. 
              Use Claude API with custom agents built in Python
            </p>
          </div>
        </div>
      </section>

      {/* Claude API Key Info Box */}
      {/*<section className="container mx-auto px-6 pt-16">*/}
      {/*  <Card className="bg-amber-500/10 border-amber-500/30 p-6">*/}
      {/*    <div className="flex items-start gap-4">*/}
      {/*      <div className="p-2 rounded-lg bg-amber-500/20">*/}
      {/*        <AlertCircle className="w-6 h-6 text-amber-500" />*/}
      {/*      </div>*/}
      {/*      <div className="space-y-2">*/}
      {/*        <h3 className="text-lg font-semibold text-amber-500">Claude API Key Required</h3>*/}
      {/*        <p className="text-muted-foreground">*/}
      {/*          To run these demos locally, you'll need your own Anthropic API key. The cloud-hosted demos use a protected key that is not exposed in the source code.*/}
      {/*        </p>*/}
      {/*        <div className="flex flex-col gap-1 text-sm">*/}
      {/*          <p className="text-muted-foreground">*/}
      {/*            <span className="font-medium text-foreground">Get your API key:</span>{" "}*/}
      {/*            <a */}
      {/*              href="https://console.anthropic.com/settings/keys" */}
      {/*              target="_blank" */}
      {/*              rel="noopener noreferrer"*/}
      {/*              className="text-primary hover:underline"*/}
      {/*            >*/}
      {/*              console.anthropic.com/settings/keys*/}
      {/*            </a>*/}
      {/*          </p>*/}
      {/*          <p className="text-muted-foreground">*/}
      {/*            <span className="font-medium text-foreground">Set environment variable:</span>{" "}*/}
      {/*            <code className="bg-muted px-2 py-0.5 rounded text-xs">export ANTHROPIC_API_KEY=your_key_here</code>*/}
      {/*          </p>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </Card>*/}
      {/*</section>*/}

      {/* Demos Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Interactive Demos</h2>
          <p className="text-muted-foreground">
            Each demo identifies and solves a specific platform engineering problem using Claude API
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 mb-16">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                AI Demos
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Platform Engineering
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72">
                  {demos.map((demo) => (
                    <DropdownMenuItem
                      key={demo.id}
                      onSelect={() => {
                        setSelectedDemo(demo.id);
                        setTimeout(() => {
                          document
                            .getElementById("demo-runner-section")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                    >
                      {demo.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedDemo && (
            <p className="text-sm text-muted-foreground">
              Selected: {demos.find((d) => d.id === selectedDemo)?.title}
            </p>
          )}
        </div>
      </section>

      {/* Demo Runner Section */}
      {selectedDemo && (
        <section id="demo-runner-section" className="container mx-auto px-6 py-16 border-t border-border">
          <DemoRunner
            demo={demos.find((d) => d.id === selectedDemo)!}
            onClose={() => setSelectedDemo(null)}
          />
        </section>
      )}
    </div>
  );
};

export default Index;
