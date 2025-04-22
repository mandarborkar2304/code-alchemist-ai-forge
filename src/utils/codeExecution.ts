
// Helper function to extract actual code execution based on language and input
export const executeCode = (code: string, input: string, language: string): string => {
  // In a real implementation, this would execute the code in a sandbox
  // For our mock, we'll simulate execution based on code patterns
  
  if (code.includes('function sum') || code.includes('const sum')) {
    if (input.includes('sum(5, 3)')) return '8';
    if (input.includes('sum(-5, 5)')) return '0';
    if (input.includes('sum("5", 3)')) return 'Error: Invalid input types';
  }
  
  if (code.includes('function filter') || code.includes('array.filter')) {
    if (input.includes('filter([1,2,3,4,5]')) return '[4,5]';
    if (input.includes('filter([])')) return '[]';
    if (input.includes('filter(null')) return 'Error: Cannot read properties of null';
  }
  
  if (code.includes('try') && code.includes('catch')) {
    if (input.includes('null') || input.includes('undefined')) {
      return 'Error: Invalid input';
    }
  }
  
  // Default response based on expected patterns
  if (input.includes('sort')) return 'Sorted array';
  if (input.includes('map')) return 'Transformed array';
  if (input.includes('reduce')) return 'Reduced value';
  
  return 'Could not determine exact output - would require actual execution';
};
