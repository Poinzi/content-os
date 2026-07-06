import type {
  AnalyticsSummary,
  BrandBrain,
  CalendarEvent,
  ContentItem,
  Folder,
  MediaAsset,
  Membership,
  Organization,
} from "@/lib/types";
import { isEnabled as dbEnabled } from "@/lib/db";
import {
  MOCK_ANALYTICS,
  MOCK_BRAND_BRAIN,
  MOCK_CALENDAR,
  MOCK_CONTENT_QUEUE,
  MOCK_FOLDERS,
  MOCK_MEDIA,
  MOCK_MEMBERSHIPS,
} from "@/lib/mock/data";

function useMock() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || !dbEnabled;
}

export async function getMemberships(_userId?: string): Promise<Membership[]> {
  if (useMock()) return MOCK_MEMBERSHIPS;
  // TODO: SELECT organization + role FROM organization_members JOIN organizations WHERE user_id=$1
  return MOCK_MEMBERSHIPS;
}

export async function getActiveOrg(orgId: string): Promise<Organization | null> {
  const list = await getMemberships();
  return list.find((m) => m.organization.id === orgId)?.organization ?? list[0]?.organization ?? null;
}

export async function getMedia(_orgId: string): Promise<MediaAsset[]> {
  if (useMock()) return MOCK_MEDIA;
  // TODO: SELECT * FROM media_assets WHERE org_id=$1 ORDER BY created_at DESC
  return MOCK_MEDIA;
}

export async function getFolders(_orgId: string): Promise<Folder[]> {
  if (useMock()) return MOCK_FOLDERS;
  // TODO: SELECT * FROM folders WHERE org_id=$1 ORDER BY name
  return MOCK_FOLDERS;
}

export async function getBrandBrain(_orgId: string): Promise<BrandBrain> {
  if (useMock()) return MOCK_BRAND_BRAIN;
  // TODO: SELECT * FROM brand_brains WHERE org_id=$1
  return MOCK_BRAND_BRAIN;
}

export async function getContentQueue(_orgId: string): Promise<ContentItem[]> {
  if (useMock()) return MOCK_CONTENT_QUEUE;
  // TODO: SELECT * FROM content_items WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50
  return MOCK_CONTENT_QUEUE;
}

export async function getCalendarEvents(_orgId: string): Promise<CalendarEvent[]> {
  if (useMock()) return MOCK_CALENDAR;
  // TODO: SELECT * FROM calendar_events WHERE org_id=$1 AND scheduled_at >= NOW() ORDER BY scheduled_at
  return MOCK_CALENDAR;
}

export async function getAnalytics(_orgId: string): Promise<AnalyticsSummary> {
  if (useMock()) return MOCK_ANALYTICS;
  // TODO: aggregate from analytics_events or provider integration
  return MOCK_ANALYTICS;
}
