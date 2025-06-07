# Cyclomatic Complexity Analysis - SonarQube Alignment

## Overview

Our Cyclomatic Complexity analysis has been completely rewritten to match SonarQube's exact methodology, ensuring identical numerical values and grade mappings for consistent code quality assessment.

## SonarQube Methodology

### Base Complexity
- **Entry Point**: Every method starts with base complexity of 1
- **Minimum Value**: Complexity can never be less than 1

### Control Flow Structures (+1 each)

#### Conditional Statements
- `if` statements
- `else if` statements (counted separately from `else`)
- Ternary operators (`condition ? true : false`)

#### Switch Statements
- `switch` statement declaration
- Each `case` label
- `default` case

#### Loops
- `for` loops (all variants)
- `while` loops
- `do-while` loops
- Enhanced for loops (Java: `for (item : collection)`)
- Functional iterations (`forEach`, `map`, `filter`, `reduce`, `some`, `every`)

#### Exception Handling
- `catch` blocks
- `finally` blocks (when applicable)

#### Logical Operators
- `&&` (logical AND)
- `||` (logical OR)

### Language-Specific Additions

#### Java
- `throws` declarations
- `assert` statements

#### JavaScript/TypeScript
- Promise `.then()` chains
- Promise `.catch()` blocks
- `async` function declarations
- `await` expressions

#### Python
- `except` blocks
- `with` statements
- `elif` statements

## Grading Thresholds (SonarQube Aligned)

| Grade | Complexity Range | Description | Action Required |
|-------|------------------|-------------|-----------------|
| **A** | 1-10 | Low complexity, easy to understand | Maintain current structure |
| **B** | 11-15 | Moderate complexity, acceptable | Consider minor refactoring |
| **C** | 16-20 | High complexity, should refactor | Refactoring recommended |
| **D** | 21+ | Very high complexity, critical | Immediate refactoring required |

## Implementation Details

### AST-Based Analysis
The analysis removes comments and string literals to avoid false positives:

```typescript
// Example: This won't count as a control structure
const message = "if you see this, it's a string";

// But this will count (+1 complexity)
if (user.isActive) {
  return user.data;
}
```

### Nesting Impact
SonarQube considers cognitive complexity alongside cyclomatic complexity. Deep nesting applies a small multiplier (1.1x) for methods with >5 nesting levels.

### Pattern Recognition
The analysis uses regex patterns optimized for each language:

```typescript
// Control flow patterns
/\bif\s*\(/g,                    // if statements
/\?\s*[^:]*\s*:/g,              // ternary operators
/\bfor\s*\(/g,                  // for loops
/&&|\|\|/g,                     // logical operators
```

## Validation Against SonarQube

### Test Cases
We maintain a comprehensive test suite with real-world examples validated against actual SonarQube results:

- **C-ID 10036298**: JavaScript conditional logic (Expected: CC=6, Grade=A)
- **JAVA-COMPLEX-001**: Java switch with loops (Expected: CC=11, Grade=B)
- **PYTHON-NESTED-001**: Python with exception handling (Expected: CC=16, Grade=C)
- **JS-ASYNC-HIGH-001**: High complexity async JavaScript (Expected: CC=25, Grade=D)

### Running Validation
```typescript
import { runValidationInConsole, generateValidationReport } from './sonarQubeValidation';

// Quick console validation
runValidationInConsole();

// Detailed markdown report
const report = generateValidationReport();
console.log(report);
```

## Examples

### Simple Method (Grade A)
```javascript
function calculateTax(amount, rate) {
  if (amount <= 0) return 0;  // +1
  return amount * rate;
}
// Complexity: 2, Grade: A
```

### Moderate Complexity (Grade B)
```java
public int processOrder(Order order) {        // +1 (base)
  if (order == null) return -1;              // +1
  
  switch (order.getType()) {                 // +1
    case STANDARD:                           // +1
      return processStandardOrder(order);
    case EXPRESS:                            // +1
      if (order.isPriority()) {              // +1
        return processExpressOrder(order);
      }
      return processStandardOrder(order);
    case BULK:                               // +1
      for (Item item : order.getItems()) {   // +1
        if (item.isSpecial()) {              // +1
          processSpecialItem(item);
        }
      }
      return processBulkOrder(order);
    default:                                 // +1
      throw new UnsupportedOperationException();
  }
}
// Complexity: 11, Grade: B
```

## Migration Notes

### Breaking Changes
1. **Threshold Updates**: Complexity thresholds changed from previous implementation
2. **Base Complexity**: All methods now start with complexity 1
3. **Logical Operators**: `&&` and `||` now properly counted
4. **Language Specificity**: Enhanced patterns for different programming languages

### Compatibility
The new implementation maintains the same API:
```typescript
// API unchanged
const complexity = calculateCyclomaticComplexity(code, language);
const rating = getCyclomaticComplexityRating(complexity);
```

## Troubleshooting

### Common Issues
1. **Lower than expected complexity**: Ensure comments and strings aren't being counted
2. **Language detection**: Verify the language parameter matches supported values
3. **Grade mismatches**: Check against updated SonarQube thresholds

### Debug Mode
Enable detailed logging for complexity calculation:
```typescript
// Set debug flag for detailed analysis
process.env.DEBUG_COMPLEXITY = 'true';
```

## References

- [SonarQube Cognitive Complexity](https://www.sonarsource.com/docs/CognitiveComplexity.pdf)
- [Cyclomatic Complexity - Wikipedia](https://en.wikipedia.org/wiki/Cyclomatic_complexity)
- [SonarQube Quality Model](https://docs.sonarqube.org/latest/user-guide/metric-definitions/)
