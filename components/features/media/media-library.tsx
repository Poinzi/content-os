"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Upload,
  Folder as FolderIcon,
  FolderOpen,
  Play,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { Folder, MediaAsset } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";

interface Props {
  media: MediaAsset[];
  folders: Folder[];
}

export function MediaLibrary({ media, folders }: Props) {
  const [query, setQuery] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    media.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [media]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return media.filter((m) => {
      if (folderId && m.folderId !== folderId) return false;
      if (activeTag && !m.tags.includes(activeTag)) return false;
      if (q) {
        const inTitle = m.title.toLowerCase().includes(q);
        const inTag = m.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inTag) return false;
      }
      return true;
    });
  }, [media, query, folderId, activeTag]);

  return (
    <div className="flex gap-6">
      {/* Vasen kansiopuu */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Kansiot
        </div>
        <div className="mt-3 space-y-1">
          <FolderButton
            active={folderId === null}
            onClick={() => setFolderId(null)}
            icon={<FolderOpen className="h-4 w-4" />}
            label="Kaikki"
          />
          {folders.map((f) => (
            <FolderButton
              key={f.id}
              active={folderId === f.id}
              onClick={() => setFolderId(f.id)}
              icon={<FolderIcon className="h-4 w-4" />}
              label={f.name}
            />
          ))}
        </div>
      </aside>

      {/* Oikea sisältö */}
      <section className="min-w-0 flex-1 space-y-4">
        {/* Työkalurivi */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hae otsikolla tai tagilla…"
              className="w-full rounded-md border border-border-subtle bg-bg-surface pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
            />
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Lataa media
          </Button>
        </div>

        {/* Tagisuodattimet */}
        {uniqueTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {uniqueTags.map((t) => {
              const on = activeTag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTag(on ? null : t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    on
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border-subtle bg-bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text-primary",
                  )}
                >
                  #{t}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Ruudukko */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Upload className="h-6 w-6" />}
            title="Ei mediaa"
            description="Lataa ensimmäinen kuva tai video. AI-analyysi ehdottaa otsikon ja tagit (v1)."
            action={
              <Button className="mt-2 gap-2">
                <Upload className="h-4 w-4" />
                Lataa media
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => (
              <MediaCard key={m.id} asset={m} onOpen={() => setSelected(m)} />
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selected ? (
        <Lightbox asset={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function FolderButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-bg-surface-2 text-text-primary"
          : "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function MediaCard({
  asset,
  onOpen,
}: {
  asset: MediaAsset;
  onOpen: () => void;
}) {
  const extra = asset.tags.length > 2 ? asset.tags.length - 2 : 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-md border border-border-subtle bg-bg-surface text-left transition-colors hover:border-border-strong"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-surface-2">
        <Image
          src={asset.thumbnailUrl}
          alt={asset.title}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {asset.kind === "video" ? (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 p-3 backdrop-blur">
                <Play className="h-5 w-5 text-white" />
              </div>
            </div>
            {asset.durationSeconds != null ? (
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                {asset.durationSeconds}s
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="space-y-2 px-3 py-3">
        <div className="truncate text-sm font-medium text-text-primary">
          {asset.title}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {asset.tags.slice(0, 2).map((t) => (
            <Badge key={t}>#{t}</Badge>
          ))}
          {extra > 0 ? <Badge>+{extra}</Badge> : null}
        </div>
      </div>
    </button>
  );
}

function Lightbox({
  asset,
  onClose,
}: {
  asset: MediaAsset;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<
    import("@/lib/types").MediaAnalysis | null
  >(asset.analysis ?? null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{
    variantsCount: number;
    contentItemId: string;
    demo?: boolean;
  } | null>(null);

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch(`/api/media/${asset.id}/analyze`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        analysis: import("@/lib/types").MediaAnalysis;
        demo?: boolean;
      };
      setAnalysis(body.analysis);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function runGenerate() {
    setGenerating(true);
    setGenError(null);
    setGenerated(null);
    try {
      const res = await fetch(`/api/media/${asset.id}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        generated: import("@/lib/ai/generate-content").GeneratedContent;
        contentItemId: string;
        demo?: boolean;
      };
      setGenerated({
        variantsCount: body.generated.variants.length,
        contentItemId: body.contentItemId,
        demo: body.demo,
      });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl border border-border-strong bg-bg-surface shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative hidden flex-1 bg-black sm:block">
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-bg-surface-2" />
          )}
          <Image
            src={asset.thumbnailUrl}
            alt={asset.title}
            fill
            sizes="60vw"
            className={cn(
              "object-contain transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setLoaded(true)}
            unoptimized
          />
        </div>
        <aside className="w-full flex-col overflow-y-auto sm:w-80 sm:flex">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <h2 className="text-sm font-semibold tracking-display text-text-primary">
              Tiedot
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-tertiary transition-colors hover:text-text-primary"
              aria-label="Sulje"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 px-5 py-5 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-tertiary">
                Otsikko
              </div>
              <div className="mt-1 font-medium text-text-primary">
                {asset.title}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-tertiary">
                Tagit
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {asset.tags.length === 0 ? (
                  <span className="text-xs text-text-tertiary">—</span>
                ) : (
                  asset.tags.map((t) => <Badge key={t}>#{t}</Badge>)
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-tertiary">
                Lisätty
              </div>
              <div className="mt-1 text-text-secondary">
                {formatDate(asset.createdAt)}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-base p-4">
              <div className="flex items-center gap-2 text-text-primary">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold">AI-analyysi</span>
              </div>
              {analysis ? (
                <div className="space-y-2 text-xs">
                  <AnalysisRow label="Kuvaus">{analysis.sceneDescription}</AnalysisRow>
                  <AnalysisRow label="Työvaihe">{analysis.workPhase}</AnalysisRow>
                  <AnalysisRow label="Palvelu">{analysis.relatedService}</AnalysisRow>
                  <AnalysisRow label="Turvallisuus">{analysis.safetyRisk}</AnalysisRow>
                  <AnalysisRow label="Ehdotettu otsikko">
                    {analysis.suggestedTitle}
                  </AnalysisRow>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
                      Ehdotetut tagit
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {analysis.suggestedTags.map((t) => (
                        <Badge key={t}>#{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-text-secondary">
                  Claude Vision analysoi sisällön, työvaiheen, palvelun ja
                  turvallisuusriskin sekä ehdottaa otsikon ja tagit.
                </p>
              )}
              {analyzeError ? (
                <p className="text-xs text-red-400">Virhe: {analyzeError}</p>
              ) : null}
              <Button
                className="w-full gap-2"
                size="sm"
                variant={analysis ? "secondary" : "primary"}
                disabled={analyzing}
                onClick={runAnalysis}
              >
                <Sparkles className="h-4 w-4" />
                {analyzing
                  ? "Analysoidaan…"
                  : analysis
                    ? "Analysoi uudelleen"
                    : "Analysoi"}
              </Button>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                disabled={generating || !analysis}
                onClick={runGenerate}
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Luodaan sisältöä…" : "Luo sisältö"}
              </Button>
              {!analysis ? (
                <p className="text-[11px] text-text-tertiary">
                  Analysoi media ensin — sisällöntuotanto käyttää Vision-analyysiä.
                </p>
              ) : null}
              {genError ? (
                <p className="text-xs text-red-400">Virhe: {genError}</p>
              ) : null}
              {generated ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  <div className="font-semibold">
                    ✓ Luotu {generated.variantsCount} kanavavarianttia
                    {generated.demo ? " (demo)" : ""}
                  </div>
                  <Link
                    href="/content"
                    className="mt-2 inline-flex items-center gap-1 text-emerald-100 hover:underline"
                  >
                    Avaa Sisältöjonossa <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AnalysisRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div className="mt-0.5 text-text-primary">{children}</div>
    </div>
  );
}
