import { getRequestConfig } from "next-intl/server";

export const locales = ["es"] as const;
export const defaultLocale = "es" as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  return {
    locale: "es",
    messages: (await import("../../messages/es.json")).default
  };
});
