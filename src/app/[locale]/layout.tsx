import { NextIntlClientProvider } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Providers from "@/components/Providers";
import { PublicChrome } from "@/components/PublicChrome";
import { prisma } from "@/lib/prisma";

export function generateStaticParams() {
  return [{ locale: "es" }];
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {

  const [messages, whatsappRow] = await Promise.all([
    import("../../../messages/es.json").then((m) => m.default),
    prisma.siteSetting.findUnique({ where: { key: "whatsapp" } }),
  ]);
  const whatsapp = whatsappRow?.value ?? "19393264007";

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Block BitDefender / similar extension-injected attributes before React hydration to avoid noisy hydration mismatch warnings. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var BLOCK=['bis_skin_checked','bis_register','bis_use','data-bis-config','data-dynamic-id'];function isBlocked(n){if(!n)return false;n=String(n);if(BLOCK.indexOf(n)>-1)return true;if(n.indexOf('__processed_')===0)return true;if(n.indexOf('bis_')===0)return true;return false;}var origSet=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){if(isBlocked(name))return;return origSet.call(this,name,value);};var origSetNS=Element.prototype.setAttributeNS;Element.prototype.setAttributeNS=function(ns,name,value){if(isBlocked(name))return;return origSetNS.call(this,ns,name,value);};function strip(n){if(!n||n.nodeType!==1)return;var atts=n.attributes;if(!atts)return;for(var i=atts.length-1;i>=0;i--){var a=atts[i];if(a&&isBlocked(a.name)){try{n.removeAttribute(a.name);}catch(e){}}}}var mo=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'&&m.target&&isBlocked(m.attributeName)){try{m.target.removeAttribute(m.attributeName);}catch(e){}}else if(m.type==='childList'&&m.addedNodes){m.addedNodes.forEach(function(x){strip(x);if(x.querySelectorAll)x.querySelectorAll('*').forEach(strip);});}}});try{mo.observe(document.documentElement,{attributes:true,subtree:true,childList:true});}catch(e){}document.addEventListener('DOMContentLoaded',function(){try{document.querySelectorAll('*').forEach(strip);}catch(e){}});}catch(e){}})();`
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale="es" messages={messages}>
          <Providers>
            <PublicChrome><Navbar whatsapp={whatsapp} /></PublicChrome>
            <main>{children}</main>
            <PublicChrome><Footer whatsapp={whatsapp} /></PublicChrome>
            <WhatsAppButton whatsapp={whatsapp} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
