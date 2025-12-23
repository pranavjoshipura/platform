# Agentic AI in Platform Engineering

Interactive demos showcasing how AI agents can solve platform engineering challenges using Claude API and Python used in the Agentic AI in Platform Engineering Course

## Overview

This project demonstrates four AI agent patterns for platform engineering:

1. **Workflow Diagnostic Agent** - Automatically diagnoses failed CI/CD workflows and provides root cause analysis with suggested fixes
2. **Release Readiness Agent** - Evaluates quality gates to make intelligent release/rollback decisions with confidence scores
3. **Multi-Agent Orchestration** - Cost optimizer and incident responder agents coordinate to balance efficiency with reliability
4. **Developer Portal Agent** - AI-driven onboarding and self-service endpoint for intelligent developer guidance


##  Learning Resources

- [O'Reilly/Pearson Course Site](https://www.oreilly.com/live-events/agentic-ai-in-platform-engineering/0642572268862/)
- [Effective Platform Engineering Book](https://effectiveplatformengineering.com)
- [Online Demos](https://agentic-pe.platformetrics.com)
- [Alternate Python CLI versions](https://github.com/achankra/agentic-ai-platformengineering/tree/main/python)


## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend Functions**: Supabase Edge Functions (Deno)
- **AI Integration**: Claude API (Anthropic)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An Anthropic API key for Claude

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```
ANTHROPIC_API_KEY=your_api_key_here
```


## Repository Directory Structure

```
agentic-ai-platformengineering/
├── public/                          # Frontend static assets (Vite)
├── src/                             # Frontend source (React/TS)
├── supabase/   
└── functions/        # Edge functions for AI agents
    ├── workflow-diagnostic/
    ├── release-readiness/
    ├── multi-agent/
    └── developer-portal/
├── README.md
├── SETUP.md
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
└── python/                          # Course Python demos & exercises (Alternative to Vite/React/TS)
    ├── ai_client.py
    ├── exercises/
    │   ├── ai_client.py
    │   ├── ex1_diagnostic_agent.py
    │   ├── ex2_quality_gates.py
    │   ├── ex3_multi_agent.py
    │   ├── ex4_developer_portal.py
    │   └── ex5_starter_kit.py
    ├── logs/
    │   └── sample.log
    ├── outputs/
    │   ├── diagnostics/
    │   │   └── diagnostic_20251114_205321.json
    │   └── quality-gates/
    │       └── decision_20251222_173144.json
    ├── README.md
    ├── requirements.txt
    └── setup.py
```

## Demo Features

- **Live Execution**: Run AI agents in real-time
- **Formatted Output**: Toggle between raw and formatted markdown output
- **Workflow Diagrams**: Visual representation of agent decision flows
- **Source Code**: View the Python implementation for each agent

## Deployment

The application can be deployed to any static hosting platform:


The build output will be in the `dist` directory.


### Deploy to GitHub Pages

*Start with deployment helper*

```
npm install --save-dev gh-pages

```

*Then update the package.json file*
```
{
  "homepage": "https://achankra.github.io/agentic-ai-platformengineering",
  "scripts": {
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}
```
*and update the vite.config.ts file*
```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "/agentic-ai-platformengineering/", 
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

```

*Deploy*

```
npm install
npm install -D gh-pages
npm run build # creates the dist/ folder
npm run deploy

```

*Look for the following URL (Obviously replace the subdomain with whatever appropriate)*
https://achankra.github.io/agentic-ai-platformengineering

## License

MIT
