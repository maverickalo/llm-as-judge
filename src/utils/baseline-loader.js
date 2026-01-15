// Baseline loader utility
// This module loads and validates baseline evaluation criteria from JSON files

import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Loads baseline evaluation criteria from a JSON file
 * @param {string} baselinePath - Path to the baseline JSON file
 * @returns {Object} Parsed baseline criteria
 */
export function loadBaseline(baselinePath) {
  // Check if baseline file exists
  if (!existsSync(baselinePath)) {
    console.warn(`Baseline file not found at ${baselinePath}. Using default baseline.`);
    return getDefaultBaseline();
  }

  try {
    // Read and parse the baseline file
    const baselineContent = readFileSync(baselinePath, 'utf8');
    const baseline = JSON.parse(baselineContent);

    // Validate baseline structure
    validateBaseline(baseline);

    return baseline;
  } catch (error) {
    console.error(`Error loading baseline from ${baselinePath}:`, error.message);
    console.warn('Using default baseline instead.');
    return getDefaultBaseline();
  }
}

/**
 * Validates that the baseline has the required structure
 * @param {Object} baseline - Baseline object to validate
 * @throws {Error} If baseline structure is invalid
 */
function validateBaseline(baseline) {
  // Check required fields
  if (!baseline.name) {
    throw new Error('Baseline must have a name field');
  }

  if (!baseline.version) {
    throw new Error('Baseline must have a version field');
  }

  if (!baseline.criteria || !Array.isArray(baseline.criteria)) {
    throw new Error('Baseline must have a criteria array');
  }

  // Validate each criterion
  baseline.criteria.forEach((criterion, index) => {
    if (!criterion.id) {
      throw new Error(`Criterion at index ${index} must have an id`);
    }

    if (!criterion.description) {
      throw new Error(`Criterion ${criterion.id} must have a description`);
    }

    if (!criterion.category) {
      throw new Error(`Criterion ${criterion.id} must have a category`);
    }

    if (criterion.weight !== undefined && (criterion.weight < 0 || criterion.weight > 1)) {
      throw new Error(`Criterion ${criterion.id} weight must be between 0 and 1`);
    }
  });

  // Validate scoring rules if present
  if (baseline.scoringRules) {
    if (baseline.scoringRules.passingScore !== undefined &&
        (baseline.scoringRules.passingScore < 0 || baseline.scoringRules.passingScore > 100)) {
      throw new Error('Passing score must be between 0 and 100');
    }
  }
}

/**
 * Returns the default baseline criteria
 * @returns {Object} Default baseline configuration
 */
function getDefaultBaseline() {
  return {
    name: 'default',
    version: '1.0.0',
    description: 'Default code evaluation baseline criteria',
    criteria: [
      {
        id: 'readability',
        category: 'code-quality',
        description: 'Code should be easy to read and understand',
        weight: 0.2,
        checkpoints: [
          'Clear and meaningful variable names',
          'Consistent indentation and formatting',
          'Appropriate use of whitespace',
          'Logical code organization'
        ]
      },
      {
        id: 'maintainability',
        category: 'code-quality',
        description: 'Code should be easy to maintain and modify',
        weight: 0.2,
        checkpoints: [
          'Modular design with single responsibility',
          'Low coupling between components',
          'DRY (Don\'t Repeat Yourself) principle',
          'Clear separation of concerns'
        ]
      },
      {
        id: 'performance',
        category: 'efficiency',
        description: 'Code should be efficient and performant',
        weight: 0.15,
        checkpoints: [
          'Optimal algorithmic complexity',
          'Efficient use of resources',
          'Avoidance of unnecessary operations',
          'Proper caching strategies where applicable'
        ]
      },
      {
        id: 'security',
        category: 'security',
        description: 'Code should follow security best practices',
        weight: 0.2,
        checkpoints: [
          'Input validation and sanitization',
          'Protection against common vulnerabilities',
          'Secure handling of sensitive data',
          'Proper authentication and authorization'
        ]
      },
      {
        id: 'testing',
        category: 'quality-assurance',
        description: 'Code should be testable and well-tested',
        weight: 0.15,
        checkpoints: [
          'Unit test coverage',
          'Integration test coverage',
          'Testable design patterns',
          'Clear test documentation'
        ]
      },
      {
        id: 'documentation',
        category: 'documentation',
        description: 'Code should be well-documented',
        weight: 0.1,
        checkpoints: [
          'Comprehensive function/method documentation',
          'Clear inline comments for complex logic',
          'API documentation where applicable',
          'README with setup and usage instructions'
        ]
      }
    ],
    scoringRules: {
      passingScore: 70,
      excellentScore: 90,
      weightingMethod: 'weighted-average',
      penaltyForMissingCriteria: 10
    }
  };
}

/**
 * Merges custom baseline with defaults
 * @param {Object} customBaseline - Custom baseline to merge
 * @returns {Object} Merged baseline
 */
export function mergeWithDefaults(customBaseline) {
  const defaultBaseline = getDefaultBaseline();

  return {
    ...defaultBaseline,
    ...customBaseline,
    criteria: customBaseline.criteria || defaultBaseline.criteria,
    scoringRules: {
      ...defaultBaseline.scoringRules,
      ...(customBaseline.scoringRules || {})
    }
  };
}