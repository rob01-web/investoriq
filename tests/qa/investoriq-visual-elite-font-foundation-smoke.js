import assert from "node:assert/strict";
import { INVESTORIQ_PUBLICATION_PARITY_CSS } from "../../api/_lib/investoriq-publication-parity-css.js";

const css = String(INVESTORIQ_PUBLICATION_PARITY_CSS || "");

const requiredFaces = [
  ["InvestorIQ Cormorant Garamond", 400, "6d210fd3550b7358ca62d6ba3e354ec1ec940813", "CormorantGaramond-Regular.otf"],
  ["InvestorIQ Cormorant Garamond", 500, "6d210fd3550b7358ca62d6ba3e354ec1ec940813", "CormorantGaramond-Medium.otf"],
  ["InvestorIQ Cormorant Garamond", 600, "6d210fd3550b7358ca62d6ba3e354ec1ec940813", "CormorantGaramond-SemiBold.otf"],
  ["InvestorIQ Cormorant Garamond", 700, "6d210fd3550b7358ca62d6ba3e354ec1ec940813", "CormorantGaramond-Bold.otf"],
  ["InvestorIQ DM Sans", 400, "4412393b7d2de9fe7a92064c2dce9b5af5d7fd26", "DMSans-Regular.otf"],
  ["InvestorIQ DM Sans", 500, "4412393b7d2de9fe7a92064c2dce9b5af5d7fd26", "DMSans-Medium.otf"],
  ["InvestorIQ DM Sans", 700, "4412393b7d2de9fe7a92064c2dce9b5af5d7fd26", "DMSans-Bold.otf"],
  ["InvestorIQ DM Mono", 400, "57fadabfb200a77de2812540026c249dc3013077", "DMMono-Regular.ttf"],
  ["InvestorIQ DM Mono", 500, "57fadabfb200a77de2812540026c249dc3013077", "DMMono-Medium.ttf"],
];

for (const [family, weight, commit, filename] of requiredFaces) {
  assert.ok(css.includes(`font-family:'${family}'`), `missing approved family ${family}`);
  assert.ok(css.includes(`font-weight:${weight}`), `missing approved weight ${family} ${weight}`);
  assert.ok(css.includes(commit), `font source is not pinned to ${commit}`);
  assert.ok(css.includes(filename), `missing approved font file ${filename}`);
}

assert.ok(css.includes("--font-display:'InvestorIQ Cormorant Garamond'"));
assert.ok(css.includes("--font-body:'InvestorIQ DM Sans'"));
assert.ok(css.includes("--font-mono:'InvestorIQ DM Mono'"));
assert.ok(!css.includes("fonts.googleapis.com"));
assert.ok(!css.includes("Study Sans"));
assert.ok(!css.includes("Study Serif"));
assert.ok(!css.includes("Nimbus"));
assert.ok(!css.includes("P052"));
assert.ok(!css.includes("Noto Sans"));
assert.ok(!css.includes("DejaVu"));

console.log("InvestorIQ Visual ELITE font foundation smoke: PASS");
