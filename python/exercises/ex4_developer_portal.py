#!/usr/bin/env python3
"""
Segment 4: Self-Service Developer Portal with AI Assistance
Provides personalized onboarding and service maturity assessment
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, Any, List, Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.markdown import Markdown
from rich.progress import track

from ai_client import AIClient, AIProvider

console = Console()


@dataclass
class ServiceMetadata:
    """Service metadata from developer portal"""
    name: str
    team: str
    language: str
    framework: str
    created_date: str
    last_deployed: str
    repository: str
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        return cls(**data)


@dataclass
class ServiceMaturity:
    """Service maturity assessment"""
    has_ci_cd: bool
    has_monitoring: bool
    has_logging: bool
    has_documentation: bool
    has_tests: bool
    test_coverage: float
    has_sla: bool
    has_rollback: bool
    has_feature_flags: bool
    security_score: float
    
    def calculate_score(self) -> float:
        """Calculate overall maturity score"""
        scores = [
            self.has_ci_cd * 10,
            self.has_monitoring * 10,
            self.has_logging * 10,
            self.has_documentation * 10,
            self.has_tests * 10,
            (self.test_coverage / 10),  # 0-10 points based on coverage
            self.has_sla * 10,
            self.has_rollback * 10,
            self.has_feature_flags * 10,
            self.security_score  # Already 0-10
        ]
        return sum(scores)
    
    def get_level(self) -> str:
        """Get maturity level based on score"""
        score = self.calculate_score()
        if score >= 90:
            return "PLATINUM"
        elif score >= 75:
            return "GOLD"
        elif score >= 60:
            return "SILVER"
        elif score >= 40:
            return "BRONZE"
        else:
            return "INITIAL"


class DeveloperPortalAgent:
    """AI-powered developer portal assistant"""
    
    ONBOARDING_PROMPT = """
You are a developer experience assistant helping teams onboard services to the platform.
Given service metadata and maturity assessment, you will:
1. Create a prioritized task list for platform adoption
2. Group tasks into phases (Foundation, Observability, Automation)
3. Estimate effort for each task (hours/days)
4. Provide specific tool recommendations and commands
5. Include links to internal documentation (use placeholder URLs)
6. Consider the team's current tech stack

Be specific, actionable, and encouraging.
Format as markdown with clear phases and checkboxes.
"""
    
    IMPROVEMENT_PROMPT = """
You are analyzing a service for improvement opportunities.
Based on the maturity assessment, recommend:
1. Quick wins (< 1 day effort)
2. Medium-term improvements (1 week)
3. Strategic initiatives (1 month+)
4. Specific tools and practices for each gap
5. Success metrics for each improvement

Focus on highest-impact improvements first.
"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        self.client = AIClient(provider)
        self.output_dir = Path("outputs/portal")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.services_db = self._load_services_database()
    
    def _load_services_database(self) -> Dict[str, ServiceMetadata]:
        """Load or create services database"""
        db_file = Path("data/services.json")
        
        if db_file.exists():
            with open(db_file) as f:
                data = json.load(f)
                return {k: ServiceMetadata.from_dict(v) for k, v in data.items()}
        
        # Create sample services
        return {
            "payment-service": ServiceMetadata(
                name="payment-service",
                team="payments",
                language="Java",
                framework="Spring Boot",
                created_date="2023-01-15",
                last_deployed="2024-11-10",
                repository="github.com/org/payment-service"
            ),
            "user-service": ServiceMetadata(
                name="user-service",
                team="identity",
                language="Python",
                framework="FastAPI",
                created_date="2023-06-20",
                last_deployed="2024-11-12",
                repository="github.com/org/user-service"
            ),
            "notification-service": ServiceMetadata(
                name="notification-service",
                team="platform",
                language="Go",
                framework="Gin",
                created_date="2024-03-10",
                last_deployed="2024-11-14",
                repository="github.com/org/notification-service"
            )
        }
    
    def assess_maturity(self, service_name: str) -> ServiceMaturity:
        """Assess service maturity (simulated for demo)"""
        
        # In production, this would query real systems
        import random
        
        # Generate somewhat realistic maturity based on service age
        if service_name == "payment-service":
            # Mature service
            return ServiceMaturity(
                has_ci_cd=True,
                has_monitoring=True,
                has_logging=True,
                has_documentation=True,
                has_tests=True,
                test_coverage=85.5,
                has_sla=True,
                has_rollback=True,
                has_feature_flags=False,
                security_score=8.5
            )
        elif service_name == "user-service":
            # Medium maturity
            return ServiceMaturity(
                has_ci_cd=True,
                has_monitoring=True,
                has_logging=True,
                has_documentation=False,
                has_tests=True,
                test_coverage=72.3,
                has_sla=False,
                has_rollback=True,
                has_feature_flags=False,
                security_score=7.0
            )
        else:
            # New service
            return ServiceMaturity(
                has_ci_cd=True,
                has_monitoring=False,
                has_logging=True,
                has_documentation=False,
                has_tests=False,
                test_coverage=45.0,
                has_sla=False,
                has_rollback=False,
                has_feature_flags=False,
                security_score=5.5
            )
    
    def generate_onboarding_tasks(
        self,
        service: ServiceMetadata,
        maturity: ServiceMaturity
    ) -> Dict[str, Any]:
        """Generate personalized onboarding tasks"""
        
        gaps = []
        if not maturity.has_monitoring:
            gaps.append("No monitoring configured")
        if not maturity.has_documentation:
            gaps.append("Missing documentation")
        if maturity.test_coverage < 80:
            gaps.append(f"Low test coverage ({maturity.test_coverage:.1f}%)")
        if not maturity.has_sla:
            gaps.append("No SLA defined")
        if not maturity.has_rollback:
            gaps.append("No automated rollback")
        if not maturity.has_feature_flags:
            gaps.append("No feature flags")
        
        user_prompt = f"""
Service: {service.name}
Team: {service.team}
Tech Stack: {service.language} / {service.framework}
Repository: {service.repository}

Current Maturity Level: {maturity.get_level()} (Score: {maturity.calculate_score():.1f}/100)

Identified Gaps:
{chr(10).join('- ' + gap for gap in gaps)}

Full Assessment:
{json.dumps(asdict(maturity), indent=2)}

Generate a comprehensive onboarding task list to bring this service to platform excellence.
Include specific commands, configuration examples, and time estimates.
"""
        
        response = self.client.ask(
            system_prompt=self.ONBOARDING_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1200,
            prompt_type="portal"
        )
        
        report = {
            "service": asdict(service),
            "maturity": asdict(maturity),
            "maturity_score": maturity.calculate_score(),
            "maturity_level": maturity.get_level(),
            "gaps": gaps,
            "onboarding_tasks": response.text,
            "generated_at": datetime.now().isoformat()
        }
        
        # Save report
        report_file = self.output_dir / f"onboarding_{service.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_file.write_text(json.dumps(report, indent=2))
        
        return report
    
    def generate_improvement_plan(
        self,
        service: ServiceMetadata,
        maturity: ServiceMaturity
    ) -> Dict[str, Any]:
        """Generate service improvement plan"""
        
        user_prompt = f"""
Service: {service.name}
Current Maturity: {maturity.get_level()} (Score: {maturity.calculate_score():.1f}/100)

Maturity Assessment:
{json.dumps(asdict(maturity), indent=2)}

Generate a strategic improvement plan with quick wins and long-term goals.
"""
        
        response = self.client.ask(
            system_prompt=self.IMPROVEMENT_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1000,
            prompt_type="portal"
        )
        
        return {
            "service": service.name,
            "improvement_plan": response.text,
            "current_score": maturity.calculate_score(),
            "target_score": min(100, maturity.calculate_score() + 20),
            "generated_at": datetime.now().isoformat()
        }
    
    def display_maturity_report(
        self,
        service: ServiceMetadata,
        maturity: ServiceMaturity
    ):
        """Display service maturity report"""
        
        # Header
        level = maturity.get_level()
        score = maturity.calculate_score()
        
        level_colors = {
            "PLATINUM": "bright_white",
            "GOLD": "yellow",
            "SILVER": "white",
            "BRONZE": "yellow3",
            "INITIAL": "red"
        }
        
        console.print(Panel(
            f"[bold {level_colors[level]}]{level} Level[/bold {level_colors[level]}]\n"
            f"Score: {score:.1f}/100\n"
            f"Service: {service.name}\n"
            f"Team: {service.team}",
            title="🏆 Service Maturity Assessment",
            border_style=level_colors[level]
        ))
        
        # Maturity table
        table = Table(title="Platform Adoption Checklist")
        table.add_column("Category", style="cyan")
        table.add_column("Status", style="white")
        table.add_column("Details", style="white")
        
        # Add rows with checkmarks/crosses
        def status_icon(has_it: bool) -> str:
            return "✅" if has_it else "❌"
        
        table.add_row("CI/CD Pipeline", status_icon(maturity.has_ci_cd), 
                     "Automated build and deployment")
        table.add_row("Monitoring", status_icon(maturity.has_monitoring),
                     "Metrics and dashboards")
        table.add_row("Logging", status_icon(maturity.has_logging),
                     "Centralized structured logging")
        table.add_row("Documentation", status_icon(maturity.has_documentation),
                     "API docs and runbooks")
        table.add_row("Testing", status_icon(maturity.has_tests),
                     f"Coverage: {maturity.test_coverage:.1f}%")
        table.add_row("SLA", status_icon(maturity.has_sla),
                     "Defined service level agreements")
        table.add_row("Rollback", status_icon(maturity.has_rollback),
                     "Automated rollback capability")
        table.add_row("Feature Flags", status_icon(maturity.has_feature_flags),
                     "Progressive rollout support")
        table.add_row("Security", f"{maturity.security_score:.1f}/10",
                     "Security posture score")
        
        console.print(table)
        
        # Progress bars for key metrics
        console.print("\n[bold cyan]Maturity Progress:[/bold cyan]")
        
        categories = [
            ("Overall", score, 100),
            ("Test Coverage", maturity.test_coverage, 100),
            ("Security", maturity.security_score * 10, 100)
        ]
        
        for name, current, maximum in categories:
            progress = current / maximum
            bar_length = 30
            filled = int(bar_length * progress)
            bar = "█" * filled + "░" * (bar_length - filled)
            
            color = "green" if progress >= 0.8 else "yellow" if progress >= 0.6 else "red"
            console.print(f"{name:15} [{color}]{bar}[/{color}] {current:.1f}%")


def simulate_endpoint_data():
    """Simulate a portal endpoint response"""
    
    return {
        "project": "notification-service",
        "suggestion": """
This service needs critical platform improvements:
1. No monitoring or observability configured - the team is flying blind
2. Test coverage at 45% is below minimum standards
3. No automated rollback capability for production issues
4. Missing API documentation and runbooks
5. No SLA defined with consuming teams
6. Security scanning shows several vulnerabilities

Start with observability setup, then improve test coverage, and finally add automation.
""",
        "priority": "HIGH",
        "estimated_effort": "2-3 weeks",
        "tags": ["monitoring", "testing", "documentation", "security"]
    }


@click.command()
@click.option("--project", help="Service/project name to analyze")
@click.option("--assess", type=click.Choice(["maturity", "all"]),
              help="Assessment type")
@click.option("--provider", type=click.Choice(["anthropic", "openai", "mock"]),
              help="AI provider to use")
@click.option("--list-services", is_flag=True, help="List available services")
@click.option("--endpoint", is_flag=True, help="Simulate portal endpoint response")
def main(project, assess, provider, list_services, endpoint):
    """
    Self-Service Developer Portal with AI Assistance
    
    Examples:
        # Assess service maturity
        python ex4_developer_portal.py --project payment-service --assess maturity
        
        # Generate onboarding tasks
        python ex4_developer_portal.py --project notification-service
        
        # Simulate endpoint
        python ex4_developer_portal.py --endpoint
        
        # List available services
        python ex4_developer_portal.py --list-services
    """
    
    # Initialize agent
    provider_enum = None
    if provider:
        provider_enum = AIProvider[provider.upper()]
    
    agent = DeveloperPortalAgent(provider_enum)
    
    # Handle different modes
    if list_services:
        console.print("[bold cyan]Available Services:[/bold cyan]")
        for name, service in agent.services_db.items():
            console.print(f"  • {name} ({service.team} team) - {service.language}/{service.framework}")
        return
    
    if endpoint:
        # Simulate endpoint response
        data = simulate_endpoint_data()
        
        console.print(Panel(
            f"[bold cyan]Portal API Response[/bold cyan]\n"
            f"Project: {data['project']}\n"
            f"Priority: {data['priority']}\n"
            f"Effort: {data['estimated_effort']}",
            title="🌐 Developer Portal Endpoint",
            border_style="cyan"
        ))
        
        console.print("\n[bold]Improvement Suggestion:[/bold]")
        console.print(data["suggestion"])
        
        # Convert to tasks
        if click.confirm("\nGenerate task list from this suggestion?"):
            project = data["project"]
    
    if project:
        # Get or create service metadata
        if project not in agent.services_db:
            console.print(f"[yellow]Service '{project}' not found, using defaults[/yellow]")
            service = ServiceMetadata(
                name=project,
                team="unknown",
                language="Python",
                framework="FastAPI",
                created_date=datetime.now().isoformat(),
                last_deployed=datetime.now().isoformat(),
                repository=f"github.com/org/{project}"
            )
        else:
            service = agent.services_db[project]
        
        # Assess maturity
        with console.status("[bold green]Assessing service maturity..."):
            maturity = agent.assess_maturity(project)
        
        # Display maturity report
        agent.display_maturity_report(service, maturity)
        
        # Generate onboarding tasks
        if assess != "maturity" or click.confirm("\nGenerate onboarding tasks?"):
            with console.status("[bold green]Generating personalized tasks..."):
                report = agent.generate_onboarding_tasks(service, maturity)
            
            console.print("\n[bold cyan]📋 Onboarding Tasks:[/bold cyan]")
            console.print(Markdown(report["onboarding_tasks"]))
            
            console.print(f"\n[green]Full report saved to: {agent.output_dir}[/green]")
        
        # Generate improvement plan
        if click.confirm("\nGenerate improvement plan?"):
            with console.status("[bold green]Creating improvement plan..."):
                plan = agent.generate_improvement_plan(service, maturity)
            
            console.print("\n[bold cyan]📈 Improvement Plan:[/bold cyan]")
            console.print(Markdown(plan["improvement_plan"]))
    
    else:
        # Show help
        ctx = click.get_current_context()
        click.echo(ctx.get_help())


if __name__ == "__main__":
    main()
