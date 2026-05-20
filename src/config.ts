import * as dotenv from 'dotenv';
import { getArgs } from './helpers.js';

dotenv.config();

export const args = getArgs();

/**
 * possible values: 'openai' or 'ollama'
 */
export const AI_PROVIDER: string = args.PROVIDER || (process.env.PROVIDER as string) || 'openai';

/**
 * name of the model to use.
 * can use this to switch between different local models.
 */
export const MODEL: string = args.MODEL || (process.env.MODEL as string) || 'gpt-4o-mini';
