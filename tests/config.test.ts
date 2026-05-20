import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock process.env and process.argv BEFORE importing config.ts
// because they are executed at module level.

describe('config.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PROVIDER', '');
    vi.stubEnv('MODEL', '');
  });

  it('should use default values if no env or args provided', async () => {
    const { AI_PROVIDER, MODEL } = await import('../src/config.js');
    expect(AI_PROVIDER).toBe('openai');
    expect(MODEL).toBe('gpt-4o-mini');
  });

  it('should use environment variables if provided', async () => {
    vi.stubEnv('PROVIDER', 'ollama');
    vi.stubEnv('MODEL', 'llama3');
    const { AI_PROVIDER, MODEL } = await import('../src/config.js');
    expect(AI_PROVIDER).toBe('ollama');
    expect(MODEL).toBe('llama3');
  });

  it('should prioritize CLI arguments over environment variables', async () => {
    vi.stubEnv('PROVIDER', 'openai');
    // Mocking process.argv is tricky because config.ts calls getArgs() which uses process.argv
    process.argv = ['node', 'index.js', '--PROVIDER=ollama'];
    
    const { AI_PROVIDER } = await import('../src/config.js');
    expect(AI_PROVIDER).toBe('ollama');
  });
});
