import Anthropic from "@anthropic-ai/sdk";

export const isAIEnabled = !!process.env.ANTHROPIC_API_KEY;

export const anthropic = isAIEnabled
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Vision-kykyinen malli. Vaihe 9 päivitys: Sonnet 5.
// Jos claude-sonnet-5 ei vastaa API:sta, palaa arvoon "claude-sonnet-4-6".
export const VISION_MODEL = "claude-sonnet-5";

// Tekstintuotanto (sisällöntuotanto). Sama malli käy — erillinen vakio selkeyden vuoksi.
export const TEXT_MODEL = "claude-sonnet-5";
