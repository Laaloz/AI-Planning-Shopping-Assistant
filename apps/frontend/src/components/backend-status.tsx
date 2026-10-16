"use client";

import { HealthResponseSchema } from "@app/contracts";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Status = "checking" | "ok" | "unavailable";

const DOT_CLASSES: Record<Status, string> = {
  checking: "bg-muted-foreground",
  ok: "bg-success",
  unavailable: "bg-destructive",
};

/** Shows whether the backend answers through the /api rewrite. The text carries the meaning. */
export function BackendStatus() {
  const t = useTranslations("BackendStatus");
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
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[status]}`} />
      {t(status)}
    </p>
  );
}
