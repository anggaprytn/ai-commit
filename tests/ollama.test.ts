import { describe, it, expect, vi, beforeEach } from 'vitest';
import ollama from '../src/ollama.js';

describe('ollama.ts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('sendMessage', () => {
    it('should return response content on success', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          message: { content: 'feat: add ollama support' }
        })
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const result = await ollama.sendMessage('test input', { model: 'mistral' });
      
      expect(result).toBe('feat: add ollama support');
      expect(fetch).toHaveBeenCalled();
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(ollama.sendMessage('test', {}))
        .rejects.toThrow('Local model issues. Details: Network error');
    });

    it('should handle API error responses', async () => {
        // In the current implementation, it doesn't check response.ok, 
        // it just calls response.json(). If that fails, it catches it.
        const mockResponse = {
            ok: false,
            json: async () => { throw new Error('Invalid JSON'); }
        };
        (fetch as any).mockResolvedValue(mockResponse);

        await expect(ollama.sendMessage('test', {}))
            .rejects.toThrow('Local model issues');
    });
  });

  describe('prompt generation', () => {
    it('should generate a valid single commit prompt', () => {
      const diff = 'diff content';
      const options = { language: 'en', commitType: 'feat' };
      const prompt = ollama.getPromptForSingleCommit(diff, options);
      expect(prompt).toContain('<git_diff_data>\ndiff content\n</git_diff_data>');
      expect(prompt).toContain('feat');
    });

    it('should generate a valid multiple commit prompt', () => {
      const diff = 'diff content';
      const options = { language: 'en', numOptions: 5 };
      const prompt = ollama.getPromptForMultipleCommits(diff, options);
      expect(prompt).toContain('Generate exactly 5');
      expect(prompt).toContain('<git_diff_data>\ndiff content\n</git_diff_data>');
    });
  });

  describe('filterApi', () => {
    it('should always return true for ollama', () => {
      expect(ollama.filterApi({ prompt: 'test' })).toBe(true);
    });
  });
});
