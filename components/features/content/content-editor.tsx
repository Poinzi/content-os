"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, CheckCheck, Undo2 } from "lucide-react";
import type {
  ContentItemDetail,
  ContentStatus,
  ContentVariant,
} from "@/lib/types";
import { CHANNEL_LABEL } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  item: ContentItemDetail;
}

type SaveState = "idle" | "saving" | "saved" | "error";

interface EditableVariant extends ContentVariant {
  hashtagsInput: string; // pilkulla erotettu näkymä editointia varten
  saveState: SaveState;
  errorMsg?: string;
}

function toEditable(v: ContentVariant): EditableVariant {
  return {
    ...v,
    hashtagsInput: v.hashtags.join(", "),
    saveState: "idle",
  };
}

function nextItemStatus(current: ContentStatus): ContentStatus | null {
  if (current === "draft") return "in_review";
  if (current === "in_review") return "approved";
  return null;
}

function itemStatusLabel(next: ContentStatus): string {
  if (next === "in_review") return "Lähetä tarkastukseen";
  if (next === "approved") return "Hyväksy sisältö";
  return "Siirrä eteenpäin";
}

export function ContentEditor({ item }: Props) {
  const router = useRouter();
  const [variants, setVariants] = useState<EditableVariant[]>(
    item.variants.map(toEditable),
  );
  const [itemStatus, setItemStatus] = useState<ContentStatus>(item.status);
  const [itemBusy, setItemBusy] = useState(false);

  function patchVariant(idx: number, patch: Partial<EditableVariant>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    );
  }

  async function saveVariant(idx: number) {
    const v = variants[idx];
    patchVariant(idx, { saveState: "saving", errorMsg: undefined });
    const hashtags = v.hashtagsInput
      .split(",")
      .map((s) => s.trim().replace(/^#+/, ""))
      .filter(Boolean);
    try {
      const res = await fetch(`/api/content/variants/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: v.body,
          cta: v.cta,
          hashtags,
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(b?.error ?? `HTTP ${res.status}`);
      }
      patchVariant(idx, {
        hashtags,
        hashtagsInput: hashtags.join(", "),
        saveState: "saved",
      });
      setTimeout(() => patchVariant(idx, { saveState: "idle" }), 800);
    } catch (err) {
      patchVariant(idx, {
        saveState: "error",
        errorMsg: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function setVariantStatus(idx: number, status: ContentStatus) {
    const v = variants[idx];
    patchVariant(idx, { saveState: "saving" });
    try {
      const res = await fetch(`/api/content/variants/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      patchVariant(idx, { status, saveState: "saved" });
      setTimeout(() => patchVariant(idx, { saveState: "idle" }), 800);
    } catch (err) {
      patchVariant(idx, {
        saveState: "error",
        errorMsg: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function advanceItemStatus() {
    const next = nextItemStatus(itemStatus);
    if (!next) return;
    setItemBusy(true);
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItemStatus(next);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setItemBusy(false);
    }
  }

  const nextStatus = nextItemStatus(itemStatus);

  return (
    <div className="space-y-4">
      {nextStatus ? (
        <Card>
          <CardBody className="flex items-center justify-between gap-4">
            <div className="text-sm text-text-secondary">
              Nykytila:{" "}
              <span className="text-text-primary">
                <StatusPill status={itemStatus} />
              </span>
            </div>
            <Button
              size="sm"
              disabled={itemBusy}
              onClick={advanceItemStatus}
              className="gap-2"
            >
              {nextStatus === "in_review" ? (
                <Send className="h-4 w-4" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {itemStatusLabel(nextStatus)}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {variants.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-tertiary">
            Ei kanavavariantteja tälle sisällölle.
          </CardBody>
        </Card>
      ) : (
        variants.map((v, i) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANNEL_LABEL[v.channel]}
              </CardTitle>
              <StatusPill status={v.status} />
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-text-tertiary">
                  Julkaisuteksti
                </label>
                <textarea
                  value={v.body}
                  onChange={(e) => patchVariant(i, { body: e.target.value })}
                  rows={Math.max(4, Math.min(12, v.body.split("\n").length + 1))}
                  className="mt-1 w-full resize-y rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-text-tertiary">
                    CTA
                  </label>
                  <input
                    value={v.cta}
                    onChange={(e) => patchVariant(i, { cta: e.target.value })}
                    placeholder="Yksi lause"
                    className="mt-1 w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-text-tertiary">
                    Hashtagit (pilkulla eroteltuna)
                  </label>
                  <input
                    value={v.hashtagsInput}
                    onChange={(e) =>
                      patchVariant(i, { hashtagsInput: e.target.value })
                    }
                    placeholder="paloturvallisuus, savuks, ..."
                    className="mt-1 w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => saveVariant(i)}
                  disabled={v.saveState === "saving"}
                  className="gap-2"
                >
                  {v.saveState === "saving" ? "Tallennetaan…" : "Tallenna"}
                </Button>
                {v.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setVariantStatus(i, "in_review")}
                    className="gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Lähetä tarkastukseen
                  </Button>
                ) : null}
                {v.status === "in_review" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setVariantStatus(i, "approved")}
                      className="gap-2"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Hyväksy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVariantStatus(i, "draft")}
                      className="gap-2"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Palauta luonnokseksi
                    </Button>
                  </>
                ) : null}
                {v.saveState === "saved" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-status-success">
                    <Check className="h-3 w-3" />
                    Tallennettu
                  </span>
                ) : null}
                {v.saveState === "error" ? (
                  <span
                    className={cn(
                      "text-xs text-red-400",
                      "truncate max-w-[240px]",
                    )}
                    title={v.errorMsg}
                  >
                    Virhe: {v.errorMsg}
                  </span>
                ) : null}
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
