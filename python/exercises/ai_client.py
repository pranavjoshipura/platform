"""
Enhanced AI Client with Multi-Provider Support and Mock Fallback
Supports Anthropic Claude, OpenAI GPT, and Mock responses for workshops
"""

import os
import sys
import json
import random
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


class AIProvider(Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    MOCK = "mock"


@dataclass
class AIResponse:
    text: str
    provider: AIProvider
    model: str
    tokens_used: int
    cost_estimate: float
    metadata: Dict[str, Any]


class MockAIProvider:
    """Provides realistic mock responses for workshop scenarios"""
    
    def __init__(self):
        self.responses = {
            "diagnostic": self._get_diagnostic_responses(),
            "quality_gate": self._get_quality_gate_responses(),
            "multi_agent": self._get_multi_agent_responses(),
            "portal": self._get_portal_responses(),
            "documentation": self._get_documentation_responses(),
        }
    
    def _get_diagnostic_responses(self) -> List[str]:
        return [
            """
            ## Workflow Failure Analysis
            
            **Root Cause:** Test assertion failure in `test_math_utils.py`
            
            **Details:**
            - File: `tests/test_math_utils.py`, line 5
            - Expected: `add(1, 2) == 5`
            - Actual: `add(1, 2) == 3`
            
            **Fix Suggestion:**
            Update the test assertion to match the correct expected value:
            ```python
            assert add(1, 2) == 3  # Changed from == 5
            ```
            
            **Additional Recommendations:**
            1. Add more comprehensive test cases
            2. Consider implementing property-based testing
            3. Add test coverage reporting to your CI pipeline
            """,
            """
            ## Build Failure Detected
            
            **Issue:** Dependency installation failed
            **Package:** anthropic>=0.36.0
            
            **Possible Causes:**
            1. Network connectivity issues
            2. PyPI mirror problems
            3. Version conflicts
            
            **Solutions:**
            - Retry with `--no-cache-dir`
            - Use a different PyPI mirror
            - Pin specific versions in requirements.txt
            """
        ]
    
    def _get_quality_gate_responses(self) -> List[str]:
        return [
            """
            ## Release Decision: ROLLBACK
            
            **Rationale:**
            - Code coverage (72%) below threshold (80%)
            - Performance regression detected (-15% throughput)
            - 1 critical security vulnerability found
            
            **Risk Assessment:** HIGH
            
            **Recommendations:**
            1. Fix critical security issue immediately
            2. Investigate performance regression root cause
            3. Increase test coverage for new code paths
            
            **Next Steps:**
            - Trigger automated rollback
            - Create incident ticket
            - Schedule post-mortem
            """,
            """
            ## Release Decision: APPROVED
            
            **Quality Metrics:**
            ✅ Code coverage: 85% (threshold: 80%)
            ✅ Performance: +5% improvement
            ✅ Security: No critical issues
            ✅ All integration tests passing
            
            **Deployment Strategy:** Blue-Green with 10% canary
            
            **Post-Release Monitoring:**
            - Watch error rates for 30 minutes
            - Monitor resource utilization
            - Track user experience metrics
            """
        ]
    
    def _get_multi_agent_responses(self) -> List[str]:
        return [
            """
            ## Multi-Agent Coordination Report
            
            **Agent: Cost Optimizer**
            - Identified 3 underutilized instances
            - Recommended downscaling saves $2,400/month
            - No impact on current performance SLAs
            
            **Agent: Incident Responder**
            - No active incidents
            - All systems operational
            - Approve cost optimization
            
            **Decision:** Proceed with optimization
            **Execution:** Scheduled for next maintenance window
            """,
            """
            ## Incident Response Coordination
            
            **Severity:** P2
            **Affected Service:** Payment Gateway
            
            **Agent Actions:**
            1. **Triage Agent:** Identified database connection pool exhaustion
            2. **Diagnostic Agent:** Root cause - recent deployment increased connection usage
            3. **Remediation Agent:** Increased pool size, recycled connections
            
            **Resolution Time:** 12 minutes
            **Customer Impact:** Minimal (0.3% of transactions delayed)
            """
        ]
    
    def _get_portal_responses(self) -> List[str]:
        return [
            """
            ## Service Onboarding Tasks
            
            ### Phase 1: Foundation (Week 1)
            - [ ] Set up repository with branch protection
            - [ ] Configure CI/CD pipeline with quality gates
            - [ ] Implement basic health checks
            - [ ] Add structured logging
            
            ### Phase 2: Observability (Week 2)
            - [ ] Configure metrics collection
            - [ ] Set up distributed tracing
            - [ ] Create monitoring dashboards
            - [ ] Define SLIs and SLOs
            
            ### Phase 3: Automation (Week 3)
            - [ ] Implement automated rollback
            - [ ] Add performance testing
            - [ ] Configure auto-scaling
            - [ ] Set up incident alerting
            """,
        ]
    
    def _get_documentation_responses(self) -> List[str]:
        return [
            """
            # Service Template README
            
            ## Overview
            A production-ready microservice template with built-in observability, testing, and deployment automation.
            
            ## Architecture
            - **Language:** Python 3.11
            - **Framework:** FastAPI
            - **Database:** PostgreSQL with migrations
            - **Caching:** Redis
            - **Monitoring:** Prometheus + Grafana
            
            ## Quick Start
            
            ```bash
            # Clone and setup
            git clone <repo>
            cd service-template
            make setup
            
            # Run locally
            make run
            
            # Run tests
            make test
            ```
            
            ## Configuration
            See `.env.example` for required environment variables.
            
            ## Deployment
            Automated via GitHub Actions on merge to main.
            
            ## Support
            Contact: platform-team@company.com
            """
        ]
    
    def generate(self, prompt_type: str = "diagnostic", **kwargs) -> str:
        """Generate a mock response based on prompt type"""
        responses = self.responses.get(prompt_type, self.responses["diagnostic"])
        response = random.choice(responses)
        
        # Simulate API delay
        time.sleep(random.uniform(0.5, 1.5))
        
        return response


class AIClient:
    """Unified AI client with automatic provider selection and fallback"""
    
    def __init__(self, prefer_provider: Optional[AIProvider] = None):
        self.console = Console()
        self.mock_provider = MockAIProvider()
        self.provider = self._select_provider(prefer_provider)
        self.client = self._initialize_client()
        
        # Display provider info
        self._show_provider_info()
    
    def _select_provider(self, prefer_provider: Optional[AIProvider]) -> AIProvider:
        """Select the best available AI provider"""
        
        # Check for mock mode override
        if os.getenv("USE_MOCK_AI", "").lower() == "true":
            return AIProvider.MOCK
        
        # Check preferred provider
        if prefer_provider:
            if prefer_provider == AIProvider.ANTHROPIC and HAS_ANTHROPIC and os.getenv("ANTHROPIC_API_KEY"):
                return AIProvider.ANTHROPIC
            elif prefer_provider == AIProvider.OPENAI and HAS_OPENAI and os.getenv("OPENAI_API_KEY"):
                return AIProvider.OPENAI
        
        # Auto-detect available provider
        if HAS_ANTHROPIC and os.getenv("ANTHROPIC_API_KEY"):
            return AIProvider.ANTHROPIC
        elif HAS_OPENAI and os.getenv("OPENAI_API_KEY"):
            return AIProvider.OPENAI
        else:
            return AIProvider.MOCK
    
    def _initialize_client(self):
        """Initialize the selected AI provider client"""
        if self.provider == AIProvider.ANTHROPIC:
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        elif self.provider == AIProvider.OPENAI:
            openai.api_key = os.getenv("OPENAI_API_KEY")
            return openai
        else:
            return self.mock_provider
    
    def _show_provider_info(self):
        """Display information about the selected provider"""
        if self.provider == AIProvider.MOCK:
            console.print(Panel(
                "[yellow]🎭 Running in MOCK mode - No API key required![/yellow]\n"
                "Perfect for workshops and testing. Responses are pre-generated examples.",
                title="AI Provider",
                border_style="yellow"
            ))
        else:
            console.print(Panel(
                f"[green]✅ Using {self.provider.value.upper()} API[/green]\n"
                f"Model: {self._get_model_name()}",
                title="AI Provider",
                border_style="green"
            ))
    
    def _get_model_name(self) -> str:
        """Get the model name for the current provider"""
        if self.provider == AIProvider.ANTHROPIC:
            return os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        elif self.provider == AIProvider.OPENAI:
            return os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        else:
            return "mock-gpt-workshop"
    
    def _estimate_cost(self, tokens: int) -> float:
        """Estimate cost based on token usage"""
        # Rough estimates per 1K tokens
        costs = {
            AIProvider.ANTHROPIC: 0.003,
            AIProvider.OPENAI: 0.01,
            AIProvider.MOCK: 0.0
        }
        return (tokens / 1000) * costs.get(self.provider, 0.0)
    
    def ask(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 800,
        prompt_type: str = "diagnostic",
        temperature: float = 0.7,
        show_progress: bool = True
    ) -> AIResponse:
        """
        Send a query to the AI provider and get a response
        
        Args:
            system_prompt: System instructions for the AI
            user_prompt: User's question or request
            max_tokens: Maximum response length
            prompt_type: Type of prompt (for mock responses)
            temperature: Response randomness (0=deterministic, 1=creative)
            show_progress: Show progress spinner
        
        Returns:
            AIResponse object with text and metadata
        """
        
        if show_progress:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Thinking...", total=None)
                response = self._generate_response(
                    system_prompt, user_prompt, max_tokens, prompt_type, temperature
                )
                progress.stop()
        else:
            response = self._generate_response(
                system_prompt, user_prompt, max_tokens, prompt_type, temperature
            )
        
        return response
    
    def _generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int,
        prompt_type: str,
        temperature: float
    ) -> AIResponse:
        """Generate response from the selected provider"""
        
        try:
            if self.provider == AIProvider.ANTHROPIC:
                return self._anthropic_response(system_prompt, user_prompt, max_tokens, temperature)
            elif self.provider == AIProvider.OPENAI:
                return self._openai_response(system_prompt, user_prompt, max_tokens, temperature)
            else:
                return self._mock_response(prompt_type, user_prompt)
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            console.print("[yellow]Falling back to mock mode...[/yellow]")
            self.provider = AIProvider.MOCK
            self.client = self.mock_provider
            return self._mock_response(prompt_type, user_prompt)
    
    def _anthropic_response(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int,
        temperature: float
    ) -> AIResponse:
        """Generate response using Anthropic Claude"""
        message = self.client.messages.create(
            model=self._get_model_name(),
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        text = message.content[0].text if message.content else ""
        tokens = message.usage.input_tokens + message.usage.output_tokens
        
        return AIResponse(
            text=text,
            provider=AIProvider.ANTHROPIC,
            model=self._get_model_name(),
            tokens_used=tokens,
            cost_estimate=self._estimate_cost(tokens),
            metadata={"message_id": message.id}
        )
    
    def _openai_response(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int,
        temperature: float
    ) -> AIResponse:
        """Generate response using OpenAI GPT"""
        completion = self.client.chat.completions.create(
            model=self._get_model_name(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        text = completion.choices[0].message.content
        tokens = completion.usage.total_tokens
        
        return AIResponse(
            text=text,
            provider=AIProvider.OPENAI,
            model=self._get_model_name(),
            tokens_used=tokens,
            cost_estimate=self._estimate_cost(tokens),
            metadata={"completion_id": completion.id}
        )
    
    def _mock_response(self, prompt_type: str, user_prompt: str) -> AIResponse:
        """Generate mock response for workshop mode"""
        text = self.mock_provider.generate(prompt_type, user_prompt=user_prompt)
        tokens = len(text.split()) * 2  # Rough estimate
        
        return AIResponse(
            text=text,
            provider=AIProvider.MOCK,
            model="mock-workshop",
            tokens_used=tokens,
            cost_estimate=0.0,
            metadata={"mock_mode": True, "prompt_type": prompt_type}
        )


# Convenience functions for backwards compatibility
def get_client() -> AIClient:
    """Get a configured AI client instance"""
    return AIClient()


def ask_claude(system_prompt: str, user_prompt: str, max_tokens: int = 800) -> str:
    """Legacy function for simple text responses"""
    client = get_client()
    response = client.ask(system_prompt, user_prompt, max_tokens)
    return response.text
