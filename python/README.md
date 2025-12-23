# Agentic AI in Platform Engineering - Python Demo Version

A comprehensive workshop repository for learning how to integrate AI agents into platform engineering workflows. This workshop provides hands-on exercises aligned with the 5-segment O'Reilly/Pearson live training course. *Note that this is an alternative method to the React/Typescript approach* 

## 🎯 Workshop Objectives

- Diagnose and fix CI/CD pipeline failures using AI
- Implement AI-enhanced quality gates and release decisions
- Build operational intelligence with multi-agent coordination
- Create self-service developer experiences with AI assistance
- Develop starter kits and templates with AI-powered documentation

## 🚀 Quick Start

### Prerequisites

- Python 3.10+ (3.11 recommended)
- GitHub account
- Docker (optional, for containerized execution)
- Anthropic API key [Get it here](https://console.anthropic.com/login) (optional - mock mode available!)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/agentic-ai-workshop.git
cd agentic-ai-workshop

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your API key (or leave blank for mock mode)
```

## 📚 Workshop Segments

### Segment 1: AI-Powered Diagnostics


Learn to build diagnostic agents that analyze failing CI/CD pipelines and provide actionable fixes.

```bash
# Run the diagnostic exercise
python exercises/ex1_diagnostic_agent.py --mode interactive

# Analyze a real workflow failure
python exercises/ex1_diagnostic_agent.py logs/sample_failure.log
```

**Key Concepts:**
- Log analysis and pattern recognition
- Root cause identification
- Automated fix suggestions
- Integration with GitHub Actions

### Segment 2: AI-Enhanced CI/CD Pipelines


Implement intelligent quality gates that make release/rollback decisions based on multiple metrics.

```bash
# Run quality gate analysis
python exercises/ex2_quality_gates.py --analyze

# Generate release decision
python exercises/ex2_quality_gates.py --decide
```

**Key Concepts:**
- Multi-metric quality assessment
- Risk-based decision making
- Progressive delivery strategies
- Automated rollback triggers

### Segment 3: Operational Intelligence


Build multi-agent systems for cost optimization and incident response.

```bash
# Run multi-agent simulation
python exercises/ex3_multi_agent.py --scenario cost-optimization

# Incident response coordination
python exercises/ex3_multi_agent.py --scenario incident-response
```

**Key Concepts:**
- Agent coordination patterns
- Cost vs. performance trade-offs
- Incident triage and response
- Observability integration

### Segment 4: Self-Service Developer Experience


Create AI-powered developer portals that provide personalized onboarding and recommendations.

```bash
# Generate onboarding tasks
python exercises/ex4_developer_portal.py --project sample-service

# Analyze service maturity
python exercises/ex4_developer_portal.py --assess maturity
```

**Key Concepts:**
- Personalized recommendations
- Service maturity assessment
- Golden path templates
- Developer productivity metrics

### Segment 5: Starter Kits & Templates


Build reusable templates with AI-generated documentation and configuration.

```bash
# Generate template documentation
python exercises/ex5_starter_kit.py --generate readme

# Create project scaffold
python exercises/ex5_starter_kit.py --scaffold microservice
```

**Key Concepts:**
- Template generation
- Documentation automation
- Best practices codification
- Reusable workflows

## 🔧 Configuration

### API Keys

The workshop supports multiple AI providers with automatic fallback:

1. **Anthropic Claude** (Primary)
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```

2. **OpenAI** (Fallback)
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

3. **Mock Mode** (No API needed)
   ```bash
   export USE_MOCK_AI=true
   ```

### Docker Support

Run exercises in a containerized environment:

```bash
# Build the workshop image
docker build -t agentic-workshop .

# Run with API keys
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/outputs:/app/outputs \
  agentic-workshop

# Run in mock mode
docker run -it \
  -e USE_MOCK_AI=true \
  -v $(pwd)/outputs:/app/outputs \
  agentic-workshop
```

## 📊 Workshop Outputs

All exercise outputs are saved to the `outputs/` directory:

```
outputs/
├── diagnostics/       # Segment 1 analysis reports
├── quality-gates/     # Segment 2 decision logs
├── multi-agent/       # Segment 3 coordination traces
├── portal/           # Segment 4 recommendations
└── templates/        # Segment 5 generated artifacts
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📝 License

This workshop is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Anthropic for Claude API
- OpenAI for GPT models
- The Platform Engineering community

## 🚨 Troubleshooting

### Common Issues

**API Key Not Working**
```bash
# Test your API key
python utils/test_api.py

# Use mock mode as fallback
export USE_MOCK_AI=true
```

**Module Import Errors**
```bash
# Ensure you're in the virtual environment
which python  # Should show .venv/bin/python

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

**GitHub Actions Not Triggering**
- Check you're pushing to the correct branch
- Verify workflow paths match changed files
- Check Actions tab for workflow status

## 📧 Support

For workshop support, please:
1. Check the [FAQ](./docs/FAQ.md)
2. Search existing [Issues](https://github.com/your-org/agentic-ai-workshop/issues)
3. Create a new issue with the `workshop-help` label

---

**Ready to revolutionize your platform engineering with AI? Let's get started! 🚀**
