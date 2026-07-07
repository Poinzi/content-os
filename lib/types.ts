export type OrgRole = "owner" | "admin" | "editor" | "reviewer" | "viewer";
export type ContentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";
export type Channel = "tiktok" | "instagram" | "facebook" | "linkedin" | "blog";
export type AssetKind = "image" | "video";
export type AspectRatio = "9:16" | "1:1" | "16:9";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface Membership {
  organization: Organization;
  role: OrgRole;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface MediaAnalysis {
  sceneDescription: string;
  workPhase: string;
  relatedService: string;
  safetyRisk: string;
  suggestedTitle: string;
  suggestedTags: string[];
}

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  title: string;
  tags: string[];
  folderId?: string | null;
  thumbnailUrl: string;
  durationSeconds?: number | null;
  createdAt: string;
  analysisStatus: "pending" | "processing" | "done" | "error";
  analysis?: MediaAnalysis | null;
}

export interface ContentSeries {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface BrandBrain {
  writingStyle: string;
  services: { name: string; description?: string }[];
  targetAudiences: string[];
  toneOfVoice: string;
  ctas: string[];
  values: string;
  allowedSeries: ContentSeries[];
}

export interface ContentVariant {
  id: string;
  channel: Channel;
  body: string;
  hashtags: string[];
  cta: string;
  status: ContentStatus;
}

export interface ContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  mediaAssetId?: string | null;
  seriesName?: string | null;
  channels: Channel[];
  createdAt: string;
}

export interface ContentItemDetail extends ContentItem {
  variants: ContentVariant[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  channel: Channel;
  status: "draft" | "scheduled" | "published";
  scheduledAt: string;
  thumbnailUrl?: string;
  contentVariantId?: string; // linkitys editoriin (valinnainen)
  contentItemId?: string; // linkitys Sisältöjonoon (valinnainen)
}

export interface AnalyticsSummary {
  views: number;
  engagement: number;
  publishedCount: number;
  avgWatchSeconds: number;
  topTopics: { topic: string; views: number }[];
  topVideos: { title: string; views: number; thumbnailUrl: string }[];
}

export const ROLE_RANK: Record<OrgRole, number> = {
  owner: 5,
  admin: 4,
  editor: 3,
  reviewer: 2,
  viewer: 1,
};

export function hasRole(role: OrgRole, min: OrgRole) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  blog: "Blogi",
};
