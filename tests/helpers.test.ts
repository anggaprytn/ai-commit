import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processGitDiff, stripEmoji, getArgs, checkGitRepository, getGitDiff } from '../src/helpers.js';
import * as gptEncoder from 'gpt-3-encoder';
import { execSync } from 'child_process';

vi.mock('child_process');

vi.mock('gpt-3-encoder', async () => {
  const actual = await vi.importActual('gpt-3-encoder') as any;
  return {
    ...actual,
    encode: vi.fn().mockImplementation((text: string) => {
        return new Array(Math.ceil(text.length / 4)).fill(0);
    })
  };
});

describe('helpers.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getArgs', () => {
    it('should parse arguments correctly', () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'index.js', '--PROVIDER=ollama', '--MODEL', 'llama3', '--verbose'];

      const args = getArgs();
      expect(args.PROVIDER).toBe('ollama');
      expect(args.MODEL).toBe('llama3');
      expect(args.verbose).toBe(true);

      process.argv = originalArgv;
    });
  });

  describe('checkGitRepository', () => {
    it('should return true if inside a git work tree', () => {
      vi.mocked(execSync).mockReturnValue('true');
      expect(checkGitRepository()).toBe(true);
    });

    it('should return false if not inside a git work tree', () => {
      vi.mocked(execSync).mockImplementation(() => { throw new Error(); });
      expect(checkGitRepository()).toBe(false);
    });
  });

  describe('getGitDiff', () => {
    it('should return staged diff if it exists', () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd === 'git diff --staged') return Buffer.from('staged diff');
        return Buffer.from('');
      });

      expect(getGitDiff()).toBe('staged diff');
      expect(execSync).toHaveBeenCalledWith('git diff --staged');
      expect(execSync).not.toHaveBeenCalledWith('git diff');
    });

    it('should return unstaged diff if staged is empty', () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd === 'git diff --staged') return Buffer.from('');
        if (cmd === 'git diff') return Buffer.from('unstaged diff');
        return Buffer.from('');
      });

      expect(getGitDiff()).toBe('unstaged diff');
      expect(execSync).toHaveBeenCalledWith('git diff --staged');
      expect(execSync).toHaveBeenCalledWith('git diff');
    });

    it('should return empty string if both staged and unstaged are empty', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));

      expect(getGitDiff()).toBe('');
      expect(execSync).toHaveBeenCalledWith('git diff --staged');
      expect(execSync).toHaveBeenCalledWith('git diff');
    });

    it('should handle errors and return empty string', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(getGitDiff()).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('stripEmoji', () => {
    it('should remove emojis and extra spaces', () => {
      const input = 'Hello 🚀 World! ✨';
      expect(stripEmoji(input)).toBe('Hello World!');
    });

    it('should handle strings without emojis', () => {
      const input = 'Clean string';
      expect(stripEmoji(input)).toBe('Clean string');
    });

    it('should trim and collapse spaces', () => {
      const input = '  Multiple   spaces  ';
      expect(stripEmoji(input)).toBe('Multiple spaces');
    });

    it('should pass regression tests from src/test-emoji.ts', () => {
      const testCases = [
        { input: '🔧 chore: update dependencies', expected: 'chore: update dependencies' },
        { input: 'feat: add ✨ auth flow', expected: 'feat: add auth flow' },
        { input: '🚀 deploy: release production build', expected: 'deploy: release production build' },
        { input: 'fix(ui): remove 🙅 symbols', expected: 'fix(ui): remove symbols' },
        { input: 'docs: update readme 📝', expected: 'docs: update readme' },
        { input: '   feat: cleanup    ', expected: 'feat: cleanup' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(stripEmoji(input)).toBe(expected);
      });
    });

    it('should ensure no unicode emoji characters remain', () => {
        const input = '🔧 chore ✨ feat 🚀 fix 🙅 docs 📝';
        const result = stripEmoji(input);
        const emojiRegex = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
        expect(emojiRegex.test(result)).toBe(false);
    });
  });

  describe('processGitDiff', () => {
    it('should return original diff if within limit', () => {
      const diff = 'small diff content';
      expect(processGitDiff(diff)).toBe(diff);
    });

    it('should truncate diff if it exceeds limit', () => {
      const longDiff = 'a'.repeat(600000); 
      const result = processGitDiff(longDiff);
      
      expect(result).toContain('[... DIFF TRUNCATED DUE TO MAX TOKEN LIMIT ...]');
      
      const content = result.split('\n\n')[0];
      expect(content.length).toBeLessThan(longDiff.length);
      
      const tokens = gptEncoder.encode(content);
      expect(tokens.length).toBeLessThanOrEqual(120000);
    });

    it('should trigger emergency break after 5 iterations', () => {
        vi.mocked(gptEncoder.encode).mockReturnValue(new Array(130000).fill(0));

        const longDiff = 'a'.repeat(200000);
        const result = processGitDiff(longDiff);

        expect(result).toContain('[... DIFF TRUNCATED DUE TO MAX TOKEN LIMIT ...]');
        const content = result.split('\n\n')[0];
        expect(content.length).toBe(10000);
    });
  });
});
