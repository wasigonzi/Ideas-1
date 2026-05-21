import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/request";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always"
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
