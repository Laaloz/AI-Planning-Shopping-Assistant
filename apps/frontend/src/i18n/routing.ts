import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fi", "en"],
  defaultLocale: "fi",
  // Finnish lives at "/", English at "/en".
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
