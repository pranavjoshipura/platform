#!/usr/bin/env python3
"""
Segment 2: AI-Enhanced Quality Gates
Intelligent release/rollback decisions based on multiple metrics
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import random
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, Any, List, Optional

import click
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, BarColumn, TextColumn
from rich.markdown import Markdown

from ai_client import AIClient, AIProvider

console = Console()


@dataclass
class QualityMetrics:
    """Quality metrics from CI/CD pipeline"""
    code_coverage: float
    test_pass_rate: float
    performance_score: float
    security_score: float
    build_time: float
    bundle_size: float
    error_rate: float
    response_time: float
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def generate_random(cls, scenario: str = "normal"):
        """Generate random metrics for testing"""
        if scenario == "good":
            return cls(
                code_coverage=random.uniform(85, 95),
                test_pass_rate=random.uniform(98, 100),
                performance_score=random.uniform(90, 98),
                security_score=random.uniform(95, 100),
                build_time=random.uniform(60, 120),
                bundle_size=random.uniform(100, 200),
                error_rate=random.uniform(0, 0.5),
                response_time=random.uniform(50, 150)
            )
        elif scenario == "bad":
            return cls(
                code_coverage=random.uniform(60, 75),
                test_pass_rate=random.uniform(85, 95),
                performance_score=random.uniform(70, 85),
                security_score=random.uniform(80, 90),
                build_time=random.uniform(180, 300),
                bundle_size=random.uniform(300, 500),
                error_rate=random.uniform(2, 5),
                response_time=random.uniform(200, 500)
            )
        else:  # mixed
            return cls(
                code_coverage=random.uniform(75, 85),
                test_pass_rate=random.uniform(95, 99),
                performance_score=random.uniform(85, 92),
                security_score=random.uniform(90, 95),
                build_time=random.uniform(120, 180),
                bundle_size=random.uniform(200, 300),
                error_rate=random.uniform(0.5, 2),
                response_time=random.uniform(100, 200)
            )


@dataclass
class QualityThresholds:
    """Configurable quality gate thresholds"""
    min_coverage: float = 80.0
    min_test_pass: float = 95.0
    min_performance: float = 85.0
    min_security: float = 90.0
    max_build_time: float = 180.0
    max_bundle_size: float = 300.0
    max_error_rate: float = 1.0
    max_response_time: float = 200.0
    
    @classmethod
    def from_file(cls, path: Path):
        """Load thresholds from YAML file"""
        if path.exists():
            with open(path) as f:
                data = yaml.safe_load(f)
                return cls(**data)
        return cls()


class QualityGateAnalyzer:
    """AI-enhanced quality gate analyzer"""
    
    SYSTEM_PROMPT = """
You are an AI release manager making critical deployment decisions.
Given quality metrics and thresholds, you will:

1. Make a clear RELEASE or ROLLBACK decision
2. Provide risk assessment (LOW/MEDIUM/HIGH/CRITICAL)
3. List specific reasons for your decision (3-5 bullet points)
4. Recommend deployment strategy if releasing (canary %, blue-green, etc.)
5. Suggest immediate actions for the team
6. Identify trends and patterns if historical data provided

Consider:
- Customer impact of releasing vs not releasing
- Risk mitigation strategies
- Progressive rollout options
- Time of day/week considerations
- Dependencies and downstream effects

Format your response with clear sections and actionable recommendations.
"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        self.client = AIClient(provider)
        self.output_dir = Path("outputs/quality-gates")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.decision_history = []
    
    def analyze(
        self,
        metrics: QualityMetrics,
        thresholds: QualityThresholds,
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[QualityMetrics]] = None
    ) -> Dict[str, Any]:
        """
        Analyze metrics against thresholds and make release decision
        
        Args:
            metrics: Current quality metrics
            thresholds: Quality gate thresholds
            context: Additional context (service name, environment, etc.)
            history: Historical metrics for trend analysis
        
        Returns:
            Decision report with recommendations
        """
        
        # Check gate violations
        violations = []
        if metrics.code_coverage < thresholds.min_coverage:
            violations.append(f"Code coverage {metrics.code_coverage:.1f}% < {thresholds.min_coverage}%")
        if metrics.test_pass_rate < thresholds.min_test_pass:
            violations.append(f"Test pass rate {metrics.test_pass_rate:.1f}% < {thresholds.min_test_pass}%")
        if metrics.performance_score < thresholds.min_performance:
            violations.append(f"Performance score {metrics.performance_score:.1f} < {thresholds.min_performance}")
        if metrics.security_score < thresholds.min_security:
            violations.append(f"Security score {metrics.security_score:.1f} < {thresholds.min_security}")
        if metrics.build_time > thresholds.max_build_time:
            violations.append(f"Build time {metrics.build_time:.1f}s > {thresholds.max_build_time}s")
        if metrics.bundle_size > thresholds.max_bundle_size:
            violations.append(f"Bundle size {metrics.bundle_size:.1f}KB > {thresholds.max_bundle_size}KB")
        if metrics.error_rate > thresholds.max_error_rate:
            violations.append(f"Error rate {metrics.error_rate:.2f}% > {thresholds.max_error_rate}%")
        if metrics.response_time > thresholds.max_response_time:
            violations.append(f"Response time {metrics.response_time:.1f}ms > {thresholds.max_response_time}ms")
        
        # Prepare prompt
        context_str = ""
        if context:
            context_str = "\nDeployment Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"
        
        history_str = ""
        if history and len(history) > 0:
            history_str = "\nHistorical Trend (last 3 deployments):\n"
            for i, h in enumerate(history[-3:], 1):
                history_str += f"Deploy {i}: Coverage={h.code_coverage:.1f}%, Performance={h.performance_score:.1f}\n"
        
        user_prompt = f"""
{context_str}

Current Metrics:
{json.dumps(metrics.to_dict(), indent=2)}

Quality Gate Thresholds:
{json.dumps(asdict(thresholds), indent=2)}

Gate Violations:
{chr(10).join(violations) if violations else "None - All gates passed"}

{history_str}

Based on this data, should we RELEASE or ROLLBACK?
Provide detailed reasoning and specific recommendations.
"""
        
        # Get AI analysis
        response = self.client.ask(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1000,
            prompt_type="quality_gate"
        )
        
        # Create decision report
        decision_report = {
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics.to_dict(),
            "thresholds": asdict(thresholds),
            "violations": violations,
            "ai_analysis": response.text,
            "provider": response.provider.value,
            "model": response.model,
            "cost_estimate": response.cost_estimate,
            "context": context or {}
        }
        
        # Extract decision from AI response
        ai_text_lower = response.text.lower()
        if "release" in ai_text_lower and "rollback" not in ai_text_lower:
            decision_report["decision"] = "RELEASE"
            decision_report["decision_confidence"] = "HIGH" if not violations else "MEDIUM"
        elif "rollback" in ai_text_lower:
            decision_report["decision"] = "ROLLBACK"
            decision_report["decision_confidence"] = "HIGH" if violations else "MEDIUM"
        else:
            decision_report["decision"] = "HOLD"
            decision_report["decision_confidence"] = "LOW"
        
        # Save report
        report_file = self.output_dir / f"decision_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_file.write_text(json.dumps(decision_report, indent=2))
        
        # Add to history
        self.decision_history.append(decision_report)
        
        return decision_report
    
    def display_report(self, report: Dict[str, Any]):
        """Display decision report with formatting"""
        
        # Decision header with color coding
        decision = report.get("decision", "UNKNOWN")
        confidence = report.get("decision_confidence", "LOW")
        
        if decision == "RELEASE":
            color = "green"
            emoji = "✅"
        elif decision == "ROLLBACK":
            color = "red"
            emoji = "❌"
        else:
            color = "yellow"
            emoji = "⚠️"
        
        console.print(Panel(
            f"[bold {color}]{emoji} Decision: {decision}[/bold {color}]\n"
            f"Confidence: {confidence}\n"
            f"Time: {report['timestamp']}",
            title="🚀 Quality Gate Decision",
            border_style=color
        ))
        
        # Metrics table
        table = Table(title="Quality Metrics vs Thresholds")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")
        table.add_column("Threshold", style="yellow")
        table.add_column("Status", style="white")
        
        metrics = report["metrics"]
        thresholds = report["thresholds"]
        
        # Add rows with pass/fail indicators
        def check_status(value, threshold, is_max=False):
            if is_max:
                return "✅" if value <= threshold else "❌"
            return "✅" if value >= threshold else "❌"
        
        table.add_row("Code Coverage", f"{metrics['code_coverage']:.1f}%", 
                     f"≥{thresholds['min_coverage']}%",
                     check_status(metrics['code_coverage'], thresholds['min_coverage']))
        table.add_row("Test Pass Rate", f"{metrics['test_pass_rate']:.1f}%",
                     f"≥{thresholds['min_test_pass']}%",
                     check_status(metrics['test_pass_rate'], thresholds['min_test_pass']))
        table.add_row("Performance", f"{metrics['performance_score']:.1f}",
                     f"≥{thresholds['min_performance']}",
                     check_status(metrics['performance_score'], thresholds['min_performance']))
        table.add_row("Security", f"{metrics['security_score']:.1f}",
                     f"≥{thresholds['min_security']}",
                     check_status(metrics['security_score'], thresholds['min_security']))
        table.add_row("Build Time", f"{metrics['build_time']:.1f}s",
                     f"≤{thresholds['max_build_time']}s",
                     check_status(metrics['build_time'], thresholds['max_build_time'], True))
        table.add_row("Bundle Size", f"{metrics['bundle_size']:.1f}KB",
                     f"≤{thresholds['max_bundle_size']}KB",
                     check_status(metrics['bundle_size'], thresholds['max_bundle_size'], True))
        table.add_row("Error Rate", f"{metrics['error_rate']:.2f}%",
                     f"≤{thresholds['max_error_rate']}%",
                     check_status(metrics['error_rate'], thresholds['max_error_rate'], True))
        table.add_row("Response Time", f"{metrics['response_time']:.1f}ms",
                     f"≤{thresholds['max_response_time']}ms",
                     check_status(metrics['response_time'], thresholds['max_response_time'], True))
        
        console.print(table)
        
        # Violations
        if report["violations"]:
            console.print("\n[bold red]⚠️  Gate Violations:[/bold red]")
            for violation in report["violations"]:
                console.print(f"  • {violation}")
        else:
            console.print("\n[bold green]✅ All quality gates passed![/bold green]")
        
        # AI Analysis
        console.print("\n[bold cyan]AI Analysis & Recommendations:[/bold cyan]")
        console.print(Markdown(report["ai_analysis"]))
        
        # Cost info
        if report.get("cost_estimate", 0) > 0:
            console.print(Panel(
                f"Provider: {report['provider']}\n"
                f"Model: {report['model']}\n"
                f"Cost: ${report['cost_estimate']:.4f}",
                title="API Usage",
                border_style="yellow"
            ))


def simulate_pipeline(analyzer: QualityGateAnalyzer, scenario: str):
    """Simulate a pipeline run with generated metrics"""
    
    console.print(f"\n[cyan]Simulating {scenario} scenario...[/cyan]")
    
    # Generate metrics
    metrics = QualityMetrics.generate_random(scenario)
    thresholds = QualityThresholds()
    
    # Add context
    context = {
        "service": "payment-service",
        "environment": "production",
        "version": "v2.3.1",
        "deployer": "ci-bot",
        "time_of_day": datetime.now().strftime("%H:%M"),
        "day_of_week": datetime.now().strftime("%A")
    }
    
    # Generate history
    history = [QualityMetrics.generate_random("normal") for _ in range(3)]
    
    # Analyze
    with console.status("[bold green]Analyzing quality gates..."):
        report = analyzer.analyze(metrics, thresholds, context, history)
    
    # Display
    analyzer.display_report(report)
    
    return report


@click.command()
@click.option("--analyze", is_flag=True, help="Analyze current metrics")
@click.option("--decide", is_flag=True, help="Make release decision")
@click.option("--simulate", type=click.Choice(["good", "bad", "mixed"]),
              help="Simulate a scenario")
@click.option("--metrics-file", type=click.Path(exists=True),
              help="JSON file with metrics")
@click.option("--thresholds-file", type=click.Path(exists=True),
              help="YAML file with thresholds")
@click.option("--provider", type=click.Choice(["anthropic", "openai", "mock"]),
              help="AI provider to use")
@click.option("--history", is_flag=True, help="Show decision history")
def main(analyze, decide, simulate, metrics_file, thresholds_file, provider, history):
    """
    AI-Enhanced Quality Gates for Release Decisions
    
    Examples:
        # Simulate a good scenario
        python ex2_quality_gates.py --simulate good
        
        # Analyze metrics from file
        python ex2_quality_gates.py --analyze --metrics-file metrics.json
        
        # Make release decision
        python ex2_quality_gates.py --decide
        
        # Use mock mode
        python ex2_quality_gates.py --provider mock --simulate mixed
    """
    
    # Initialize analyzer
    provider_enum = None
    if provider:
        provider_enum = AIProvider[provider.upper()]
    
    analyzer = QualityGateAnalyzer(provider_enum)
    
    # Handle different modes
    if history:
        # Show history
        if not analyzer.decision_history:
            # Load from files
            history_files = sorted(analyzer.output_dir.glob("decision_*.json"))[-5:]
            for f in history_files:
                with open(f) as file:
                    analyzer.decision_history.append(json.load(file))
        
        if analyzer.decision_history:
            console.print("[bold cyan]Decision History:[/bold cyan]")
            for i, decision in enumerate(analyzer.decision_history[-5:], 1):
                console.print(f"{i}. {decision['timestamp']}: {decision.get('decision', 'N/A')}")
        else:
            console.print("[yellow]No decision history found[/yellow]")
    
    elif simulate:
        # Run simulation
        simulate_pipeline(analyzer, simulate)
    
    elif analyze or decide:
        # Load or generate metrics
        if metrics_file:
            with open(metrics_file) as f:
                metrics_data = json.load(f)
                metrics = QualityMetrics(**metrics_data)
        else:
            console.print("[yellow]No metrics file provided, using random data[/yellow]")
            metrics = QualityMetrics.generate_random("mixed")
        
        # Load thresholds
        if thresholds_file:
            thresholds = QualityThresholds.from_file(Path(thresholds_file))
        else:
            thresholds = QualityThresholds()
        
        # Analyze
        with console.status("[bold green]Analyzing quality gates..."):
            report = analyzer.analyze(metrics, thresholds)
        
        # Display
        analyzer.display_report(report)
        
        # Show automation suggestions
        if decide:
            console.print("\n[bold cyan]Automation Suggestions:[/bold cyan]")
            if report["decision"] == "RELEASE":
                console.print("• Trigger deployment pipeline")
                console.print("• Enable feature flags progressively")
                console.print("• Alert on-call team")
            else:
                console.print("• Block deployment")
                console.print("• Create incident ticket")
                console.print("• Notify development team")
    
    else:
        # Show help
        ctx = click.get_current_context()
        click.echo(ctx.get_help())


if __name__ == "__main__":
    main()
