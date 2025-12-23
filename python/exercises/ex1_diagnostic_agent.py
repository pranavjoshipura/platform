#!/usr/bin/env python3
"""
Segment 1: AI-Powered Diagnostic Agent
Analyzes CI/CD failures and provides actionable fixes
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table
from rich.markdown import Markdown

from ai_client import AIClient, AIProvider

console = Console()


SYSTEM_PROMPTS = {
    "diagnostic": """
You are an expert DevOps and platform engineering diagnostic assistant.
Given CI/CD logs or error messages, you will:
1. Identify the root cause with confidence level (High/Medium/Low)
2. Pinpoint exact failure location (file, line, step)
3. Provide specific, actionable fixes with code examples
4. Suggest preventive measures for the future
5. Estimate fix complexity (Simple/Medium/Complex) and time

Format your response in clear sections with markdown.
Be concise but thorough. Include specific commands or code changes.
""",
    "pattern_analysis": """
You are analyzing CI/CD failure patterns across multiple runs.
Identify:
1. Recurring failure types
2. Flaky tests or infrastructure issues
3. Correlation with recent changes
4. Systemic problems requiring architectural fixes
""",
}


class DiagnosticAgent:
    """AI-powered diagnostic agent for CI/CD failures"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        self.client = AIClient(provider)
        self.history = []
        self.output_dir = Path("outputs/diagnostics")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def analyze_logs(
        self,
        log_content: str,
        context: Optional[Dict[str, Any]] = None,
        save_report: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze CI/CD logs and generate diagnostic report
        
        Args:
            log_content: The log text to analyze
            context: Additional context (workflow name, branch, etc.)
            save_report: Whether to save report to file
        
        Returns:
            Diagnostic report dictionary
        """
        
        # Prepare context-aware prompt
        context_str = ""
        if context:
            context_str = "\nContext:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"
        
        user_prompt = f"""
{context_str}

Please analyze these CI/CD logs and provide a comprehensive diagnostic:

----- BEGIN LOGS -----
{log_content[:5000]}  # Limit to first 5000 chars for API limits
----- END LOGS -----

Include specific line numbers, exact commands to fix, and time estimates.
"""
        
        # Get AI analysis
        response = self.client.ask(
            system_prompt=SYSTEM_PROMPTS["diagnostic"],
            user_prompt=user_prompt,
            max_tokens=1200,
            prompt_type="diagnostic"
        )
        
        # Parse and structure the response
        report = {
            "timestamp": datetime.now().isoformat(),
            "provider": response.provider.value,
            "model": response.model,
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate,
            "context": context or {},
            "analysis": response.text,
            "raw_logs_preview": log_content[:500]
        }
        
        # Save report if requested
        if save_report:
            report_file = self.output_dir / f"diagnostic_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            report_file.write_text(json.dumps(report, indent=2))
            console.print(f"[green]Report saved to: {report_file}[/green]")
        
        # Add to history
        self.history.append(report)
        
        return report
    
    def analyze_pattern(self, multiple_logs: list) -> Dict[str, Any]:
        """Analyze patterns across multiple failure logs"""
        
        combined_logs = "\n\n=== LOG SEPARATOR ===\n\n".join(multiple_logs[:3])
        
        user_prompt = f"""
Analyze these multiple CI/CD failure logs for patterns:

{combined_logs}

Identify recurring issues, flaky behavior, and systemic problems.
"""
        
        response = self.client.ask(
            system_prompt=SYSTEM_PROMPTS["pattern_analysis"],
            user_prompt=user_prompt,
            max_tokens=1000,
            prompt_type="diagnostic"
        )
        
        return {
            "timestamp": datetime.now().isoformat(),
            "pattern_analysis": response.text,
            "logs_analyzed": len(multiple_logs)
        }
    
    def display_report(self, report: Dict[str, Any]):
        """Display diagnostic report in a formatted way"""
        
        # Header
        console.print(Panel(
            f"[bold cyan]CI/CD Diagnostic Report[/bold cyan]\n"
            f"Generated: {report['timestamp']}\n"
            f"Provider: {report['provider']} ({report['model']})",
            title="📊 Diagnostic Analysis",
            border_style="cyan"
        ))
        
        # Context table if present
        if report.get("context"):
            table = Table(title="Context Information")
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")
            
            for key, value in report["context"].items():
                table.add_row(key, str(value))
            
            console.print(table)
            console.print()
        
        # Main analysis
        console.print(Markdown(report["analysis"]))
        
        # Cost information
        if report.get("cost_estimate", 0) > 0:
            console.print(Panel(
                f"Tokens used: {report['tokens_used']}\n"
                f"Estimated cost: ${report['cost_estimate']:.4f}",
                title="Usage",
                border_style="yellow"
            ))


def interactive_mode(agent: DiagnosticAgent):
    """Interactive diagnostic mode"""
    
    console.print(Panel(
        "[bold green]Interactive Diagnostic Mode[/bold green]\n"
        "Paste your CI/CD logs, then type 'END' on a new line to analyze.\n"
        "Type 'quit' to exit.",
        title="🔍 Diagnostic Agent",
        border_style="green"
    ))
    
    while True:
        console.print("\n[cyan]Paste logs (type 'END' when done, 'quit' to exit):[/cyan]")
        
        lines = []
        while True:
            try:
                line = input()
                if line == "END":
                    break
                if line == "quit":
                    return
                lines.append(line)
            except EOFError:
                break
        
        if not lines:
            continue
        
        log_content = "\n".join(lines)
        
        # Get additional context
        workflow = click.prompt("Workflow name", default="unknown")
        branch = click.prompt("Branch", default="main")
        
        # Analyze
        with console.status("[bold green]Analyzing logs..."):
            report = agent.analyze_logs(
                log_content,
                context={
                    "workflow": workflow,
                    "branch": branch,
                    "mode": "interactive"
                }
            )
        
        # Display results
        agent.display_report(report)
        
        if not click.confirm("\nAnalyze another log?"):
            break


@click.command()
@click.argument("log_file", required=False, type=click.Path(exists=True))
@click.option("--mode", type=click.Choice(["analyze", "pattern", "interactive"]), 
              default="analyze", help="Analysis mode")
@click.option("--workflow", help="Workflow name for context")
@click.option("--branch", default="main", help="Branch name for context")
@click.option("--provider", type=click.Choice(["anthropic", "openai", "mock"]),
              help="AI provider to use")
@click.option("--save/--no-save", default=True, help="Save report to file")
@click.option("--pattern-dir", type=click.Path(exists=True),
              help="Directory with multiple log files for pattern analysis")
def main(log_file, mode, workflow, branch, provider, save, pattern_dir):
    """
    AI-Powered Diagnostic Agent for CI/CD Failures
    
    Examples:
        # Analyze a single log file
        python ex1_diagnostic_agent.py logs/failure.log
        
        # Interactive mode
        python ex1_diagnostic_agent.py --mode interactive
        
        # Pattern analysis across multiple logs
        python ex1_diagnostic_agent.py --mode pattern --pattern-dir logs/
        
        # Use mock mode for testing
        python ex1_diagnostic_agent.py --provider mock logs/test.log
    """
    
    # Initialize agent
    provider_enum = None
    if provider:
        provider_enum = AIProvider[provider.upper()]
    
    agent = DiagnosticAgent(provider_enum)
    
    # Handle different modes
    if mode == "interactive":
        interactive_mode(agent)
    
    elif mode == "pattern" and pattern_dir:
        # Collect all log files
        log_files = list(Path(pattern_dir).glob("*.log"))[:5]
        if not log_files:
            console.print("[red]No .log files found in directory[/red]")
            sys.exit(1)
        
        logs = [f.read_text() for f in log_files]
        
        with console.status("[bold green]Analyzing patterns..."):
            report = agent.analyze_pattern(logs)
        
        console.print(Panel(
            Markdown(report["pattern_analysis"]),
            title=f"Pattern Analysis ({report['logs_analyzed']} logs)",
            border_style="cyan"
        ))
    
    else:
        # Single file analysis
        if not log_file:
            console.print("[red]Please provide a log file or use --mode interactive[/red]")
            sys.exit(1)
        
        log_content = Path(log_file).read_text()
        
        # Create context
        context = {
            "filename": Path(log_file).name,
            "workflow": workflow or "unknown",
            "branch": branch
        }
        
        # Analyze
        with console.status("[bold green]Analyzing logs..."):
            report = agent.analyze_logs(log_content, context, save)
        
        # Display
        agent.display_report(report)
        
        # Show quick fixes
        console.print("\n[bold cyan]Quick Actions:[/bold cyan]")
        console.print("1. Copy the suggested fix commands")
        console.print("2. Review changes before committing")
        console.print("3. Re-run the workflow to verify fix")


if __name__ == "__main__":
    main()
