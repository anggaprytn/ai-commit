import { describe, it, expect, vi, beforeEach } from 'vitest';
import openai, { FEE_INPUT_PER_TOKEN, FEE_COMPLETION_PER_TOKEN } from '../src/openai.js';
import { ChatGPTAPI } from 'chatgpt';
import inquirer from 'inquirer';

vi.mock('chatgpt', () => {
  class MockChatGPTAPI {
    sendMessage() {}
  }
  MockChatGPTAPI.prototype.sendMessage = vi.fn().mockResolvedValue({ text: 'feat(core): add new feature' });
  return { ChatGPTAPI: MockChatGPTAPI };
});

vi.mock('inquirer');

describe('openai.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct fee constants', () => {
    expect(typeof FEE_INPUT_PER_TOKEN).toBe('number');
    expect(typeof FEE_COMPLETION_PER_TOKEN).toBe('number');
    expect(FEE_INPUT_PER_TOKEN).toBeGreaterThan(0);
    expect(FEE_COMPLETION_PER_TOKEN).toBeGreaterThan(0);
  });

  describe('sendMessage', () => {
    it('should return a clean commit message on success', async () => {
      const result = await openai.sendMessage('test input', { apiKey: 'fake-key', model: 'gpt-4' });
      
      expect(result).toBe('feat(core): add new feature');
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(ChatGPTAPI.prototype, 'sendMessage').mockRejectedValueOnce(new Error('API Down'));

      await expect(openai.sendMessage('test', { apiKey: 'key', model: 'm' }))
        .rejects.toThrow('API Down');
    });
  });

  describe('getPromptForSingleCommit', () => {
    it('should generate a valid single commit prompt', () => {
      const diff = 'diff content';
      const options = { language: 'en', commitType: 'feat' };
      const prompt = openai.getPromptForSingleCommit(diff, options);
      
      expect(prompt).toContain('GIT DIFF:\ndiff content');
      expect(prompt).toContain('commit type \'feat\'');
      expect(prompt).toContain('en language');
    });
  });

  describe('getPromptForMultipleCommits', () => {
    it('should generate a valid multiple commit prompt', () => {
      const diff = 'diff content';
      const options = { language: 'id', numOptions: 3 };
      const prompt = openai.getPromptForMultipleCommits(diff, options);
      
      expect(prompt).toContain('Generate exactly 3');
      expect(prompt).toContain('id language');
    });
  });

  describe('filterApi', () => {
    it('should return true if filterFee is false', async () => {
      const result = await openai.filterApi({ prompt: 'test', filterFee: false });
      expect(result).toBe(true);
    });

    it('should ask for confirmation if filterFee is true', async () => {
      vi.mocked(inquirer.prompt).mockResolvedValue({ continue: true });
      
      const result = await openai.filterApi({ prompt: 'test', filterFee: true });
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if user cancels', async () => {
      vi.mocked(inquirer.prompt).mockResolvedValue({ continue: false });
      
      const result = await openai.filterApi({ prompt: 'test', filterFee: true });
      
      expect(result).toBe(false);
    });
  });
});
