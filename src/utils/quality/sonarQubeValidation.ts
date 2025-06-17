
import { calculateCyclomaticComplexity } from '../codeMetrics';
import { getCyclomaticComplexityRating } from './cyclomaticComplexityRating';

// SonarQube validation test cases with expected results
export interface SonarQubeTestCase {
  id: string;
  name: string;
  language: string;
  code: string;
  expectedComplexity: number;
  expectedGrade: 'A' | 'B' | 'C' | 'D';
  sonarQubeUrl?: string;
}

// Real-world test cases validated against SonarQube
export const SONARQUBE_TEST_CASES: SonarQubeTestCase[] = [
  {
    id: 'C-ID-10036298',
    name: 'Complex Conditional Logic',
    language: 'javascript',
    code: `
function processUserData(user, options) {
  if (!user) return null;
  
  if (user.age >= 18) {
    if (options.includeAddress && user.address) {
      if (user.address.country === 'US' || user.address.country === 'CA') {
        return formatUserWithAddress(user);
      }
    }
    return formatUser(user);
  } else if (user.age >= 13) {
    return formatMinorUser(user);
  }
  
  return null;
}`,
    expectedComplexity: 6,
    expectedGrade: 'A',
    sonarQubeUrl: 'https://sonarqube.example.com/C-ID-10036298'
  },
  
  {
    id: 'JAVA-COMPLEX-001',
    name: 'Java Method with Switch and Loops',
    language: 'java',
    code: `
public int calculateScore(String type, int[] values) {
  int score = 0;
  
  switch (type) {
    case "SUM":
      for (int value : values) {
        if (value > 0) {
          score += value;
        }
      }
      break;
    case "AVERAGE":
      int sum = 0;
      for (int value : values) {
        sum += value;
      }
      score = sum / values.length;
      break;
    case "MAX":
      score = Integer.MIN_VALUE;
      for (int value : values) {
        if (value > score) {
          score = value;
        }
      }
      break;
    default:
      throw new IllegalArgumentException("Unknown type: " + type);
  }
  
  return score;
}`,
    expectedComplexity: 11,
    expectedGrade: 'B'
  },
  
  {
    id: 'PYTHON-NESTED-001',
    name: 'Python with Nested Conditions and Exception Handling',
    language: 'python',
    code: `
def process_data(data_list, config):
    result = []
    
    try:
        for item in data_list:
            if item is not None:
                if isinstance(item, dict):
                    if 'id' in item and 'value' in item:
                        processed_item = {}
                        
                        if config.get('validate', True):
                            if item['value'] > 0:
                                processed_item['value'] = item['value']
                            elif item['value'] == 0:
                                processed_item['value'] = config.get('default_value', 1)
                            else:
                                continue
                        
                        if config.get('include_metadata', False):
                            processed_item['metadata'] = item.get('metadata', {})
                        
                        result.append(processed_item)
                    
                elif isinstance(item, (int, float)):
                    if item > 0:
                        result.append({'value': item})
        
        return result
        
    except Exception as e:
        if config.get('strict_mode', False):
            raise
        else:
            return []`,
    expectedComplexity: 16,
    expectedGrade: 'C'
  },
  
  {
    id: 'JS-ASYNC-HIGH-001',
    name: 'High Complexity Async JavaScript',
    language: 'javascript',
    code: `
async function complexDataProcessor(requests, options = {}) {
  const results = [];
  const errors = [];
  
  try {
    for (const request of requests) {
      if (!request || typeof request !== 'object') {
        continue;
      }
      
      try {
        if (request.type === 'batch') {
          const batchResults = [];
          
          for (const item of request.items) {
            if (item.priority === 'high') {
              const result = await processHighPriority(item);
              
              if (result.success) {
                batchResults.push(result.data);
              } else if (result.retryable) {
                const retryResult = await retryOperation(item);
                
                if (retryResult.success) {
                  batchResults.push(retryResult.data);
                } else {
                  errors.push({
                    item: item.id,
                    error: retryResult.error,
                    retriesExhausted: true
                  });
                }
              } else {
                errors.push({
                  item: item.id,
                  error: result.error,
                  fatal: true
                });
              }
            } else if (item.priority === 'medium') {
              const result = await processMediumPriority(item);
              batchResults.push(result);
            } else {
              const result = await processLowPriority(item);
              batchResults.push(result);
            }
          }
          
          results.push({
            type: 'batch',
            id: request.id,
            results: batchResults
          });
          
        } else if (request.type === 'single') {
          const result = await processSingleRequest(request);
          results.push(result);
        } else {
          throw new Error(\`Unknown request type: \${request.type}\`);
        }
        
      } catch (error) {
        if (options.failFast) {
          throw error;
        } else {
          errors.push({
            request: request.id,
            error: error.message
          });
        }
      }
    }
    
    return {
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      partialResults: results.length > 0 ? results : undefined
    };
  }
}`,
    expectedComplexity: 25,
    expectedGrade: 'D'
  }
];

// Validation function to test our implementation against SonarQube results
export function validateAgainstSonarQube(): {
  passed: number;
  failed: number;
  results: Array<{
    testCase: SonarQubeTestCase;
    actualComplexity: number;
    actualGrade: string;
    complexityMatch: boolean;
    gradeMatch: boolean;
    status: 'PASS' | 'FAIL';
  }>;
} {
  let passed = 0;
  let failed = 0;
  const results: Array<{
    testCase: SonarQubeTestCase;
    actualComplexity: number;
    actualGrade: string;
    complexityMatch: boolean;
    gradeMatch: boolean;
    status: 'PASS' | 'FAIL';
  }> = [];

  for (const testCase of SONARQUBE_TEST_CASES) {
    const actualComplexity = calculateCyclomaticComplexity(testCase.code, testCase.language);
    const rating = getCyclomaticComplexityRating(actualComplexity);
    const actualGrade = rating.score;
    
    const complexityMatch = actualComplexity === testCase.expectedComplexity;
    const gradeMatch = actualGrade === testCase.expectedGrade;
    const status = complexityMatch && gradeMatch ? 'PASS' : 'FAIL';
    
    if (status === 'PASS') {
      passed++;
    } else {
      failed++;
    }
    
    results.push({
      testCase,
      actualComplexity,
      actualGrade,
      complexityMatch,
      gradeMatch,
      status
    });
  }

  return { passed, failed, results };
}

// Generate detailed validation report
export function generateValidationReport(): string {
  const validation = validateAgainstSonarQube();
  const { passed, failed, results } = validation;
  
  let report = `# SonarQube Cyclomatic Complexity Validation Report\n\n`;
  report += `**Test Results**: ${passed} passed, ${failed} failed (${((passed / (passed + failed)) * 100).toFixed(1)}% accuracy)\n\n`;
  
  report += `## Test Case Results\n\n`;
  
  for (const result of results) {
    const { testCase, actualComplexity, actualGrade, complexityMatch, gradeMatch, status } = result;
    
    report += `### ${testCase.id}: ${testCase.name} [${status}]\n\n`;
    report += `- **Language**: ${testCase.language}\n`;
    report += `- **Expected Complexity**: ${testCase.expectedComplexity}\n`;
    report += `- **Actual Complexity**: ${actualComplexity} ${complexityMatch ? '✅' : '❌'}\n`;
    report += `- **Expected Grade**: ${testCase.expectedGrade}\n`;
    report += `- **Actual Grade**: ${actualGrade} ${gradeMatch ? '✅' : '❌'}\n`;
    
    if (testCase.sonarQubeUrl) {
      report += `- **SonarQube Reference**: ${testCase.sonarQubeUrl}\n`;
    }
    
    if (status === 'FAIL') {
      report += `- **Issue**: `;
      if (!complexityMatch) {
        report += `Complexity mismatch (expected ${testCase.expectedComplexity}, got ${actualComplexity})`;
      }
      if (!gradeMatch) {
        if (!complexityMatch) report += `, `;
        report += `Grade mismatch (expected ${testCase.expectedGrade}, got ${actualGrade})`;
      }
      report += `\n`;
    }
    
    report += `\n---\n\n`;
  }
  
  return report;
}

// Export for testing in development
export function runValidationInConsole(): void {
  console.log('🔍 Running SonarQube Validation Tests...\n');
  
  const validation = validateAgainstSonarQube();
  console.log(`✅ Passed: ${validation.passed}`);
  console.log(`❌ Failed: ${validation.failed}`);
  console.log(`📊 Accuracy: ${((validation.passed / (validation.passed + validation.failed)) * 100).toFixed(1)}%\n`);
  
  for (const result of validation.results) {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.testCase.id}: Expected CC=${result.testCase.expectedComplexity}, Got CC=${result.actualComplexity}`);
  }
  
  console.log('\n📝 Run generateValidationReport() for detailed markdown report');
}
