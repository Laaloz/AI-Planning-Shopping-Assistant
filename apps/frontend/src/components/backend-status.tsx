"use client";

import { HealthResponseSchema } from "@app/contracts";
import { useEffect, useState } from "react";

type Status = "checking" | "ok" | "unavailable";

const LABELS: Record<Status, string> = {
  checking: "Tarkistetaan yhteyttä taustapalveluun…",
  ok: "Taustapalvelu vastaa.",
  unavailable: "Taustapalveluun ei saada yhteyttä.",
};

const DOT_CLASSES: Record<Status, string> = {
  checking: "bg-zinc-400",
  ok: "bg-emerald-600",
  unavailable: "bg-red-600",
};

/** Shows whether the backend answers through the /api rewrite. The text carries the meaning. */
export function BackendStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/health", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body: unknown = response.ok ? await response.json() : null;
        setStatus(HealthResponseSchema.safeParse(body).success ? "ok" : "unavailable");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  return (
    <p role="status" className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[status]}`} />
      {LABELS[status]}
    </p>
  );
}
