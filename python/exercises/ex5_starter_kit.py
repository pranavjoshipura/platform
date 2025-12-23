#!/usr/bin/env python3
"""
Segment 5: AI-Powered Starter Kit and Template Generator
Creates reusable templates with documentation and best practices
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional

import click
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.tree import Tree
from rich.syntax import Syntax
from rich.markdown import Markdown

from ai_client import AIClient, AIProvider

console = Console()


class TemplateGenerator:
    """AI-powered template and starter kit generator"""
    
    README_PROMPT = """
You are creating professional README documentation for a GitHub template repository.
Generate a comprehensive README.md that includes:

1. **Overview** - Clear project description and purpose
2. **Features** - Bullet points of key capabilities
3. **Architecture** - Simple diagram or description
4. **Prerequisites** - Required tools and versions
5. **Quick Start** - Step-by-step setup (clone, configure, run)
6. **Project Structure** - Directory layout explanation
7. **Configuration** - Environment variables and settings
8. **Development** - Local development workflow
9. **Testing** - How to run tests and checks
10. **Deployment** - CI/CD and deployment process
11. **Monitoring** - Observability and debugging
12. **Contributing** - Guidelines for contributors
13. **Troubleshooting** - Common issues and solutions
14. **Support** - How to get help

Use clear markdown formatting with code blocks, tables where appropriate, and emoji for visual appeal.
Include badges for build status, coverage, license, etc. (use placeholder URLs).
Target audience: experienced developers new to this template.
"""
    
    WORKFLOW_PROMPT = """
You are creating a GitHub Actions workflow for platform engineering best practices.
Generate a production-ready workflow that includes:

1. Build and test stages
2. Security scanning
3. Quality gates
4. Container building (if applicable)
5. Deployment stages (dev/staging/prod)
6. Rollback capability
7. Notification steps

Use matrix builds, caching, and parallel jobs where appropriate.
Include helpful comments explaining each step.
"""
    
    CONFIG_PROMPT = """
You are generating configuration files for a cloud-native application.
Create configuration that includes:

1. Environment-specific settings
2. Feature flags
3. Observability configuration
4. Security settings
5. Resource limits
6. Health check endpoints

Use best practices for configuration management.
Support multiple environments (dev, staging, prod).
"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        self.client = AIClient(provider)
        self.output_dir = Path("outputs/templates")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.templates = self._load_template_registry()
    
    def _load_template_registry(self) -> Dict[str, Dict[str, Any]]:
        """Load available template definitions"""
        
        return {
            "microservice": {
                "name": "microservice-template",
                "description": "Production-ready microservice with observability",
                "language": "Python",
                "framework": "FastAPI",
                "includes": ["api", "database", "caching", "monitoring"],
                "structure": {
                    "src/": ["main.py", "api/", "models/", "services/"],
                    "tests/": ["unit/", "integration/", "e2e/"],
                    "docker/": ["Dockerfile", "docker-compose.yml"],
                    ".github/workflows/": ["ci.yml", "deploy.yml"],
                    "config/": ["dev.yml", "staging.yml", "prod.yml"],
                    "docs/": ["api.md", "architecture.md"],
                    "scripts/": ["setup.sh", "test.sh", "deploy.sh"]
                }
            },
            "cli-tool": {
                "name": "cli-tool-template",
                "description": "Command-line tool with plugin architecture",
                "language": "Go",
                "framework": "Cobra",
                "includes": ["commands", "plugins", "config", "testing"],
                "structure": {
                    "cmd/": ["root.go", "version.go"],
                    "pkg/": ["core/", "plugins/", "utils/"],
                    "internal/": ["config/", "logger/"],
                    "tests/": ["unit/", "integration/"],
                    ".github/workflows/": ["ci.yml", "release.yml"],
                    "docs/": ["usage.md", "plugins.md"],
                    "examples/": ["basic/", "advanced/"]
                }
            },
            "data-pipeline": {
                "name": "data-pipeline-template",
                "description": "Scalable data processing pipeline",
                "language": "Python",
                "framework": "Apache Airflow",
                "includes": ["etl", "streaming", "batch", "monitoring"],
                "structure": {
                    "dags/": ["etl/", "ml/", "reporting/"],
                    "plugins/": ["operators/", "sensors/", "hooks/"],
                    "sql/": ["schemas/", "migrations/"],
                    "tests/": ["dags/", "plugins/"],
                    ".github/workflows/": ["ci.yml", "deploy.yml"],
                    "config/": ["airflow.cfg", "connections.yml"],
                    "docker/": ["Dockerfile", "docker-compose.yml"]
                }
            },
            "ml-service": {
                "name": "ml-service-template",
                "description": "Machine learning model serving template",
                "language": "Python",
                "framework": "FastAPI + MLflow",
                "includes": ["model-serving", "monitoring", "a-b-testing", "drift-detection"],
                "structure": {
                    "models/": ["artifacts/", "registry/"],
                    "src/": ["api/", "preprocessing/", "prediction/"],
                    "training/": ["experiments/", "pipelines/"],
                    "monitoring/": ["drift/", "performance/"],
                    "tests/": ["model/", "api/", "integration/"],
                    ".github/workflows/": ["train.yml", "deploy.yml"],
                    "config/": ["model.yml", "serving.yml"]
                }
            }
        }
    
    def generate_readme(
        self,
        template_type: str,
        custom_config: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate README for template"""
        
        template = self.templates.get(template_type, self.templates["microservice"])
        
        config = {
            **template,
            **(custom_config or {})
        }
        
        user_prompt = f"""
Generate a README.md for this template:

Template Type: {template_type}
Name: {config['name']}
Description: {config['description']}
Language: {config['language']}
Framework: {config['framework']}
Key Features: {', '.join(config['includes'])}

Project Structure:
{json.dumps(config['structure'], indent=2)}

Make it comprehensive, professional, and immediately useful.
Include example commands and configuration.
"""
        
        response = self.client.ask(
            system_prompt=self.README_PROMPT,
            user_prompt=user_prompt,
            max_tokens=2000,
            prompt_type="documentation"
        )
        
        return response.text
    
    def generate_workflow(
        self,
        template_type: str,
        workflow_type: str = "ci"
    ) -> str:
        """Generate GitHub Actions workflow"""
        
        template = self.templates.get(template_type, self.templates["microservice"])
        
        user_prompt = f"""
Generate a GitHub Actions workflow for:
Template: {template['name']}
Language: {template['language']}
Framework: {template['framework']}
Workflow Type: {workflow_type}

Include best practices for {template['language']} projects.
Add caching, parallel jobs, and quality gates.
"""
        
        response = self.client.ask(
            system_prompt=self.WORKFLOW_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1500,
            prompt_type="documentation"
        )
        
        return response.text
    
    def generate_config(
        self,
        template_type: str,
        environment: str = "dev"
    ) -> str:
        """Generate configuration files"""
        
        template = self.templates.get(template_type, self.templates["microservice"])
        
        user_prompt = f"""
Generate configuration for:
Template: {template['name']}
Environment: {environment}
Framework: {template['framework']}

Include settings for all features: {', '.join(template['includes'])}
Use YAML format with clear sections and comments.
"""
        
        response = self.client.ask(
            system_prompt=self.CONFIG_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1000,
            prompt_type="documentation"
        )
        
        return response.text
    
    def scaffold_template(
        self,
        template_type: str,
        output_path: Optional[Path] = None
    ) -> Path:
        """Create complete template structure with files"""
        
        template = self.templates.get(template_type, self.templates["microservice"])
        
        # Determine output path
        if not output_path:
            output_path = self.output_dir / template['name']
        
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Create directory structure
        for dir_path, contents in template['structure'].items():
            full_dir = output_path / dir_path
            full_dir.mkdir(parents=True, exist_ok=True)
            
            for item in contents:
                if item.endswith('/'):
                    (full_dir / item).mkdir(exist_ok=True)
                else:
                    # Create placeholder file
                    file_path = full_dir / item
                    if not file_path.exists():
                        file_path.write_text(f"# {item}\n# Generated by AI Template Generator\n")
        
        # Generate and save README
        with console.status("[bold green]Generating README..."):
            readme_content = self.generate_readme(template_type)
            (output_path / "README.md").write_text(readme_content)
        
        # Generate and save main workflow
        with console.status("[bold green]Generating CI workflow..."):
            workflow_content = self.generate_workflow(template_type, "ci")
            workflow_path = output_path / ".github" / "workflows" / "ci.yml"
            workflow_path.parent.mkdir(parents=True, exist_ok=True)
            workflow_path.write_text(workflow_content)
        
        # Generate and save config
        with console.status("[bold green]Generating configuration..."):
            config_content = self.generate_config(template_type, "dev")
            config_path = output_path / "config" / "dev.yml"
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config_path.write_text(config_content)
        
        # Create additional common files
        self._create_common_files(output_path, template)
        
        return output_path
    
    def _create_common_files(self, output_path: Path, template: Dict[str, Any]):
        """Create common files for all templates"""
        
        # .gitignore
        gitignore = """
# Python
__pycache__/
*.py[cod]
*$py.class
.env
.venv/
venv/

# Go
*.exe
*.dll
*.so
*.dylib
vendor/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.coverage
htmlcov/
.pytest_cache/

# Build
dist/
build/
*.egg-info/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db
"""
        (output_path / ".gitignore").write_text(gitignore.strip())
        
        # .env.example
        env_example = """
# Application
APP_NAME={name}
APP_ENV=development
APP_PORT=8000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# Monitoring
PROMETHEUS_PORT=9090
JAEGER_ENDPOINT=http://localhost:14268

# Feature Flags
FEATURE_NEW_API=false
FEATURE_CACHING=true

# API Keys (obtain from respective services)
API_KEY=your-api-key-here
SECRET_KEY=your-secret-key-here
""".format(name=template['name'])
        
        (output_path / ".env.example").write_text(env_example.strip())
        
        # Makefile
        makefile = """
.PHONY: help setup test run build deploy clean

help:
\t@echo "Available commands:"
\t@echo "  make setup   - Install dependencies"
\t@echo "  make test    - Run tests"
\t@echo "  make run     - Run locally"
\t@echo "  make build   - Build container"
\t@echo "  make deploy  - Deploy to production"
\t@echo "  make clean   - Clean build artifacts"

setup:
\t@echo "Setting up environment..."
\t@./scripts/setup.sh

test:
\t@echo "Running tests..."
\t@./scripts/test.sh

run:
\t@echo "Starting application..."
\t@./scripts/run.sh

build:
\t@echo "Building container..."
\tdocker build -t {name}:latest .

deploy:
\t@echo "Deploying to production..."
\t@./scripts/deploy.sh

clean:
\t@echo "Cleaning up..."
\trm -rf dist/ build/ *.egg-info __pycache__/
""".format(name=template['name'])
        
        (output_path / "Makefile").write_text(makefile.strip())
        
        # LICENSE
        license_text = """MIT License

Copyright (c) 2024 Platform Engineering Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""
        (output_path / "LICENSE").write_text(license_text.strip())
    
    def display_template_tree(self, template_type: str):
        """Display template structure as a tree"""
        
        template = self.templates.get(template_type, self.templates["microservice"])
        
        tree = Tree(f"📁 {template['name']}")
        
        def add_items(parent, structure):
            for path, contents in sorted(structure.items()):
                if path.endswith('/'):
                    folder = parent.add(f"📁 {path}")
                    for item in contents:
                        if item.endswith('/'):
                            folder.add(f"📁 {item}")
                        else:
                            folder.add(f"📄 {item}")
        
        add_items(tree, template['structure'])
        
        # Add common files
        tree.add("📄 README.md")
        tree.add("📄 .gitignore")
        tree.add("📄 .env.example")
        tree.add("📄 Makefile")
        tree.add("📄 LICENSE")
        
        console.print(tree)


@click.command()
@click.option("--generate", type=click.Choice(["readme", "workflow", "config", "full"]),
              help="What to generate")
@click.option("--template", type=click.Choice(["microservice", "cli-tool", "data-pipeline", "ml-service"]),
              default="microservice", help="Template type")
@click.option("--output", type=click.Path(), help="Output directory")
@click.option("--provider", type=click.Choice(["anthropic", "openai", "mock"]),
              help="AI provider to use")
@click.option("--list-templates", is_flag=True, help="List available templates")
@click.option("--scaffold", is_flag=True, help="Create complete template structure")
def main(generate, template, output, provider, list_templates, scaffold):
    """
    AI-Powered Starter Kit and Template Generator
    
    Examples:
        # List available templates
        python ex5_starter_kit.py --list-templates
        
        # Generate README for a template
        python ex5_starter_kit.py --generate readme --template microservice
        
        # Scaffold complete template
        python ex5_starter_kit.py --scaffold --template microservice
        
        # Generate with mock provider
        python ex5_starter_kit.py --provider mock --generate full --template cli-tool
    """
    
    # Initialize generator
    provider_enum = None
    if provider:
        provider_enum = AIProvider[provider.upper()]
    
    generator = TemplateGenerator(provider_enum)
    
    # Handle different modes
    if list_templates:
        console.print("[bold cyan]Available Templates:[/bold cyan]\n")
        
        for key, tmpl in generator.templates.items():
            console.print(Panel(
                f"[bold]{tmpl['name']}[/bold]\n"
                f"{tmpl['description']}\n\n"
                f"Language: {tmpl['language']}\n"
                f"Framework: {tmpl['framework']}\n"
                f"Features: {', '.join(tmpl['includes'])}",
                title=f"📦 {key}",
                border_style="cyan"
            ))
        return
    
    if scaffold or generate == "full":
        # Create complete template
        console.print(f"[bold cyan]Scaffolding {template} template...[/bold cyan]\n")
        
        # Display structure
        generator.display_template_tree(template)
        
        # Generate template
        output_path = Path(output) if output else None
        with console.status("[bold green]Creating template structure..."):
            result_path = generator.scaffold_template(template, output_path)
        
        console.print(f"\n[green]✅ Template created at: {result_path}[/green]")
        
        # Display next steps
        console.print("\n[bold cyan]Next Steps:[/bold cyan]")
        console.print(f"1. cd {result_path}")
        console.print("2. make setup")
        console.print("3. make test")
        console.print("4. git init && git add .")
        console.print("5. Customize for your needs!")
        
        return
    
    if generate:
        # Generate specific component
        if generate == "readme":
            content = generator.generate_readme(template)
            output_file = Path(output) if output else generator.output_dir / f"{template}_README.md"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(content)
            
            console.print("[bold cyan]Generated README:[/bold cyan]")
            console.print(Markdown(content))
            console.print(f"\n[green]Saved to: {output_file}[/green]")
        
        elif generate == "workflow":
            content = generator.generate_workflow(template)
            output_file = Path(output) if output else generator.output_dir / f"{template}_workflow.yml"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(content)
            
            console.print("[bold cyan]Generated Workflow:[/bold cyan]")
            syntax = Syntax(content, "yaml", theme="monokai")
            console.print(syntax)
            console.print(f"\n[green]Saved to: {output_file}[/green]")
        
        elif generate == "config":
            content = generator.generate_config(template)
            output_file = Path(output) if output else generator.output_dir / f"{template}_config.yml"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(content)
            
            console.print("[bold cyan]Generated Configuration:[/bold cyan]")
            syntax = Syntax(content, "yaml", theme="monokai")
            console.print(syntax)
            console.print(f"\n[green]Saved to: {output_file}[/green]")
    
    else:
        # Show help
        ctx = click.get_current_context()
        click.echo(ctx.get_help())


if __name__ == "__main__":
    main()
