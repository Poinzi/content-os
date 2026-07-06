import type Anthropic from "@anthropic-ai/sdk";
import type { BrandBrain, MediaAnalysis, MediaAsset } from "@/lib/types";
import { anthropic, VISION_MODEL } from "./anthropic";
import { fetchImageAsBase64 } from "./image";

const RECORD_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "record_analysis",
  description:
    "Tallenna kuva-analyysi jäsenneltyyn muotoon. Kaikki kentät suomeksi.",
  input_schema: {
    type: "object",
    properties: {
      sceneDescription: {
        type: "string",
        description:
          "1–2 lauseen kuvaus mitä kuvassa näkyy. Videosta käytetään esikatselukuvaa — mainitse tarvittaessa.",
      },
      workPhase: {
        type: "string",
        description:
          "Mihin työvaiheeseen tai tilanteeseen kuva liittyy (esim. tarkastus, huolto, koulutus).",
      },
      relatedService: {
        type: "string",
        description:
          "Yksi brändin palveluista joka parhaiten liittyy. Käytä brändin todellisia palvelunimiä.",
      },
      safetyRisk: {
        type: "string",
        description:
          "Havaittu turvallisuusriski yhdellä lauseella. Jos ei riskiä, kirjoita 'Ei havaittuja riskejä'.",
      },
      suggestedTitle: {
        type: "string",
        description:
          "Napakka otsikko markkinointisisältöä varten. Alle 60 merkkiä.",
      },
      suggestedTags: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 6,
        description: "3–6 osuvaa avainsanaa brändin liiketoiminnasta.",
      },
    },
    required: [
      "sceneDescription",
      "workPhase",
      "relatedService",
      "safetyRisk",
      "suggestedTitle",
      "suggestedTags",
    ],
  },
};

function buildSystemPrompt(brand: BrandBrain): string {
  const services = brand.services.map((s) => s.name).join(", ");
  const audiences = brand.targetAudiences.join(", ");
  return [
    "Olet Savuks Oy:n (paloturvallisuuspalvelut) sisältöstrategin apuri.",
    "Analysoit kuvan markkinointisisältöä varten. Kaikki teksti suomeksi.",
    "",
    `Brändin palvelut: ${services}`,
    `Kohderyhmät: ${audiences}`,
    `Äänensävy: ${brand.toneOfVoice}`,
    "",
    "Ohjeet:",
    "- relatedService MUST olla yksi yllä listatuista palveluista.",
    "- suggestedTags kuvaavat kuvassa nähtyä toimintaa/laitetta/aihetta brändin sanastolla.",
    "- suggestedTitle napakka (<60 merkkiä), kutsuva mutta ei myyntipuhetta.",
    "- safetyRisk arvioi todellisen työturvallisuusnäkökulman.",
    "- Kutsu työkalua record_analysis palauttaaksesi tulokset.",
  ].join("\n");
}

export async function analyzeMedia(
  asset: MediaAsset,
  brand: BrandBrain,
): Promise<MediaAnalysis> {
  if (!anthropic) {
    throw new Error("Anthropic-client puuttuu — tarkista ANTHROPIC_API_KEY");
  }

  const userText =
    asset.kind === "video"
      ? `Videon esikatselukuva: "${asset.title}". Analysoi kuvaan perustuen, mainitse että kyseessä on video.`
      : `Kuva: "${asset.title}". Analysoi markkinointisisältöä varten.`;

  // Hae kuva palvelimella ja lähetä se base64-lähteenä — Anthropicin ei tarvitse
  // itse ladata ulkoisesta URL:sta (poistaa Unsplash rate-limit / hotlink 400:t).
  const img = await fetchImageAsBase64(asset.thumbnailUrl);

  const response = await anthropic.messages.create({
    model: VISION_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(brand),
    tools: [RECORD_ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "record_analysis" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: img.mediaType,
              data: img.data,
            },
          },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  const toolBlock = response.content.find(
    (block): block is Extract<typeof block, { type: "tool_use" }> =>
      block.type === "tool_use" && block.name === "record_analysis",
  );

  if (!toolBlock) {
    throw new Error("Claude ei kutsunut record_analysis-työkalua");
  }

  const input = toolBlock.input as MediaAnalysis;
  return {
    sceneDescription: String(input.sceneDescription ?? ""),
    workPhase: String(input.workPhase ?? ""),
    relatedService: String(input.relatedService ?? ""),
    safetyRisk: String(input.safetyRisk ?? ""),
    suggestedTitle: String(input.suggestedTitle ?? ""),
    suggestedTags: Array.isArray(input.suggestedTags)
      ? input.suggestedTags.map(String).slice(0, 6)
      : [],
  };
}

/**
 * Demo-analyysi joka näytetään mock-tilassa tai kun ANTHROPIC_API_KEY puuttuu.
 * Käytetään brändin ensimmäistä palvelua todellisen palvelun sijasta.
 */
export function demoAnalysis(asset: MediaAsset, brand: BrandBrain): MediaAnalysis {
  const firstService = brand.services[0]?.name ?? "Palotarkastus";
  return {
    sceneDescription: `Demo-analyysi: kuva "${asset.title}" liittyy paloturvallisuustyöhön. Lisää ANTHROPIC_API_KEY nähdäksesi todellisen Claude Vision -analyysin.`,
    workPhase: "Vuositarkastus",
    relatedService: firstService,
    safetyRisk: "Ei havaittuja riskejä",
    suggestedTitle: `Näin ${firstService.toLowerCase()} tehdään`,
    suggestedTags: ["demo", "esimerkki", "brändi", "sisältö"],
  };
}
