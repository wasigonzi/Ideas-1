// Seed the 5 store products imported from Shopify
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "stickers-full-color",
    title: "Stickers Impresos Full Color - Varios Tamaños",
    description: `<p><strong>PRINTING IDEAS</strong></p>
<p>Custom stickers in bulk. Printing Ideas produces custom stickers for businesses that need consistency, speed, and the best price per unit. Buy online. No quotes. No complications.</p>
<hr/>
<p><strong>WHY PRINTING IDEAS?</strong></p>
<p>• Specialists in bulk production<br/>• Best price per unit<br/>• Fast and reliable production<br/>• Guaranteed professional quality</p>
<hr/>
<p><strong>AVAILABLE SIZES</strong></p>
<p>• 2" x 2"<br/>• 3" x 3"<br/>• 4" x 4"</p>
<hr/>
<p><strong>QUALITY</strong></p>
<p>• Professional-grade vinyl<br/>• Matte or gloss lamination<br/>• Precision die-cut<br/>• Full-color printing</p>
<hr/>
<p><strong>HOW IT WORKS</strong></p>
<p>Choose your package<br/>Upload your artwork<br/>Production in 5–7 business days</p>
<hr/>
<p><strong>IDEAL FOR</strong></p>
<p>Realtors · Restaurants · Brands · Events</p>`,
    category: "Stickers",
    image: "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/Stickers_Full_Color_Die_Cut.jpg",
    images: JSON.stringify([
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/Stickers_Full_Color_Die_Cut.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/IMG_8036.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/Digital_cutter.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/IMG_9748.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/Stickers_2.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/Stickers_3.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/Stickers_4.jpg",
    ]),
    variants: JSON.stringify([
      { title: '2" x 2" / Diseño $75', option1: '2" x 2"', option2: "Diseño $75", price: "0.26", compareAtPrice: "0.17", available: true },
      { title: '3" x 3" / Diseño $75', option1: '3" x 3"', option2: "Diseño $75", price: "0.31", compareAtPrice: "0.17", available: true },
      { title: '4" x 4" / Diseño $75', option1: '4" x 4"', option2: "Diseño $75", price: "0.44", compareAtPrice: "0.17", available: true },
    ]),
    priceFrom: 0.26,
    active: true,
    order: 1,
  },
  {
    slug: "d-boards-full-color",
    title: "D-Boards Impresos Full Color - Varios Tamaños",
    description: `<p><strong>Make your message stand out.</strong><br/>Our full-color printed D-Boards are a fast, cost-effective, and highly visible solution for promotions, business advertising, events, real estate, construction, and marketing campaigns.</p>
<p>Made from rigid yet lightweight material, these signs are designed to deliver excellent print quality and easy installation for both indoor and outdoor use.</p>
<hr/>
<h3>Product Features</h3>
<p><strong>• High-Resolution Full-Color Printing</strong><br/>Professional printing technology that delivers vibrant colors and sharp detail.</p>
<p><strong>• Durable D-Board Material</strong><br/>Rigid, lightweight panel ideal for temporary signage and promotional campaigns.</p>
<p><strong>• Indoor &amp; Outdoor Use</strong><br/>Perfect for posts, walls, fences, events, and temporary signage.</p>
<p><strong>• Fast Production</strong><br/>Estimated production time of 3–5 business days after artwork approval.</p>
<p><strong>• Ready to Install</strong><br/>Delivered cut to final size for easy installation.</p>
<hr/>
<h3>Available Sizes</h3>
<p>• 24" x 24" – Ideal for small signs or quick promotions<br/>• 24" x 36" – Most popular size for business signage<br/>• 24" x 48" – Maximum visibility for roadside or large areas</p>
<hr/>
<h3>Common Uses</h3>
<p>✔ Real estate signs (Realtors)<br/>✔ Business promotions<br/>✔ Events and activities<br/>✔ Political campaigns<br/>✔ Construction / permits<br/>✔ Temporary advertising</p>
<hr/>
<h3>Production Time</h3>
<p>3–5 business days after final artwork approval.</p>`,
    category: "D-Boards",
    image: "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-24_at_11.52.23_AM_1.jpg",
    images: JSON.stringify([
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-24_at_11.52.23_AM_1.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-14_at_10.22.34_AM.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-14_at_10.24.09_AM.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-14_at_10.25.06_AM.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/ImpresionClaroBoards.jpg",
    ]),
    variants: JSON.stringify([
      { title: '24" x 24" / Incluir Grommets', option1: '24" x 24"', option2: "Incluir Grommets ($1.25+)", price: "12.00", compareAtPrice: null, available: true },
      { title: '24" x 24" / Standard', option1: '24" x 24"', option2: "Standard (No Grommets)", price: "12.00", compareAtPrice: null, available: true },
      { title: '24" x 36" / Incluir Grommets', option1: '24" x 36"', option2: "Incluir Grommets ($1.25+)", price: "19.00", compareAtPrice: null, available: true },
      { title: '24" x 36" / Standard', option1: '24" x 36"', option2: "Standard (No Grommets)", price: "19.00", compareAtPrice: null, available: true },
      { title: '24" x 48" / Incluir Grommets', option1: '24" x 48"', option2: "Incluir Grommets ($1.25+)", price: "24.00", compareAtPrice: null, available: true },
      { title: '24" x 48" / Standard', option1: '24" x 48"', option2: "Standard (No Grommets)", price: "24.00", compareAtPrice: null, available: true },
    ]),
    priceFrom: 12.00,
    active: true,
    order: 2,
  },
  {
    slug: "banners-full-color",
    title: "Banners Impresos Full Color - Varios Tamaños",
    description: `<p><strong>Finishing Included:</strong><br/>• Heat-sealed edges<br/>• Grommets in the corners</p>
<p>All banners include reinforced edges and corner grommets for easy installation.</p>
<hr/>
<p><strong>High-quality custom banners</strong>, ideal for businesses, events, and promotions. Printed on durable vinyl with professional finishing, ready to install.</p>
<hr/>
<p>⚠️ <strong>Important Note</strong><br/>• Production time: 5–7 business days<br/>• Installation not included<br/>• Approved artwork required</p>`,
    category: "Banners",
    image: "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-25_at_3.30.45_PM.jpg",
    images: JSON.stringify([
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-25_at_3.30.45_PM.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-24_at_12.13.57_PM_1.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/3_x_6.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/3_x_8.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-24_at_12.20.04_PM.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-24_at_12.21.19_PM_1.jpg",
    ]),
    variants: JSON.stringify([
      { title: "2'x5' / Diseño $75", option1: "2'x 5'", option2: "Diseño $75", price: "30.50", compareAtPrice: null, available: true },
      { title: "3'x6' / Diseño $75", option1: "3'x 6'", option2: "Diseño $75", price: "63.00", compareAtPrice: null, available: true },
      { title: "3'x8' / Diseño $75", option1: "3'x 8'", option2: "Diseño $75", price: "84.00", compareAtPrice: null, available: true },
      { title: "4'x8' / Diseño $75", option1: "4'x 8'", option2: "Diseño $75", price: "112.00", compareAtPrice: null, available: true },
      { title: "5'x10' / Diseño $75", option1: "5'x 10'", option2: "Diseño $75", price: "175.00", compareAtPrice: null, available: true },
    ]),
    priceFrom: 30.50,
    active: true,
    order: 3,
  },
  {
    slug: "roll-up-banner",
    title: "Roll Up Banner Full Color",
    description: `<p><strong>Retractable Banners</strong> are ideal for high-traffic areas where maximizing brand visibility is key. This vertical format delivers a professional and eye-catching presence to attract potential customers.</p>
<hr/>
<h3>Specifications</h3>
<p>• Print area: 33.5" x 79"<br/>• Additional bleed: 3" at the bottom (extended color for retractable system)<br/>• Total visible height: 79"<br/>• Structure: Aluminum retractable base<br/>• Includes: Carrying bag for easy transport<br/>• Base color: Silver</p>
<hr/>
<h3>Available Material</h3>
<p>• 13 oz banner</p>
<hr/>
<h3>Recommended Uses</h3>
<p>• Trade shows and exhibitions<br/>• Corporate events<br/>• Point-of-sale displays<br/>• Promotions and brand activations</p>
<hr/>
<h3>Summary</h3>
<p>Retractable banners are an effective solution to increase your business visibility quickly, professionally, and with a reusable format.</p>`,
    category: "Stand Banners",
    image: "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/ChatGPT_Image_Mar_25_2026_07_39_36_PM.png",
    images: JSON.stringify([
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/ChatGPT_Image_Mar_25_2026_07_39_36_PM.png",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/ChatGPT_Image_Mar_25_2026_07_43_18_PM.png",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/ChatGPT_Image_Mar_25_2026_07_51_59_PM.png",
    ]),
    variants: JSON.stringify([
      { title: '33.5" x 79" / Diseño $75', option1: '33.5" x 79"', option2: "Diseño $75", price: "99.00", compareAtPrice: null, available: true },
    ]),
    priceFrom: 99.00,
    active: true,
    order: 4,
  },
  {
    slug: "h-frame-yard-sign-stakes",
    title: "H Frame Yard Sign Stakes Metal",
    description: `<p>Dimensions: 16.5" x 7"</p>
<p>Heavy Duty 9 Gauge Yard Sign Stands for Advertising Board</p>`,
    category: "D-Boards",
    image: "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/HStakesMetal.jpg",
    images: JSON.stringify([
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/HStakesMetal.jpg",
      "https://cdn.shopify.com/s/files/1/0745/7485/6381/files/WhatsApp_Image_2026-03-24_at_11.52.23_AM_1.jpg",
    ]),
    variants: JSON.stringify([
      { title: "Default", option1: "Default Title", option2: "", price: "3.25", compareAtPrice: null, available: true },
    ]),
    priceFrom: 3.25,
    active: true,
    order: 5,
  },
];

async function main() {
  console.log("Seeding store products...");
  for (const product of products) {
    const existing = await prisma.storeProduct.findUnique({ where: { slug: product.slug } });
    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${product.title}`);
      continue;
    }
    await prisma.storeProduct.create({ data: product });
    console.log(`  ✓ Created: ${product.title}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
