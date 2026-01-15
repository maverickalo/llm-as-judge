// Google Gemini Pro model evaluator
// This module handles code evaluation using Google's Gemini Pro model

import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization of Gemini client
let genAI = null;

function getGeminiClient() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }
  return genAI;
}

/**
 * Evaluates code files using Gemini Pro against baseline criteria
 * @param {Array} codeFiles - Array of code file objects with path and content
 * @param {Object} baseline - Baseline evaluation criteria
 * @returns {Object} Evaluation results with scores and feedback
 */
export async function evaluateWithGemini(codeFiles, baseline) {
  const client = getGeminiClient();
  const results = {
    model: 'gemini-pro',
    timestamp: new Date().toISOString(),
    fileEvaluations: [],
    overallScore: 0,
    summary: ''
  };

  // Get the Gemini model
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  // Evaluate each file
  for (const file of codeFiles) {
    try {
      console.log(`  Evaluating ${file.name} with Gemini Pro...`);

      // Create the evaluation prompt
      const prompt = `
You are an expert code reviewer evaluating code quality against specific baseline criteria.

Baseline Evaluation Criteria:
${JSON.stringify(baseline, null, 2)}

Please evaluate the following code file against the provided baseline criteria.
Provide a score from 0-100 and detailed feedback.

File: ${file.name}
Code:
\`\`\`
${file.content}
\`\`\`

Evaluate the code based on:
1. Compliance with the baseline criteria
2. Code quality metrics (readability, maintainability, efficiency)
3. Best practices for the programming language
4. Security considerations
5. Documentation and comments

Return your evaluation in JSON format with the following structure:
{
  "score": <0-100>,
  "strengths": [<list of strengths>],
  "weaknesses": [<list of weaknesses>],
  "suggestions": [<list of improvement suggestions>],
  "compliance": {
    <for each baseline criterion, true/false>
  }
}

Provide only the JSON response, no additional text.`;

      // Generate response from Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse JSON response from Gemini');
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

  // Generate summary using Gemini
  try {
    const summaryPrompt = `You are a code review expert. Provide a concise summary (2-3 sentences) of these code evaluation results:\n${JSON.stringify(results.fileEvaluations, null, 2)}`;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summaryResponse = await summaryResult.response;
    results.summary = summaryResponse.text();
  } catch (error) {
    results.summary = 'Summary generation failed.';
  }

  return results;
}

/**
 * Alternative implementation using Vertex AI (for production use)
 * Requires Google Cloud project configuration
 */
export async function evaluateWithVertexAI(codeFiles, baseline) {
  // This would use the Vertex AI SDK for more robust production deployment
  // Currently using the simpler Gemini API for demonstration

  console.log('Vertex AI evaluation not implemented. Using standard Gemini API.');
  return evaluateWithGemini(codeFiles, baseline);
}