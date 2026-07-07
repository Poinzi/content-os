"use client";

import { useState, useRef } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import type { BrandBrain, ContentSeries } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  initial: BrandBrain;
}

type SaveState = "saved" | "dirty" | "saving" | "error";

// Kentät, jotka postataan PATCH /api/brand-brain -reittiin. `allowedSeries`
// mennee erillisen /series/[id] -reitin läpi, joten se ei kuulu tähän.
const BRAIN_FIELDS: ReadonlyArray<
  keyof Pick<
    BrandBrain,
    "writingStyle" | "toneOfVoice" | "values" | "services" | "targetAudiences" | "ctas"
  >
> = ["writingStyle", "toneOfVoice", "values", "services", "targetAudiences", "ctas"];

export function BrandBrainForm({ initial }: Props) {
  const [data, setData] = useState<BrandBrain>(initial);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Kerätyt kentät, jotka pitää postata seuraavassa flushissa.
  const pending = useRef<Set<keyof BrandBrain>>(new Set());
  // Uusin data ref-muodossa, jotta debounce-callback lukee tuoreen tilan.
  const latestRef = useRef<BrandBrain>(initial);

  const flushBrain = async () => {
    const changed = Array.from(pending.current).filter((k): k is (typeof BRAIN_FIELDS)[number] =>
      (BRAIN_FIELDS as readonly string[]).includes(k as string),
    );
    if (changed.length === 0) {
      // Voi olla että vain allowedSeries oli likainen — se hoidetaan togglessa
      // suoraan, joten voidaan merkitä tallennetuksi.
      pending.current.clear();
      setSaveState("saved");
      return;
    }
    const body: Record<string, unknown> = {};
    for (const k of changed) body[k] = latestRef.current[k];
    setSaveState("saving");
    try {
      const res = await fetch("/api/brand-brain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pending.current.clear();
      setSaveState("saved");
    } catch (err) {
      console.error("[BrandBrainForm] autosave epäonnistui:", err);
      setSaveState("error");
    }
  };

  const update = <K extends keyof BrandBrain>(key: K, value: BrandBrain[K]) => {
    setData((d) => {
      const next = { ...d, [key]: value };
      latestRef.current = next;
      return next;
    });
    pending.current.add(key);
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flushBrain();
    }, 700);
  };

  const toggleSeries = async (seriesId: string) => {
    // Optimistinen: käännä paikallisesti heti, kutsu API, rollback jos error.
    const before = latestRef.current.allowedSeries;
    const target = before.find((x) => x.id === seriesId);
    if (!target) return;
    const nextActive = !target.isActive;
    const nextSeries = before.map((x) =>
      x.id === seriesId ? { ...x, isActive: nextActive } : x,
    );
    setData((d) => {
      const next = { ...d, allowedSeries: nextSeries };
      latestRef.current = next;
      return next;
    });
    setSaveState("saving");
    try {
      const res = await fetch(`/api/brand-brain/series/${encodeURIComponent(seriesId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Jos brain-kenttiä on debouncessa, älä ylikirjoita "saving" → jätä ne
      // hoitamaan flush omalla ajallaan.
      if (pending.current.size === 0) setSaveState("saved");
    } catch (err) {
      console.error("[BrandBrainForm] sarjan päivitys epäonnistui:", err);
      // Rollback
      setData((d) => {
        const next = { ...d, allowedSeries: before };
        latestRef.current = next;
        return next;
      });
      setSaveState("error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Ylälaatikko */}
      <Card>
        <CardBody className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm text-text-secondary">
              AI käyttää näitä tietoja automaattisesti kaikessa
              sisällöntuotannossa. Käyttäjän ei tarvitse kirjoittaa promptia.
            </p>
          </div>
          <div className="shrink-0 text-xs">
            {saveState === "saved" ? (
              <span className="inline-flex items-center gap-1 text-status-success">
                <Check className="h-3.5 w-3.5" />
                Tallennettu
              </span>
            ) : saveState === "saving" ? (
              <span className="text-text-tertiary">Tallennetaan…</span>
            ) : saveState === "dirty" ? (
              <span className="text-text-tertiary">Muutoksia…</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-status-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                Tallennus epäonnistui
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      <BlockCard title="Kirjoitustyyli">
        <TextArea
          value={data.writingStyle}
          onChange={(v) => update("writingStyle", v)}
          placeholder="Selkeä, konkreettinen, ei myyntitermejä…"
        />
      </BlockCard>

      <BlockCard title="Äänensävy">
        <TextArea
          value={data.toneOfVoice}
          onChange={(v) => update("toneOfVoice", v)}
          placeholder="Ammattilaiselta ammattilaiselle…"
        />
      </BlockCard>

      <BlockCard
        title="Palvelut"
        hint="Yhtiön ydinpalvelut. AI käyttää näitä otsikoissa ja teksteissä."
      >
        <ChipList
          items={data.services.map((s) => s.name)}
          onChange={(names) =>
            update(
              "services",
              names.map((name) => {
                const existing = data.services.find((s) => s.name === name);
                return existing ?? { name };
              }),
            )
          }
          placeholder="Lisää palvelu ja paina Enter"
        />
      </BlockCard>

      <BlockCard title="Kohderyhmät">
        <ChipList
          items={data.targetAudiences}
          onChange={(v) => update("targetAudiences", v)}
          placeholder="Lisää kohderyhmä ja paina Enter"
        />
      </BlockCard>

      <BlockCard title="CTA:t">
        <ChipList
          items={data.ctas}
          onChange={(v) => update("ctas", v)}
          placeholder="Lisää CTA ja paina Enter"
        />
      </BlockCard>

      <BlockCard title="Yrityksen arvot">
        <TextArea
          value={data.values}
          onChange={(v) => update("values", v)}
          placeholder="Turvallisuus, luotettavuus…"
        />
      </BlockCard>

      <BlockCard title="Sallitut sisältösarjat">
        <p className="mb-3 text-xs text-text-secondary">
          Vain aktiiviset sarjat ovat valittavissa AI Generatorissa.
        </p>
        <div className="flex flex-wrap gap-2">
          {data.allowedSeries.map((s) => (
            <SeriesToggle
              key={s.id}
              series={s}
              onToggle={() => {
                void toggleSeries(s.id);
              }}
            />
          ))}
        </div>
      </BlockCard>
    </div>
  );
}

function BlockCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {hint ? <p className="text-xs text-text-secondary">{hint}</p> : null}
        <div className="pt-1">{children}</div>
      </CardBody>
    </Card>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
    />
  );
}

function ChipList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const remove = (i: number) => {
    const next = items.slice();
    next.splice(i, 1);
    onChange(next);
  };

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (items.includes(v)) {
      setInput("");
      return;
    }
    onChange([...items, v]);
    setInput("");
  };

  return (
    <div className="rounded-md border border-border-subtle bg-bg-base p-2">
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span
            key={it + i}
            className="inline-flex items-center gap-1 rounded-md bg-bg-surface-2 px-2 py-1 text-xs text-text-primary"
          >
            {it}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-text-tertiary transition-colors hover:text-text-primary"
              aria-label={`Poista ${it}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            } else if (
              e.key === "Backspace" &&
              !input &&
              items.length > 0
            ) {
              e.preventDefault();
              remove(items.length - 1);
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="flex-1 min-w-[160px] bg-transparent px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary outline-none"
        />
      </div>
    </div>
  );
}

function SeriesToggle({
  series,
  onToggle,
}: {
  series: ContentSeries;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        series.isActive
          ? "border-accent bg-accent/10 text-text-primary"
          : "border-border-subtle bg-bg-surface-2 text-text-tertiary hover:border-border-strong hover:text-text-secondary",
      )}
      title={series.description ?? undefined}
    >
      {series.isActive ? "✓ " : ""}
      {series.name}
    </button>
  );
}
