import type { CheckContext, CheckResult } from '../types.js';
import { runAccess } from './access.js';
import { runPermission } from './permission.js';
import { runReadability } from './readability.js';
import { runUnderstandability } from './understandability.js';
import { runDiscoverability } from './discoverability.js';

export function runChecks(ctx: CheckContext): CheckResult[] {
  return [
    ...runAccess(ctx),
    ...runPermission(ctx),
    ...runReadability(ctx),
    ...runUnderstandability(ctx),
    ...runDiscoverability(ctx),
  ];
}
