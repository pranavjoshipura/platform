#!/usr/bin/env python3
"""
Segment 3: Multi-Agent Coordination for Operational Intelligence
Simulates cost optimizer and incident responder agents working together
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
import json
import random
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from rich.layout import Layout
from rich.markdown import Markdown

from ai_client import AIClient, AIProvider

console = Console()


class AgentRole(Enum):
    COST_OPTIMIZER = "cost_optimizer"
    INCIDENT_RESPONDER = "incident_responder"
    CAPACITY_PLANNER = "capacity_planner"
    COORDINATOR = "coordinator"


@dataclass
class InfrastructureState:
    """Current infrastructure state"""
    instances: int
    cpu_usage: float
    memory_usage: float
    request_rate: float
    error_rate: float
    monthly_cost: float
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AgentMessage:
    """Message passed between agents"""
    from_agent: str
    to_agent: str
    message_type: str
    content: Dict[str, Any]
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "from": self.from_agent,
            "to": self.to_agent,
            "type": self.message_type,
            "content": self.content,
            "timestamp": self.timestamp.isoformat()
        }


class BaseAgent:
    """Base class for all agents"""
    
    def __init__(self, name: str, role: AgentRole, client: AIClient):
        self.name = name
        self.role = role
        self.client = client
        self.inbox: List[AgentMessage] = []
        self.decisions: List[Dict[str, Any]] = []
    
    async def receive_message(self, message: AgentMessage):
        """Receive a message from another agent"""
        self.inbox.append(message)
    
    async def process_messages(self) -> Optional[AgentMessage]:
        """Process inbox messages and make decisions"""
        if not self.inbox:
            return None
        
        message = self.inbox.pop(0)
        return await self.handle_message(message)
    
    async def handle_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """Override in subclasses to handle specific messages"""
        raise NotImplementedError


class CostOptimizerAgent(BaseAgent):
    """Agent responsible for cost optimization"""
    
    SYSTEM_PROMPT = """
You are a cost optimization agent for cloud infrastructure.
Given the current infrastructure state and metrics, you will:
1. Identify cost-saving opportunities
2. Calculate potential savings
3. Assess impact on performance/reliability
4. Recommend specific actions
5. Consider time-of-day and usage patterns

Format recommendations as actionable items with risk levels.
"""
    
    async def analyze_costs(self, state: InfrastructureState) -> Dict[str, Any]:
        """Analyze infrastructure costs and recommend optimizations"""
        
        user_prompt = f"""
Current Infrastructure State:
- Instances: {state.instances}
- CPU Usage: {state.cpu_usage:.1f}%
- Memory Usage: {state.memory_usage:.1f}%
- Request Rate: {state.request_rate:.0f} req/s
- Error Rate: {state.error_rate:.2f}%
- Monthly Cost: ${state.monthly_cost:,.2f}

Time: {datetime.now().strftime('%H:%M %A')}

Analyze for cost optimization opportunities.
Consider both immediate and scheduled optimizations.
"""
        
        response = self.client.ask(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=600,
            prompt_type="multi_agent"
        )
        
        recommendations = {
            "analysis": response.text,
            "potential_savings": random.uniform(500, 3000),
            "risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
            "recommended_instances": max(1, state.instances - random.randint(0, 2))
        }
        
        self.decisions.append({
            "timestamp": datetime.now().isoformat(),
            "type": "cost_optimization",
            "recommendations": recommendations
        })
        
        return recommendations
    
    async def handle_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """Handle incoming messages"""
        
        if message.message_type == "analyze_costs":
            state = InfrastructureState(**message.content["state"])
            recommendations = await self.analyze_costs(state)
            
            return AgentMessage(
                from_agent=self.name,
                to_agent="coordinator",
                message_type="cost_recommendations",
                content=recommendations,
                timestamp=datetime.now()
            )
        
        return None


class IncidentResponderAgent(BaseAgent):
    """Agent responsible for incident response"""
    
    SYSTEM_PROMPT = """
You are an incident response agent for production systems.
Given system metrics and alerts, you will:
1. Assess incident severity (P1-P4)
2. Identify root cause possibilities
3. Recommend immediate mitigation steps
4. Evaluate if scaling is needed
5. Coordinate with other agents

Consider SLA requirements and customer impact.
"""
    
    async def assess_incident(self, state: InfrastructureState) -> Dict[str, Any]:
        """Assess if there's an incident and recommend response"""
        
        # Check for incident conditions
        has_incident = (
            state.error_rate > 1.0 or
            state.cpu_usage > 90 or
            state.memory_usage > 90
        )
        
        if not has_incident:
            return {
                "has_incident": False,
                "severity": "NONE",
                "actions": []
            }
        
        user_prompt = f"""
System Alert Detected:
- CPU Usage: {state.cpu_usage:.1f}%
- Memory Usage: {state.memory_usage:.1f}%
- Error Rate: {state.error_rate:.2f}%
- Request Rate: {state.request_rate:.0f} req/s
- Current Instances: {state.instances}

Assess the incident and recommend immediate actions.
"""
        
        response = self.client.ask(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=600,
            prompt_type="multi_agent"
        )
        
        assessment = {
            "has_incident": True,
            "severity": "P2" if state.error_rate > 2 else "P3",
            "analysis": response.text,
            "recommended_instances": state.instances + random.randint(1, 3),
            "immediate_actions": [
                "Scale up instances",
                "Enable circuit breakers",
                "Increase cache TTL"
            ]
        }
        
        self.decisions.append({
            "timestamp": datetime.now().isoformat(),
            "type": "incident_response",
            "assessment": assessment
        })
        
        return assessment
    
    async def handle_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """Handle incoming messages"""
        
        if message.message_type == "assess_incident":
            state = InfrastructureState(**message.content["state"])
            assessment = await self.assess_incident(state)
            
            return AgentMessage(
                from_agent=self.name,
                to_agent="coordinator",
                message_type="incident_assessment",
                content=assessment,
                timestamp=datetime.now()
            )
        
        return None


class CoordinatorAgent(BaseAgent):
    """Central coordinator that manages other agents"""
    
    SYSTEM_PROMPT = """
You are a coordinator agent managing infrastructure decisions.
Given recommendations from specialized agents, you will:
1. Resolve conflicts between cost and reliability
2. Prioritize based on current context
3. Create an action plan with sequencing
4. Consider business hours and SLA requirements
5. Provide clear go/no-go decisions

Balance cost optimization with system reliability.
"""
    
    def __init__(self, name: str, client: AIClient):
        super().__init__(name, AgentRole.COORDINATOR, client)
        self.cost_optimizer = CostOptimizerAgent("cost-optimizer", AgentRole.COST_OPTIMIZER, client)
        self.incident_responder = IncidentResponderAgent("incident-responder", AgentRole.INCIDENT_RESPONDER, client)
        self.final_decision = None
    
    async def coordinate(self, state: InfrastructureState) -> Dict[str, Any]:
        """Coordinate between agents to make final decision"""
        
        # Send state to both agents
        cost_msg = AgentMessage(
            from_agent=self.name,
            to_agent=self.cost_optimizer.name,
            message_type="analyze_costs",
            content={"state": state.to_dict()},
            timestamp=datetime.now()
        )
        
        incident_msg = AgentMessage(
            from_agent=self.name,
            to_agent=self.incident_responder.name,
            message_type="assess_incident",
            content={"state": state.to_dict()},
            timestamp=datetime.now()
        )
        
        # Get responses
        await self.cost_optimizer.receive_message(cost_msg)
        await self.incident_responder.receive_message(incident_msg)
        
        cost_response = await self.cost_optimizer.process_messages()
        incident_response = await self.incident_responder.process_messages()
        
        # Make coordinated decision
        user_prompt = f"""
Cost Optimizer Recommendations:
{json.dumps(cost_response.content if cost_response else {}, indent=2)}

Incident Responder Assessment:
{json.dumps(incident_response.content if incident_response else {}, indent=2)}

Current State:
{json.dumps(state.to_dict(), indent=2)}

Make a final coordinated decision balancing cost and reliability.
Provide specific action items with priorities.
"""
        
        response = self.client.ask(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=800,
            prompt_type="multi_agent"
        )
        
        self.final_decision = {
            "coordinator_analysis": response.text,
            "cost_recommendations": cost_response.content if cost_response else {},
            "incident_assessment": incident_response.content if incident_response else {},
            "timestamp": datetime.now().isoformat(),
            "state": state.to_dict()
        }
        
        return self.final_decision


class MultiAgentSimulator:
    """Simulates multi-agent coordination scenarios"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        self.client = AIClient(provider)
        self.coordinator = CoordinatorAgent("coordinator", self.client)
        self.output_dir = Path("outputs/multi-agent")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_scenario(self, scenario_type: str) -> InfrastructureState:
        """Generate a scenario for testing"""
        
        if scenario_type == "cost-optimization":
            # Low usage, opportunity to scale down
            return InfrastructureState(
                instances=10,
                cpu_usage=random.uniform(20, 40),
                memory_usage=random.uniform(30, 50),
                request_rate=random.uniform(100, 300),
                error_rate=random.uniform(0, 0.5),
                monthly_cost=random.uniform(5000, 8000)
            )
        
        elif scenario_type == "incident-response":
            # High load, errors occurring
            return InfrastructureState(
                instances=5,
                cpu_usage=random.uniform(85, 95),
                memory_usage=random.uniform(80, 95),
                request_rate=random.uniform(800, 1200),
                error_rate=random.uniform(2, 5),
                monthly_cost=random.uniform(3000, 4000)
            )
        
        else:  # balanced
            return InfrastructureState(
                instances=7,
                cpu_usage=random.uniform(60, 75),
                memory_usage=random.uniform(50, 70),
                request_rate=random.uniform(400, 600),
                error_rate=random.uniform(0.5, 1.5),
                monthly_cost=random.uniform(4000, 5000)
            )
    
    async def run_scenario(self, scenario_type: str) -> Dict[str, Any]:
        """Run a multi-agent scenario"""
        
        console.print(Panel(
            f"[bold cyan]Running {scenario_type} scenario[/bold cyan]",
            title="🤖 Multi-Agent Coordination",
            border_style="cyan"
        ))
        
        # Generate state
        state = self.generate_scenario(scenario_type)
        
        # Display initial state
        self.display_state(state)
        
        # Coordinate agents
        with console.status("[bold green]Agents coordinating..."):
            decision = await self.coordinator.coordinate(state)
        
        # Save results
        report_file = self.output_dir / f"coordination_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_file.write_text(json.dumps(decision, indent=2))
        
        # Display results
        self.display_coordination_results(decision)
        
        return decision
    
    def display_state(self, state: InfrastructureState):
        """Display infrastructure state"""
        
        table = Table(title="Infrastructure State")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")
        table.add_column("Status", style="white")
        
        # Determine status indicators
        def get_status(value, warning_threshold, critical_threshold, reverse=False):
            if reverse:
                if value > critical_threshold:
                    return "🔴"
                elif value > warning_threshold:
                    return "🟡"
                else:
                    return "🟢"
            else:
                if value < critical_threshold:
                    return "🔴"
                elif value < warning_threshold:
                    return "🟡"
                else:
                    return "🟢"
        
        table.add_row("Instances", str(state.instances), "")
        table.add_row("CPU Usage", f"{state.cpu_usage:.1f}%", 
                     get_status(state.cpu_usage, 70, 85, reverse=True))
        table.add_row("Memory Usage", f"{state.memory_usage:.1f}%",
                     get_status(state.memory_usage, 70, 85, reverse=True))
        table.add_row("Request Rate", f"{state.request_rate:.0f} req/s", "")
        table.add_row("Error Rate", f"{state.error_rate:.2f}%",
                     get_status(state.error_rate, 1, 2, reverse=True))
        table.add_row("Monthly Cost", f"${state.monthly_cost:,.2f}", "")
        
        console.print(table)
    
    def display_coordination_results(self, decision: Dict[str, Any]):
        """Display coordination results"""
        
        # Cost optimizer results
        if decision.get("cost_recommendations"):
            console.print("\n[bold green]💰 Cost Optimizer Analysis:[/bold green]")
            console.print(Markdown(decision["cost_recommendations"].get("analysis", "")))
            
            if "potential_savings" in decision["cost_recommendations"]:
                console.print(f"Potential Savings: ${decision['cost_recommendations']['potential_savings']:,.2f}")
                console.print(f"Risk Level: {decision['cost_recommendations']['risk_level']}")
        
        # Incident responder results
        if decision.get("incident_assessment"):
            console.print("\n[bold red]🚨 Incident Responder Assessment:[/bold red]")
            
            if decision["incident_assessment"].get("has_incident"):
                console.print(f"Severity: {decision['incident_assessment']['severity']}")
                console.print(Markdown(decision["incident_assessment"].get("analysis", "")))
                
                if "immediate_actions" in decision["incident_assessment"]:
                    console.print("\nImmediate Actions:")
                    for action in decision["incident_assessment"]["immediate_actions"]:
                        console.print(f"  • {action}")
            else:
                console.print("[green]No active incidents detected[/green]")
        
        # Coordinator decision
        console.print("\n[bold cyan]🎯 Coordinator Final Decision:[/bold cyan]")
        console.print(Markdown(decision.get("coordinator_analysis", "")))


@click.command()
@click.option("--scenario", type=click.Choice(["cost-optimization", "incident-response", "balanced"]),
              default="balanced", help="Scenario to simulate")
@click.option("--provider", type=click.Choice(["anthropic", "openai", "mock"]),
              help="AI provider to use")
@click.option("--interactive", is_flag=True, help="Interactive mode with live updates")
def main(scenario, provider, interactive):
    """
    Multi-Agent Coordination for Operational Intelligence
    
    Examples:
        # Run cost optimization scenario
        python ex3_multi_agent.py --scenario cost-optimization
        
        # Run incident response scenario
        python ex3_multi_agent.py --scenario incident-response
        
        # Use mock mode
        python ex3_multi_agent.py --provider mock --scenario balanced
    """
    
    # Initialize simulator
    provider_enum = None
    if provider:
        provider_enum = AIProvider[provider.upper()]
    
    simulator = MultiAgentSimulator(provider_enum)
    
    # Run scenario
    if interactive:
        console.print("[yellow]Interactive mode not yet implemented[/yellow]")
        # Future: Add live monitoring with updates
    
    # Run async scenario
    asyncio.run(simulator.run_scenario(scenario))
    
    console.print("\n[bold green]✅ Multi-agent coordination complete![/bold green]")
    console.print(f"Results saved to: {simulator.output_dir}")


if __name__ == "__main__":
    main()
