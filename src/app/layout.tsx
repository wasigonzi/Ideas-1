import "./globals.css";
import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ideas, LLC — Impresión y rotulación en Puerto Rico",
  description:
    "Más de 8,500 pies cuadrados de espacio para ofrecer impresiones y rotulación de primera. Manufactura, instalación, rotulación e impresión digital.",
  metadataBase: new URL("https://printingideaspr.com"),
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ideas, LLC" }
};

export const viewport: Viewport = {
  themeColor: "#060b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const faviconRow = await prisma.siteSetting.findUnique({ where: { key: "favicon_url" } });
  const faviconUrl = faviconRow?.value || null;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var BLOCK=['bis_skin_checked','bis_register','bis_use','data-bis-config','data-dynamic-id'];function isBlocked(n){if(!n)return false;n=String(n);if(BLOCK.indexOf(n)>-1)return true;if(n.indexOf('__processed_')===0)return true;if(n.indexOf('bis_')===0)return true;return false;}var origSet=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){if(isBlocked(name))return;return origSet.call(this,name,value);};var origSetNS=Element.prototype.setAttributeNS;Element.prototype.setAttributeNS=function(ns,name,value){if(isBlocked(name))return;return origSetNS.call(this,ns,name,value);};function strip(n){if(!n||n.nodeType!==1)return;var atts=n.attributes;if(!atts)return;for(var i=atts.length-1;i>=0;i--){var a=atts[i];if(a&&isBlocked(a.name)){try{n.removeAttribute(a.name);}catch(e){}}}}var mo=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'&&m.target&&isBlocked(m.attributeName)){try{m.target.removeAttribute(m.attributeName);}catch(e){}}else if(m.type==='childList'&&m.addedNodes){m.addedNodes.forEach(function(x){strip(x);if(x.querySelectorAll)x.querySelectorAll('*').forEach(strip);});}}});try{mo.observe(document.documentElement,{attributes:true,subtree:true,childList:true});}catch(e){}document.addEventListener('DOMContentLoaded',function(){try{document.querySelectorAll('*').forEach(strip);}catch(e){}});}catch(e){}})();`
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
