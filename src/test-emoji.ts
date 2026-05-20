import { stripEmoji } from './helpers.js';
import assert from 'assert';

console.log('Running emoji regression tests...');

interface TestCase {
  input: string;
  expected: string;
  description: string;
}

const testCases: TestCase[] = [
  {
    input: '🔧 chore: update dependencies',
    expected: 'chore: update dependencies',
    description: 'Should strip emoji from the start'
  },
  {
    input: 'feat: add ✨ auth flow',
    expected: 'feat: add auth flow',
    description: 'Should strip emoji from the middle'
  },
  {
    input: '🚀 deploy: release production build',
    expected: 'deploy: release production build',
    description: 'Should strip rocket emoji'
  },
  {
    input: 'fix(ui): remove 🙅 symbols',
    expected: 'fix(ui): remove symbols',
    description: 'Should strip person gesturing no'
  },
  {
    input: 'docs: update readme 📝',
    expected: 'docs: update readme',
    description: 'Should strip emoji from the end'
  },
  {
    input: '   feat: cleanup    ',
    expected: 'feat: cleanup',
    description: 'Should trim whitespace'
  }
];

let failures = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = stripEmoji(input);
  try {
    assert.strictEqual(result, expected);
    console.log(`✅ Pass: ${description}`);
  } catch (err) {
    console.error(`❌ Fail: ${description}`);
    console.error(`   Expected: "${expected}"`);
    console.error(`   Actual:   "${result}"`);
    failures++;
  }
});

// Extra check: Ensure no non-ASCII characters remain
const emojiRegex = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
testCases.forEach(({ input, description }) => {
  const result = stripEmoji(input);
  if (emojiRegex.test(result)) {
    console.error(`❌ Fail: ${description} (Still contains unicode emoji characters)`);
    failures++;
  }
});

if (failures > 0) {
  console.error(`\nTests failed with ${failures} error(s).`);
  process.exit(1);
} else {
  console.log('\nAll emoji regression tests passed!');
}
