import { spawn } from 'child_process';
import path from 'path';

function runStep(name, command, args) {
  return new Promise((resolve) => {
    console.log(`\n\x1b[36m▶ [STAGE] ${name}...\x1b[0m`);
    const startTime = Date.now();

    const fullCmd = `${command} ${args.join(' ')}`;
    const child = spawn(fullCmd, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`\x1b[32m✔ ${name} PASSED (${duration}s)\x1b[0m`);
        resolve({ name, success: true, duration });
      } else {
        console.error(`\x1b[31m✖ ${name} FAILED with code ${code} (${duration}s)\x1b[0m`);
        resolve({ name, success: false, duration, code });
      }
    });

    child.on('error', (err) => {
      console.error(`\x1b[31m✖ ${name} ERROR: ${err.message}\x1b[0m`);
      resolve({ name, success: false, duration: '0.0', error: err.message });
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(68));
  console.log('       OPERATION: ME // AUTOMATED FULL-SPECTRUM TEST SUITE');
  console.log('='.repeat(68));

  const results = [];

  // Stage 1: TypeScript Typecheck
  const tsResult = await runStep('TypeScript Type-Check (tsc --noEmit)', 'npx', ['tsc', '--noEmit']);
  results.push(tsResult);
  if (!tsResult.success) {
    printSummary(results);
    process.exit(1);
  }

  // Stage 2: Next.js Lint
  const lintResult = await runStep('ESLint Code Quality (next lint)', 'npx', ['next', 'lint']);
  results.push(lintResult);
  if (!lintResult.success) {
    printSummary(results);
    process.exit(1);
  }

  // Stage 3: Vitest Unit & Integration
  const unitResult = await runStep('Vitest Unit & Integration Tests (Coverage)', 'npx', ['vitest', 'run', '--coverage']);
  results.push(unitResult);
  if (!unitResult.success) {
    printSummary(results);
    process.exit(1);
  }

  // Stage 4: Playwright E2E
  const e2eResult = await runStep('Playwright E2E Verification (Desktop & Mobile)', 'npx', ['playwright', 'test']);
  results.push(e2eResult);

  printSummary(results);

  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

function printSummary(results) {
  console.log('\n' + '='.repeat(68));
  console.log('                   AUTOMATED VERIFICATION SUMMARY');
  console.log('='.repeat(68));
  console.log(
    'Stage'.padEnd(46) +
    'Status'.padEnd(12) +
    'Time'
  );
  console.log('-'.repeat(68));

  for (const r of results) {
    const statusText = r.success ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(
      r.name.padEnd(46) +
      statusText.padEnd(20) +
      `${r.duration}s`
    );
  }
  console.log('='.repeat(68));

  const allPassed = results.every(r => r.success);
  if (allPassed) {
    console.log('\x1b[32m✔ MISSION ACCOMPLISHED: All tests, checks, and E2E specs passed.\x1b[0m\n');
  } else {
    console.log('\x1b[31m✖ TEST FAILURES DETECTED: Check logs above for details.\x1b[0m\n');
  }
}

main().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
