// Report generator utility
// This module generates HTML reports from evaluation results

import { writeFileSync } from 'fs';
import path from 'path';

/**
 * Generates an HTML report from evaluation results
 * @param {Object} results - Evaluation results object
 * @param {string} outputDir - Directory to save the report
 * @returns {string} Path to the generated report
 */
export function generateReport(results, outputDir) {
  const reportPath = path.join(outputDir, 'evaluation-report.html');

  // Generate HTML content
  const htmlContent = generateHTMLContent(results);

  // Write the report file
  writeFileSync(reportPath, htmlContent, 'utf8');

  return reportPath;
}

/**
 * Generates the HTML content for the report
 * @param {Object} results - Evaluation results
 * @returns {string} HTML content
 */
function generateHTMLContent(results) {
  const modelResults = results.evaluations || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM Code Evaluation Report</title>
    <style>
        /* Modern, clean CSS styling for the report */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .timestamp {
            opacity: 0.9;
            font-size: 0.9rem;
        }

        .summary {
            padding: 40px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }

        .summary h2 {
            color: #495057;
            margin-bottom: 20px;
        }

        .score-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .score-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .score-value {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .score-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-top: 5px;
        }

        .model-results {
            padding: 40px;
        }

        .model-section {
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }

        .model-name {
            font-size: 1.5rem;
            color: #495057;
        }

        .model-score {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }

        .file-evaluation {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }

        .file-name {
            font-weight: bold;
            color: #495057;
            margin-bottom: 10px;
        }

        .evaluation-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        }

        .detail-section {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .detail-title {
            font-weight: bold;
            color: #6c757d;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }

        .detail-list {
            list-style: none;
            padding-left: 0;
        }

        .detail-list li {
            padding: 3px 0;
            font-size: 0.85rem;
        }

        .strengths li::before {
            content: "✅ ";
        }

        .weaknesses li::before {
            content: "⚠️ ";
        }

        .suggestions li::before {
            content: "💡 ";
        }

        .error {
            background: #fee;
            border-left-color: #dc3545;
            color: #721c24;
        }

        .footer {
            padding: 20px;
            text-align: center;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 0.9rem;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin: 0 2px;
        }

        .badge-success {
            background: #d4edda;
            color: #155724;
        }

        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }

        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }

        @media (max-width: 768px) {
            .score-grid {
                grid-template-columns: 1fr;
            }

            .evaluation-details {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 LLM Code Evaluation Report</h1>
            <p class="timestamp">Generated on ${new Date(results.timestamp).toLocaleString()}</p>
            <p>Baseline: ${results.baseline}</p>
        </header>

        <div class="summary">
            <h2>Executive Summary</h2>
            <div class="score-grid">
                <div class="score-card">
                    <div class="score-value">${results.aggregateScore || 0}</div>
                    <div class="score-label">Overall Score</div>
                </div>
                ${Object.entries(modelResults).map(([model, result]) => `
                    <div class="score-card">
                        <div class="score-value">${result.overallScore || 0}</div>
                        <div class="score-label">${model.toUpperCase()}</div>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 20px;">
                Evaluated <strong>${results.files?.length || 0}</strong> files across
                <strong>${Object.keys(modelResults).length}</strong> AI models.
            </p>
        </div>

        <div class="model-results">
            <h2 style="margin-bottom: 20px;">Detailed Model Evaluations</h2>

            ${Object.entries(modelResults).map(([modelName, modelResult]) => `
                <div class="model-section">
                    <div class="model-header">
                        <span class="model-name">${modelName.toUpperCase()}</span>
                        <span class="model-score">${modelResult.overallScore || 0}/100</span>
                    </div>

                    ${modelResult.error ? `
                        <div class="file-evaluation error">
                            <p>Error: ${modelResult.error}</p>
                        </div>
                    ` : ''}

                    ${modelResult.fileEvaluations ? modelResult.fileEvaluations.map(fileEval => `
                        <div class="file-evaluation ${fileEval.error ? 'error' : ''}">
                            <div class="file-name">
                                📄 ${fileEval.file}
                                <span class="badge ${getScoreBadgeClass(fileEval.score)}">
                                    Score: ${fileEval.score || 0}/100
                                </span>
                            </div>

                            ${fileEval.error ? `
                                <p style="color: #721c24;">Error: ${fileEval.error}</p>
                            ` : `
                                <div class="evaluation-details">
                                    ${fileEval.strengths && fileEval.strengths.length > 0 ? `
                                        <div class="detail-section">
                                            <div class="detail-title">Strengths</div>
                                            <ul class="detail-list strengths">
                                                ${fileEval.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}

                                    ${fileEval.weaknesses && fileEval.weaknesses.length > 0 ? `
                                        <div class="detail-section">
                                            <div class="detail-title">Weaknesses</div>
                                            <ul class="detail-list weaknesses">
                                                ${fileEval.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}

                                    ${fileEval.suggestions && fileEval.suggestions.length > 0 ? `
                                        <div class="detail-section" style="grid-column: 1 / -1;">
                                            <div class="detail-title">Improvement Suggestions</div>
                                            <ul class="detail-list suggestions">
                                                ${fileEval.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                </div>
                            `}
                        </div>
                    `).join('') : ''}

                    ${modelResult.summary ? `
                        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px;">
                            <strong>Summary:</strong> ${escapeHtml(modelResult.summary)}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generated by LLM Code Judge CI/CD Pipeline</p>
            <p>© 2024 - Automated Code Quality Evaluation</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Determines badge class based on score
 * @param {number} score - Evaluation score
 * @returns {string} Badge class name
 */
function getScoreBadgeClass(score) {
  if (score >= 80) return 'badge-success';
  if (score >= 60) return 'badge-warning';
  return 'badge-danger';
}