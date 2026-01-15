// Anthropic Claude 3 model evaluator
// This module handles code evaluation using Anthropic's Claude 3 model

import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization of Anthropic client
let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

/**
 * Evaluates code files using Claude 3 against baseline criteria
 * @param {Array} codeFiles - Array of code file objects with path and content
 * @param {Object} baseline - Baseline evaluation criteria
 * @returns {Object} Evaluation results with scores and feedback
 */
export async function evaluateWithClaude(codeFiles, baseline) {
  const client = getAnthropicClient();
  const results = {
    model: 'claude-3',
    timestamp: new Date().toISOString(),
    fileEvaluations: [],
    overallScore: 0,
    summary: ''
  };

  // Construct the system prompt with baseline criteria
  const systemPrompt = constructSystemPrompt(baseline);

  // Evaluate each file
  for (const file of codeFiles) {
    try {
      console.log(`  Evaluating ${file.name} with Claude 3...`);

      // Create the evaluation prompt
      const userPrompt = `
Please evaluate the following code file against the provided baseline criteria.
Provide a score from 0-100 and detailed feedback.

File: ${file.name}
Code:
\`\`\`
${file.content}
\`\`\`

Return your evaluation in JSON format with the following structure:
{
  "score": <0-100>,
  "strengths": [<list of strengths>],
  "weaknesses": [<list of weaknesses>],
  "suggestions": [<list of improvement suggestions>],
  "compliance": {
    <for each baseline criterion, true/false>
  }
}`;

      // Call Claude API
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent evaluation
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      // Parse the response (extract JSON from the text)
      const responseText = response.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse JSON response from Claude');
      }

      const evaluation = JSON.parse(jsonMatch[0]);

      // Add to results
      results.fileEvaluations.push({
        file: file.name,
        path: file.path,
        score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        suggestions: evaluation.suggestions,
        compliance: evaluation.compliance
      });

    } catch (error) {
      console.error(`  Error evaluating ${file.name}:`, error.message);
      results.fileEvaluations.push({
        file: file.name,
        path: file.path,
        score: 0,
        error: error.message
      });
    }
  }

  // Calculate overall score
  const validScores = results.fileEvaluations
    .filter(e => !e.error)
    .map(e => e.score);

  if (validScores.length > 0) {
    results.overallScore = Math.round(
      validScores.reduce((a, b) => a + b, 0) / validScores.length
    );
  }

  // Generate summary using Claude
  try {
    const summaryResponse = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 200,
      temperature: 0.5,
      system: 'You are a code review expert. Provide a concise summary of the code evaluation results.',
      messages: [
        {
          role: 'user',
          content: `Summarize these evaluation results in 2-3 sentences:\n${JSON.stringify(results.fileEvaluations, null, 2)}`
        }
      ]
    });

    results.summary = summaryResponse.content[0].text;
  } catch (error) {
    results.summary = 'Summary generation failed.';
  }

  return results;
}

/**
 * Constructs the system prompt with baseline criteria
 * @param {Object} baseline - Baseline evaluation criteria
 * @returns {string} System prompt for Claude
 */
function constructSystemPrompt(baseline) {
  return `You are an expert code reviewer evaluating code quality against specific baseline criteria.

Baseline Evaluation Criteria:
${JSON.stringify(baseline, null, 2)}

Evaluate code based on:
1. Compliance with the baseline criteria
2. Code quality metrics (readability, maintainability, efficiency)
3. Best practices for the programming language
4. Security considerations
5. Documentation and comments

Provide constructive feedback and actionable suggestions.
Be fair but thorough in your evaluation.
Always return your evaluation in valid JSON format.`;
}