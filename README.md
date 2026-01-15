# LLM Code Judge - AI-Powered Code Evaluation CI/CD Pipeline

An automated CI/CD pipeline that evaluates code quality using multiple Large Language Models (LLMs) as judges. The system compares your code against customizable baseline criteria and provides comprehensive feedback from GPT-4, Claude 3, and Gemini Pro.

## 🎯 Features

- **Multi-Model Evaluation**: Get diverse perspectives from GPT-4, Claude 3, and Gemini Pro
- **Customizable Baselines**: Define your own code quality standards in JSON format
- **Automated CI/CD Integration**: GitHub Actions workflow for automatic evaluation on push/PR
- **Comprehensive Reporting**: HTML reports with detailed feedback and scoring
- **Flexible Scoring**: Weighted criteria with configurable passing thresholds
- **Security-First**: Built-in security checks and vulnerability detection

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- Git
- API keys for OpenAI, Anthropic, and Google AI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/llm-code-judge.git
cd llm-code-judge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Running Locally

Evaluate code in the `code-to-evaluate` directory:

```bash
# Evaluate with all models
npm run evaluate

# Evaluate with specific model
npm run evaluate -- --model gpt-4

# Use custom baseline
npm run evaluate -- --baseline ./my-baseline.json

# Generate HTML report
npm run evaluate -- --generate-report
```

## 📁 Project Structure

```
llm-code-judge/
├── .github/
│   └── workflows/
│       └── code-evaluation.yml     # GitHub Actions workflow
├── src/
│   ├── evaluate.js                 # Main evaluation orchestrator
│   ├── models/
│   │   ├── openai-evaluator.js    # GPT-4 evaluation logic
│   │   ├── claude-evaluator.js    # Claude 3 evaluation logic
│   │   └── gemini-evaluator.js    # Gemini Pro evaluation logic
│   └── utils/
│       ├── baseline-loader.js     # Baseline criteria loader
│       └── report-generator.js    # HTML report generator
├── evaluation-baselines/
│   └── default-baseline.json      # Default evaluation criteria
├── code-to-evaluate/              # Place code to evaluate here
│   ├── example-good.js           # Example of good code
│   └── example-poor.js           # Example of poor code
├── evaluation-results/            # Generated results directory
└── package.json
```

## 🔧 Configuration

### Baseline Criteria

Create custom baseline criteria by modifying `evaluation-baselines/default-baseline.json`:

```json
{
  "name": "My Custom Baseline",
  "criteria": [
    {
      "id": "code-structure",
      "description": "Code follows proper architectural patterns",
      "weight": 0.20,
      "checkpoints": [
        "Clear separation of concerns",
        "Proper use of design patterns"
      ]
    }
  ],
  "scoringRules": {
    "passingScore": 70,
    "excellentScore": 90
  }
}
```

### GitHub Actions Setup

1. Add secrets to your GitHub repository:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY`

2. The pipeline automatically runs on:
   - Push to `main` or `develop` branches
   - Pull requests to `main`
   - Manual workflow dispatch

## 📊 Evaluation Criteria

The default baseline evaluates code across these dimensions:

1. **Code Structure** (15%)
   - Architectural patterns
   - Separation of concerns
   - File organization

2. **Code Readability** (20%)
   - Variable naming
   - Code formatting
   - Self-documenting code

3. **Error Handling** (15%)
   - Try-catch blocks
   - Error recovery
   - Logging

4. **Security Practices** (20%)
   - Input validation
   - SQL injection prevention
   - XSS protection

5. **Performance** (10%)
   - Algorithm efficiency
   - Resource usage
   - Caching strategies

6. **Test Coverage** (15%)
   - Unit tests
   - Integration tests
   - Edge cases

7. **Documentation** (5%)
   - Function documentation
   - API documentation
   - README files

## 🎨 Customization

### Adding New Models

To add support for a new LLM:

1. Create a new evaluator in `src/models/`:
```javascript
// src/models/my-model-evaluator.js
export async function evaluateWithMyModel(codeFiles, baseline) {
  // Implementation
}
```

2. Import and integrate in `src/evaluate.js`

### Custom Scoring Rules

Modify the scoring algorithm in `src/utils/baseline-loader.js`:

```javascript
scoringRules: {
  passingScore: 70,
  weightingMethod: 'weighted-average',
  penaltyForMissingCriteria: 10
}
```

## 📈 CI/CD Integration

The GitHub Actions workflow:

1. Triggers on code changes
2. Runs evaluation against all three models
3. Generates consolidated reports
4. Comments results on pull requests
5. Fails builds below threshold scores

### Example PR Comment

```
## 🎯 LLM Code Evaluation Results

### Overall Score: 82/100

**GPT-4 Score:** 85/100
**Claude 3 Score:** 80/100
**Gemini Pro Score:** 81/100
```

## 🔐 Security Considerations

- API keys stored as environment variables
- No hardcoded credentials
- Input sanitization for all user inputs
- XSS protection in HTML report generation
- Secure HTTPS connections for API calls

## 🧪 Testing

Run the evaluation on example files:

```bash
# Test with good code example
npm run evaluate -- --input ./code-to-evaluate/example-good.js

# Test with poor code example
npm run evaluate -- --input ./code-to-evaluate/example-poor.js
```

## 📝 Command Line Options

```bash
Options:
  -m, --model           AI model to use [gpt-4, claude-3, gemini-pro, all]
  -i, --input           Path to code directory or file
  -b, --baseline        Path to baseline criteria JSON
  -o, --output          Output directory for results
  -r, --generate-report Generate HTML report
  -h, --help           Show help
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this in your projects!

## 🆘 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure all API keys are correctly set in `.env`
2. **Rate Limiting**: Add delays between API calls if hitting rate limits
3. **Memory Issues**: Process large codebases in batches

### Debug Mode

Enable verbose logging:
```bash
VERBOSE=true npm run evaluate
```

## 🚦 Roadmap

- [ ] Support for more programming languages
- [ ] Integration with more LLMs (Llama, Mistral)
- [ ] Real-time evaluation in VS Code extension
- [ ] Comparative analysis between versions
- [ ] Team-specific baseline templates
- [ ] Slack/Discord notifications

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

---

Built with ❤️ for better code quality through AI-powered evaluation