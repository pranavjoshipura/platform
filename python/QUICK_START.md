# 🚀 Quick Start Guide

## Installation (2 minutes)

```bash
# 1. Extract the workshop files
unzip agentic-ai-workshop-fixed.zip
cd agentic-ai-workshop-fixed

# 2. Run the setup script
python3 setup.py

# That's it! You're ready to go 🎉
```

## Test Your Installation

```bash
# Test with mock mode (no API key needed)
python3 exercises/ex1_diagnostic_agent.py logs/sample.log --provider mock
```

You should see a diagnostic analysis of the sample failure log!

## Try All 5 Exercises

### Exercise 1: Diagnose CI/CD Failures
```bash
# Analyze the provided sample log
python3 exercises/ex1_diagnostic_agent.py logs/sample.log --provider mock

# Interactive mode - paste your own logs
python3 exercises/ex1_diagnostic_agent.py --mode interactive --provider mock
```

### Exercise 2: Quality Gates Decision
```bash
# Simulate a good deployment scenario
python3 exercises/ex2_quality_gates.py --simulate good --provider mock

# Simulate a problematic deployment
python3 exercises/ex2_quality_gates.py --simulate bad --provider mock
```

### Exercise 3: Multi-Agent Coordination
```bash
# Run cost optimization scenario
python3 exercises/ex3_multi_agent.py --scenario cost-optimization --provider mock

# Run incident response scenario
python3 exercises/ex3_multi_agent.py --scenario incident-response --provider mock
```

### Exercise 4: Developer Portal
```bash
# Assess service maturity
python3 exercises/ex4_developer_portal.py --project payment-service --provider mock

# List available services
python3 exercises/ex4_developer_portal.py --list-services
```

### Exercise 5: Generate Starter Kits
```bash
# List available templates
python3 exercises/ex5_starter_kit.py --list-templates

# Generate a README for microservice template
python3 exercises/ex5_starter_kit.py --generate readme --template microservice --provider mock

# Scaffold a complete template
python3 exercises/ex5_starter_kit.py --scaffold --template microservice --provider mock
```

## Using Real AI Providers (Optional)

If you have API keys:

1. Edit the `.env` file:
```bash
# For Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-key-here

# For OpenAI
OPENAI_API_KEY=sk-your-key-here
```

2. Run without the `--provider mock` flag:
```bash
python3 exercises/ex1_diagnostic_agent.py logs/sample.log
```

## Common Issues

### ModuleNotFoundError
- Make sure you're in the workshop directory
- Run `python3 setup.py` to install dependencies

### No module named 'rich'
- Run: `pip install -r requirements.txt`

### Permission denied
- On Mac/Linux: `chmod +x setup.py`

## Workshop Structure

```
agentic-ai-workshop-fixed/
├── exercises/          # All 5 workshop exercises
├── logs/              # Sample log files
├── outputs/           # Generated reports and artifacts
├── ai_client.py       # Multi-provider AI client
├── setup.py           # One-click setup
└── requirements.txt   # Python dependencies
```

## Tips

- 🎭 **Mock Mode**: All exercises work without API keys using realistic pre-generated responses
- 💰 **Cost**: If using real APIs, each exercise costs < $0.01
- 📊 **Outputs**: Check the `outputs/` folder for generated reports
- 🎨 **Rich UI**: Exercises use colored terminal output for better readability
- ⌨️ **Help**: Add `--help` to any exercise for usage information

## Support

- Check the main README.md for detailed documentation
- All exercises include `--help` flag for usage info
- Mock mode provides realistic responses for learning

Happy learning! 🚀
