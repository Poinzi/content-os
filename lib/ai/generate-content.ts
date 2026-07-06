import type Anthropic from "@anthropic-ai/sdk";
import type {
  BrandBrain,
  Channel,
  MediaAnalysis,
  MediaAsset,
} from "@/lib/types";
import { CHANNEL_LABEL } from "@/lib/types";
import { anthropic, TEXT_MODEL } from "./anthropic";
import { buildBrandBrainBlock } from "./brand-brain";

export type GeneratedVariant = {
  channel: Channel;
  body: string;
  hashtags: string[];
  cta: string;
};

export type GeneratedSeo = {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
};

export type GeneratedContent = {
  itemTitle: string;
  variants: GeneratedVariant[];
  seo: GeneratedSeo;
};

const RECORD_CONTENT_TOOL: Anthropic.Tool = {
  name: "record_content",
  description:
    "Tallenna kanavakohtaiset julkaisut + SEO. Kaikki teksti suomeksi.",
  input_schema: {
    type: "object",
    properties: {
      itemTitle: {
        type: "string",
        description: "Sisällön yleisotsikko. Napakka, alle 80 merkkiä.",
      },
      variants: {
        type: "array",
        description:
          "Yksi objekti per pyydetty kanava. Sovita pituus ja tyyli kanavalle.",
        items: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              enum: ["tiktok", "instagram", "facebook", "linkedin", "blog"],
              description: "Kanavan tunnus.",
            },
            body: {
              type: "string",
              description:
                "Julkaisuteksti kanavalle sovitettuna. TikTok/Instagram lyhyt (< 220 merkkiä), koukuttava. LinkedIn asiantunteva. Facebook lämmin ja käytännönläheinen. Blogi 800–1200 merkkiä, informatiivinen.",
            },
            hashtags: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 8,
              description:
                "3–8 hashtagia ilman #-merkkiä. Brändin sanastolla, ei geneerisiä.",
            },
            cta: {
              type: "string",
              description:
                "Yksi lause. Käytä brändin CTA-listaa tai muotoile brändin äänellä.",
            },
          },
          required: ["channel", "body", "hashtags", "cta"],
        },
      },
      seo: {
        type: "object",
        properties: {
          seoTitle: {
            type: "string",
            description: "SEO-otsikko. Alle 60 merkkiä.",
          },
          metaDescription: {
            type: "string",
            description: "Meta-kuvaus. Alle 155 merkkiä.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 8,
            description: "4–8 hakusanaa brändin liiketoiminnasta.",
          },
        },
        required: ["seoTitle", "metaDescription", "keywords"],
      },
    },
    required: ["itemTitle", "variants", "seo"],
  },
};

export async function generateContent(params: {
  asset: MediaAsset;
  analysis: MediaAnalysis;
  brand: BrandBrain;
  orgName: string;
  channels: Channel[];
  seriesName?: string | null;
}): Promise<GeneratedContent> {
  if (!anthropic) {
    throw new Error("Anthropic-client puuttuu — tarkista ANTHROPIC_API_KEY");
  }

  const { asset, analysis, brand, orgName, channels, seriesName } = params;
  const channelLabels = channels.map((c) => CHANNEL_LABEL[c]).join(", ");

  const contextText = [
    `Media: ${asset.title} (${asset.kind === "video" ? "video, käytä esikatselukuvaa" : "kuva"})`,
    "",
    "Median analyysi:",
    `- Kuvaus: ${analysis.sceneDescription}`,
    `- Työvaihe: ${analysis.workPhase}`,
    `- Liittyvä palvelu: ${analysis.relatedService}`,
    `- Turvallisuus: ${analysis.safetyRisk}`,
    `- Aiempi otsikkoehdotus: ${analysis.suggestedTitle}`,
    `- Aiemmat tagit: ${analysis.suggestedTags.join(", ")}`,
    "",
    seriesName ? `Sisältösarja: ${seriesName} (sovita rytmi sarjaan)` : "",
    "",
    `Tuota tästä mediasta julkaisuvalmiit tekstit näille kanaville: ${channelLabels}.`,
    "Sovita pituus ja tyyli kullekin kanavalle. Kaikki teksti suomeksi.",
    "Tuota myös SEO-otsikko + meta-kuvaus + avainsanat.",
    "Kutsu record_content-työkalua palauttaaksesi tulokset.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: TEXT_MODEL,
    max_tokens: 2048,
    system: buildBrandBrainBlock(orgName, brand),
    tools: [RECORD_CONTENT_TOOL],
    tool_choice: { type: "tool", name: "record_content" },
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: contextText }],
      },
    ],
  });

  const toolBlock = response.content.find(
    (block): block is Extract<typeof block, { type: "tool_use" }> =>
      block.type === "tool_use" && block.name === "record_content",
  );

  if (!toolBlock) {
    throw new Error("Claude ei kutsunut record_content-työkalua");
  }

  const input = toolBlock.input as GeneratedContent;
  const cleanTag = (t: string) => String(t).replace(/^#+/, "").trim();

  return {
    itemTitle: String(input.itemTitle ?? "").slice(0, 200),
    variants: (input.variants ?? [])
      .filter((v) => channels.includes(v.channel))
      .map((v) => ({
        channel: v.channel,
        body: String(v.body ?? ""),
        hashtags: Array.isArray(v.hashtags)
          ? v.hashtags.map(cleanTag).filter(Boolean).slice(0, 8)
          : [],
        cta: String(v.cta ?? ""),
      })),
    seo: {
      seoTitle: String(input.seo?.seoTitle ?? "").slice(0, 60),
      metaDescription: String(input.seo?.metaDescription ?? "").slice(0, 155),
      keywords: Array.isArray(input.seo?.keywords)
        ? input.seo.keywords.map(String).slice(0, 8)
        : [],
    },
  };
}

/**
 * Demo-tulos ilman AI-avainta. Käyttää brändin ensimmäistä palvelua.
 */
export function demoContent(
  asset: MediaAsset,
  brand: BrandBrain,
  channels: Channel[],
): GeneratedContent {
  const service = brand.services[0]?.name ?? "Palotarkastus";
  const baseHashtags = ["paloturvallisuus", "savuks", "brändi"];
  const cta = brand.ctas[0] ?? "Ota yhteyttä";
  const variants: GeneratedVariant[] = channels.map((c) => {
    const label = CHANNEL_LABEL[c];
    return {
      channel: c,
      body: `Demo: ${label}-julkaisu mediasta "${asset.title}". Lisää ANTHROPIC_API_KEY nähdäksesi todellisen Claude-tekstin brändin äänellä.`,
      hashtags: baseHashtags,
      cta,
    };
  });
  return {
    itemTitle: `Demo — ${asset.title}`,
    variants,
    seo: {
      seoTitle: `${service} — demo`,
      metaDescription: `Demo-analyysi mediasta ${asset.title}. Lisää ANTHROPIC_API_KEY käyttääksesi Clauden todellista tuotantoa.`,
      keywords: [service.toLowerCase(), "demo", "esimerkki", "sisältö"],
    },
  };
}
