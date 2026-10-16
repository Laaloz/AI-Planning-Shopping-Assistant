import { hasLocale, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BackendStatus } from "@/components/backend-status";
import { routing } from "@/i18n/routing";

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("Home");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">{t("badge")}</p>
      <h1 lang="en" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        AI Planning &amp; Shopping Assistant
      </h1>
      <p className="text-lg leading-8 text-muted-foreground">{t("intro")}</p>
      <BackendStatus />
    </main>
  );
}
