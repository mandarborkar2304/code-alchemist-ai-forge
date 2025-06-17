
// This file now re-exports from the new modular structure
// for backward compatibility

import { getRatingFromScore, categorizeReliabilityIssues } from './quality';

export { getRatingFromScore, categorizeReliabilityIssues };

// Also export the warning flag checker for external use
import { needsReliabilityWarningFlag } from './quality/scoreThresholds';
export { needsReliabilityWarningFlag };
