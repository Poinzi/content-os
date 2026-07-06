import Anthropic from "@anthropic-ai/sdk";

export const isAIEnabled = !!process.env.ANTHROPIC_API_KEY;

export const anthropic = isAIEnabled
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Vision-kykyinen malli. Vaihdettavissa halvempaan (claude-haiku-4-5) jos tarve.
export const VISION_MODEL = "claude-sonnet-4-6";
