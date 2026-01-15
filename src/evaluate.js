#!/usr/bin/env node

// Main evaluation service that orchestrates LLM-based code evaluation
// This service reads code, compares it against baseline standards,
// and generates evaluation scores from multiple AI models

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Import LLM model evaluators
import { evaluateWithGPT4 } from './models/openai-evaluator.js';
import { evaluateWithClaude } from './models/claude-evaluator.js';
import { evaluateWithGemini } from './models/gemini-evaluator.js';

// Import baseline loader and report generator
import { loadBaseline } from './utils/baseline-loader.js';
import { generateReport } from './utils/report-generator.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('model', {
    alias: 'm',
    description: 'AI model to use for evaluation',
    type: 'string',
    choices: ['gpt-4', 'claude-3', 'gemini-pro', 'all'],
    default: 'all'
  })
  .option('input', {
    alias: 'i',
    description: 'Path to code directory or file to evaluate',
    type: 'string',
    default: './code-to-evaluate'
  })
  .option('baseline', {
    alias: 'b',
    description: 'Path to baseline evaluation criteria',
    type: 'string',
    default: './evaluation-baselines/default-baseline.json'
  })
  .option('output', {
    alias: 'o',
    description: 'Output directory for results',
    type: 'string',
    default: './evaluation-results'
  })
  .option('generate-report', {
    alias: 'r',
    description: 'Generate HTML report',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Main evaluation function
async function evaluateCode() {
  console.log(chalk.bold.blue('🚀 Starting LLM Code Evaluation Service'));

  // Load baseline evaluation criteria
  const baseline = loadBaseline(argv.baseline);
  console.log(chalk.green(`✓ Loaded baseline criteria from ${argv.baseline}`));

  // Read code files to evaluate
  const codeFiles = loadCodeFiles(argv.input);
  console.log(chalk.green(`✓ Found ${codeFiles.length} files to evaluate`));

  // Create output directory if it doesn't exist
  if (!existsSync(argv.output)) {
    mkdirSync(argv.output, { recursive: true });
  }

  // Initialize results storage
  const evaluationResults = {
    timestamp: new Date().toISOString(),
    baseline: baseline.name || 'default',
    files: codeFiles.map(f => f.path),
    evaluations: {}
  };

  // Determine which models to use
  const modelsToRun = argv.model === 'all'
    ? ['gpt-4', 'claude-3', 'gemini-pro']
    : [argv.model];

  // Run evaluations for each model
  for (const model of modelsToRun) {
    console.log(chalk.yellow(`\n📊 Evaluating with ${model}...`));

    try {
      let modelResults;

      // Call appropriate evaluator based on model
      switch (model) {
        case 'gpt-4':
          modelResults = await evaluateWithGPT4(codeFiles, baseline);
          break;
        case 'claude-3':
          modelResults = await evaluateWithClaude(codeFiles, baseline);
          break;
        case 'gemini-pro':
          modelResults = await evaluateWithGemini(codeFiles, baseline);
          break;
      }

      evaluationResults.evaluations[model] = modelResults;
      console.log(chalk.green(`✓ ${model} evaluation complete. Score: ${modelResults.overallScore}/100`));

      // Save individual model results
      const modelOutputPath = path.join(argv.output, `${model}-results.json`);
      writeFileSync(modelOutputPath, JSON.stringify(modelResults, null, 2));

    } catch (error) {
      console.error(chalk.red(`✗ Error evaluating with ${model}:`, error.message));
      evaluationResults.evaluations[model] = {
        error: error.message,
        overallScore: 0
      };
    }
  }

  // Calculate aggregate scores
  const aggregateScore = calculateAggregateScore(evaluationResults.evaluations);
  evaluationResults.aggregateScore = aggregateScore;

  // Save consolidated results
  const consolidatedPath = path.join(argv.output, 'consolidated-results.json');
  writeFileSync(consolidatedPath, JSON.stringify(evaluationResults, null, 2));
  console.log(chalk.green(`\n✓ Results saved to ${argv.output}`));

  // Generate summary for CI/CD integration
  const summary = {
    overallScore: aggregateScore,
    gpt4Score: evaluationResults.evaluations['gpt-4']?.overallScore || 0,
    claude3Score: evaluationResults.evaluations['claude-3']?.overallScore || 0,
    geminiScore: evaluationResults.evaluations['gemini-pro']?.overallScore || 0,
    timestamp: evaluationResults.timestamp
  };

  writeFileSync(path.join(argv.output, 'summary.json'), JSON.stringify(summary, null, 2));

  // Generate HTML report if requested
  if (argv.generateReport) {
    console.log(chalk.yellow('\n📝 Generating HTML report...'));
    const reportPath = generateReport(evaluationResults, argv.output);
    console.log(chalk.green(`✓ Report generated: ${reportPath}`));
  }

  // Print summary to console
  console.log(chalk.bold.blue('\n📈 Evaluation Summary:'));
  console.log(chalk.white(`  Overall Score: ${chalk.bold(aggregateScore)}/100`));
  Object.entries(evaluationResults.evaluations).forEach(([model, results]) => {
    if (!results.error) {
      console.log(chalk.white(`  ${model}: ${results.overallScore}/100`));
    }
  });

  // Exit with appropriate code for CI/CD
  // Fail if score is below threshold (configurable, default 70)
  const threshold = process.env.EVALUATION_THRESHOLD || 70;
  if (aggregateScore < threshold) {
    console.log(chalk.red(`\n✗ Code quality below threshold (${threshold}). Failing build.`));
    process.exit(1);
  } else {
    console.log(chalk.green(`\n✓ Code quality meets threshold (${threshold}). Build passing.`));
    process.exit(0);
  }
}

// Load code files from directory or single file
function loadCodeFiles(inputPath) {
  const files = [];

  if (!existsSync(inputPath)) {
    throw new Error(`Input path does not exist: ${inputPath}`);
  }

  const stats = require('fs').statSync(inputPath);

  if (stats.isDirectory()) {
    // Recursively read all code files
    const entries = readdirSync(inputPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(inputPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        // Recursively process subdirectories
        files.push(...loadCodeFiles(fullPath));
      } else if (entry.isFile() && isCodeFile(entry.name)) {
        // Add code files
        files.push({
          path: fullPath,
          name: entry.name,
          content: readFileSync(fullPath, 'utf8')
        });
      }
    }
  } else {
    // Single file
    files.push({
      path: inputPath,
      name: path.basename(inputPath),
      content: readFileSync(inputPath, 'utf8')
    });
  }

  return files;
}

// Check if file is a code file based on extension
function isCodeFile(filename) {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs',
    '.go', '.rs', '.swift', '.kt', '.rb', '.php', '.scala', '.r', '.m'
  ];

  return codeExtensions.some(ext => filename.endsWith(ext));
}

// Calculate aggregate score from all model evaluations
function calculateAggregateScore(evaluations) {
  const validScores = Object.values(evaluations)
    .filter(e => !e.error && e.overallScore !== undefined)
    .map(e => e.overallScore);

  if (validScores.length === 0) return 0;

  // Calculate weighted average (could be customized)
  return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
}

// Run the evaluation
evaluateCode().catch(error => {
  console.error(chalk.red('Fatal error:', error));
  process.exit(1);
});