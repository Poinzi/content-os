import type {
  AnalyticsSummary,
  BrandBrain,
  CalendarEvent,
  ContentItem,
  ContentSeries,
  Folder,
  MediaAsset,
  Membership,
} from "@/lib/types";

export const SAVUKS_ORG_ID = "org_savuks";
export const DEMO_ORG_ID = "org_demo";

export const MOCK_MEMBERSHIPS: Membership[] = [
  {
    organization: {
      id: SAVUKS_ORG_ID,
      name: "Savuks Oy",
      slug: "savuks",
      logoUrl: null,
    },
    role: "owner",
  },
  {
    organization: {
      id: DEMO_ORG_ID,
      name: "Demo Studio",
      slug: "demo-studio",
      logoUrl: null,
    },
    role: "admin",
  },
];

export const MOCK_FOLDERS: Folder[] = [
  { id: "f_kentta", name: "Kenttätyöt", parentId: null },
  { id: "f_koulutus", name: "Koulutukset", parentId: null },
  { id: "f_asiakas", name: "Asiakastarinat", parentId: null },
];

export const MOCK_MEDIA: MediaAsset[] = [
  {
    id: "m1",
    kind: "video",
    title: "Palotarkastus Ruskolla",
    tags: ["palotarkastus", "kenttä", "asuinkiinteistö"],
    folderId: "f_kentta",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1601000937971-6e0d1ad9f4a2?w=800&q=80",
    durationSeconds: 47,
    createdAt: "2026-07-01T09:15:00Z",
    analysisStatus: "done",
    analysis: {
      sceneDescription:
        "Tarkastaja mittaa sammuttimen painetta rappukäytävässä",
      workPhase: "Vuositarkastus",
      relatedService: "Palotarkastus",
      safetyRisk: "Ei havaittuja riskejä",
      suggestedTitle: "Näin sammuttimen paine mitataan",
      suggestedTags: ["sammutin", "tarkastus", "vuosihuolto"],
    },
  },
  {
    id: "m2",
    kind: "video",
    title: "Palovaroittimien vaihto As Oy",
    tags: ["palovaroitin", "asuintalot"],
    folderId: "f_kentta",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=800&q=80",
    durationSeconds: 62,
    createdAt: "2026-06-28T13:44:00Z",
    analysisStatus: "done",
    analysis: {
      sceneDescription: "Uuden palovaroittimen kiinnitys huoneiston kattoon",
      workPhase: "Asennus",
      relatedService: "Palovaroitinurakka",
      safetyRisk: "Portaikkotyö — varmista tuki",
      suggestedTitle: "Palovaroittimen oikea asennuskorkeus",
      suggestedTags: ["palovaroitin", "asennus", "taloyhtiö"],
    },
  },
  {
    id: "m3",
    kind: "image",
    title: "Sammutinluokitusten näyttö",
    tags: ["sammutin", "koulutus"],
    folderId: "f_koulutus",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1568385247005-0d371d214a2f?w=800&q=80",
    durationSeconds: null,
    createdAt: "2026-06-20T08:00:00Z",
    analysisStatus: "done",
    analysis: {
      sceneDescription: "Rivi käsisammuttimia teholuokitusten mukaan järjestettynä",
      workPhase: "Koulutus",
      relatedService: "Alkusammutuskoulutus",
      safetyRisk: "Ei",
      suggestedTitle: "Mitä 27A 144B C tarkoittaa?",
      suggestedTags: ["teholuokka", "sammutin"],
    },
  },
  {
    id: "m4",
    kind: "video",
    title: "Väestönsuojan tarkastus",
    tags: ["vss", "spek", "tarkastus"],
    folderId: "f_kentta",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&q=80",
    durationSeconds: 118,
    createdAt: "2026-06-15T10:30:00Z",
    analysisStatus: "processing",
    analysis: null,
  },
  {
    id: "m5",
    kind: "image",
    title: "Asiakaskohteen sprinkleriketju",
    tags: ["sprinkleri", "teollisuus"],
    folderId: "f_asiakas",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1614078107806-7e6d5a52cd9e?w=800&q=80",
    durationSeconds: null,
    createdAt: "2026-06-10T14:10:00Z",
    analysisStatus: "done",
    analysis: {
      sceneDescription: "Teollisuushallin sprinklerijärjestelmän hälytysventtiili",
      workPhase: "Määräaikaishuolto",
      relatedService: "Sprinklerihuolto",
      safetyRisk: "Painetesti — varo roiskeita",
      suggestedTitle: "Hälytysventtiilin toiminta 90 sekunnissa",
      suggestedTags: ["sprinkleri", "teollisuus", "huolto"],
    },
  },
  {
    id: "m6",
    kind: "video",
    title: "Poistumisvalojen testaus hotelilla",
    tags: ["poistumisvalo", "hotelli"],
    folderId: "f_asiakas",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611095973362-88e8e2557e58?w=800&q=80",
    durationSeconds: 34,
    createdAt: "2026-06-02T18:20:00Z",
    analysisStatus: "pending",
    analysis: null,
  },
];

export const MOCK_SERIES: ContentSeries[] = [
  { id: "s1", name: "Työpäivä Savuksilla", description: "Behind-the-scenes kentältä", isActive: true },
  { id: "s2", name: "Löydätkö virheen", description: "Kuva/video jossa yleinen virhe — seuraaja vastaa", isActive: true },
  { id: "s3", name: "Näin se tehdään", description: "How-to lyhyt", isActive: true },
  { id: "s4", name: "Tiesitkö", description: "Faktapala", isActive: true },
  { id: "s5", name: "Asiakkaan kysymys", description: "Vastaus todelliseen asiakaskysymykseen", isActive: true },
  { id: "s6", name: "Yleisimmät virheet", description: "Top 3–5 virhettä per aihe", isActive: true },
  { id: "s7", name: "Laki käytännössä", description: "Pelastuslaki/asetus arjen tilanteessa", isActive: true },
];

export const MOCK_BRAND_BRAIN: BrandBrain = {
  writingStyle:
    "Selkeä, konkreettinen ja käytännönläheinen. Ei myyntitermejä. Pehmeä huumori sallittu, mutta turvallisuus otetaan vakavasti.",
  toneOfVoice:
    "Ammattilaiselta ammattilaiselle. Kuin puhuisit työkaverin isännöitsijälle kahvikupposen ääressä.",
  values:
    "Turvallisuus ihmisille ja omaisuudelle. Luotettavuus lupauksissa. Jatkuva oppiminen. Rehellinen kommunikaatio myös hankalista asioista.",
  services: [
    { name: "Palotarkastus", description: "Pelastuslain mukaiset tarkastukset ja pöytäkirjat." },
    { name: "Käsisammutinhuolto", description: "Määräaikaishuolto ja koeponnistus SFS-EN 3 mukaisesti." },
    { name: "Palovaroitinurakat", description: "Asennukset ja huolto taloyhtiöissä ja kiinteistöissä." },
    { name: "Sprinklerihuolto", description: "CEA 4001 / SFS-EN 12845 huollot." },
    { name: "Väestönsuojan tarkastus", description: "SPEK 2024 / RT 92-11173-S1 mukainen tarkastus." },
    { name: "Poistumisvalaistuksen huolto", description: "Vuosihuollot ja korjaukset." },
    { name: "Koulutukset", description: "Alkusammutus- ja henkilöturvallisuuskoulutukset." },
  ],
  targetAudiences: [
    "Isännöitsijät",
    "Kiinteistöpäälliköt",
    "Taloyhtiön hallitukset",
    "Yritysten turvallisuusvastaavat",
    "Julkiset kiinteistöt",
  ],
  ctas: [
    "Pyydä tarjous 24 h sisään",
    "Varaa vuositarkastus",
    "Lataa palotarkastuksen tarkistuslista",
    "Katso miksi asiakkaamme pysyvät",
  ],
  allowedSeries: MOCK_SERIES,
};

export const MOCK_CONTENT_QUEUE: ContentItem[] = [
  {
    id: "c1",
    title: "Näin sammuttimen paine mitataan",
    status: "in_review",
    mediaAssetId: "m1",
    seriesName: "Näin se tehdään",
    channels: ["tiktok", "instagram"],
    createdAt: "2026-07-03T12:00:00Z",
  },
  {
    id: "c2",
    title: "Palovaroittimen oikea asennuskorkeus",
    status: "approved",
    mediaAssetId: "m2",
    seriesName: "Näin se tehdään",
    channels: ["tiktok", "instagram", "facebook"],
    createdAt: "2026-07-02T09:30:00Z",
  },
  {
    id: "c3",
    title: "Löydätkö virheen tästä sammuttimesta?",
    status: "draft",
    mediaAssetId: "m3",
    seriesName: "Löydätkö virheen",
    channels: ["instagram"],
    createdAt: "2026-07-01T15:20:00Z",
  },
  {
    id: "c4",
    title: "Miksi VSS:n tiiveyskoe on välttämätön",
    status: "scheduled",
    mediaAssetId: "m4",
    seriesName: "Tiesitkö",
    channels: ["linkedin", "blog"],
    createdAt: "2026-06-30T11:00:00Z",
  },
  {
    id: "c5",
    title: "Sprinkleri hälyttää — mitä tapahtuu ensimmäiset 90 s?",
    status: "published",
    mediaAssetId: "m5",
    seriesName: "Näin se tehdään",
    channels: ["tiktok", "linkedin"],
    createdAt: "2026-06-25T08:45:00Z",
  },
];

export const MOCK_CALENDAR: CalendarEvent[] = [
  {
    id: "e1",
    title: "Palovaroittimen oikea asennuskorkeus",
    channel: "tiktok",
    status: "scheduled",
    scheduledAt: "2026-07-08T08:00:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=400&q=80",
  },
  {
    id: "e2",
    title: "Miksi VSS:n tiiveyskoe on välttämätön",
    channel: "linkedin",
    status: "scheduled",
    scheduledAt: "2026-07-09T10:00:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1615873968403-89e068629265?w=400&q=80",
  },
  {
    id: "e3",
    title: "Näin sammuttimen paine mitataan",
    channel: "instagram",
    status: "scheduled",
    scheduledAt: "2026-07-10T17:30:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1601000937971-6e0d1ad9f4a2?w=400&q=80",
  },
  {
    id: "e4",
    title: "Löydätkö virheen tästä sammuttimesta?",
    channel: "instagram",
    status: "draft",
    scheduledAt: "2026-07-12T09:00:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1568385247005-0d371d214a2f?w=400&q=80",
  },
  {
    id: "e5",
    title: "Sprinkleri hälyttää — 90 s",
    channel: "tiktok",
    status: "published",
    scheduledAt: "2026-07-01T08:00:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1614078107806-7e6d5a52cd9e?w=400&q=80",
  },
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  views: 128_540,
  engagement: 4.7,
  publishedCount: 42,
  avgWatchSeconds: 28,
  topTopics: [
    { topic: "Sammutinhuolto", views: 42_120 },
    { topic: "Palovaroittimet", views: 31_450 },
    { topic: "VSS-tarkastukset", views: 22_130 },
    { topic: "Sprinklerit", views: 18_990 },
  ],
  topVideos: [
    {
      title: "Sprinkleri hälyttää — 90 s",
      views: 24_500,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1614078107806-7e6d5a52cd9e?w=400&q=80",
    },
    {
      title: "Näin sammuttimen paine mitataan",
      views: 18_200,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1601000937971-6e0d1ad9f4a2?w=400&q=80",
    },
    {
      title: "Palovaroittimen oikea asennuskorkeus",
      views: 15_760,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=400&q=80",
    },
  ],
};
