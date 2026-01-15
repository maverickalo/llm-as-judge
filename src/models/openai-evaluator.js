// OpenAI GPT-4 model evaluator
// This module handles code evaluation using OpenAI's GPT-4 model

import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Evaluates code files using GPT-4 against baseline criteria
 * @param {Array} codeFiles - Array of code file objects with path and content
 * @param {Object} baseline - Baseline evaluation criteria
 * @returns {Object} Evaluation results with scores and feedback
 */
export async function evaluateWithGPT4(codeFiles, baseline) {
  const results = {
    model: 'gpt-4',
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
      console.log(`  Evaluating ${file.name} with GPT-4...`);

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

      // Call GPT-4 API
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      // Parse the response
      const evaluation = JSON.parse(response.choices[0].message.content);

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

  // Generate summary using GPT-4
  try {
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a code review expert. Provide a concise summary of the code evaluation results.'
        },
        {
          role: 'user',
          content: `Summarize these evaluation results in 2-3 sentences:\n${JSON.stringify(results.fileEvaluations, null, 2)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });

    results.summary = summaryResponse.choices[0].message.content;
  } catch (error) {
    results.summary = 'Summary generation failed.';
  }

  return results;
}

/**
 * Constructs the system prompt with baseline criteria
 * @param {Object} baseline - Baseline evaluation criteria
 * @returns {string} System prompt for GPT-4
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
Be fair but thorough in your evaluation.`;
}