import fs from "node:fs";
const d = fs.readFileSync(new URL("../assets/mutual-flag-96.webp", import.meta.url)).toString("base64");
fs.writeFileSync(
  new URL("../src/logo-data.ts", import.meta.url),
  `// Generated from assets/mutual-flag-96.webp. Regenerate with \`node scripts/embed-logo.mjs\`.\nexport const MUTUAL_FLAG_DATA_URI =\n  "data:image/webp;base64,${d}";\nexport const MUTUAL_FLAG_RATIO = 96 / 62;\n`,
);
