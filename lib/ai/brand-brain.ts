import type { BrandBrain } from "@/lib/types";

/**
 * Rakentaa jaetun brändiblokin AI-promptien alkuun. Sisältää palvelut,
 * kohderyhmät, äänensävyn, kirjoitustyylin ja arvot — kaikkea mitä Claude
 * tarvitsee tuottaakseen brändille sopivaa tekstiä ilman erillistä promptia.
 */
export function buildBrandBrainBlock(
  orgName: string,
  brain: BrandBrain,
): string {
  const services = brain.services.map((s) => s.name).join(", ") || "—";
  const audiences = brain.targetAudiences.join(", ") || "—";
  const ctas = brain.ctas.join(" · ") || "—";
  return [
    `Toimit ${orgName}:n sisältöstrategin apurina. Kaikki teksti suomeksi.`,
    "",
    `Brändin palvelut: ${services}`,
    `Kohderyhmät: ${audiences}`,
    `Äänensävy: ${brain.toneOfVoice}`,
    `Kirjoitustyyli: ${brain.writingStyle}`,
    `Arvot: ${brain.values}`,
    `Suositellut CTA:t: ${ctas}`,
  ].join("\n");
}
