// src/pdf/pdfSections.js
// Centralized builders for pdfmake content blocks used by generatePDF.js
// Branding aligned with InvestorIQ ELITE identity

/**********************
 * Brand palette
 **********************/
export const PALETTE = {
  deepNavy: "#0F172A",
  teal: "#1F8A8A",
  aqua: "#94d9d9",
  gold: "#D4AF37",
  ink: "#111827",
  midGray: "#6B7280",
  lightGray: "#e6e6e6",
  paper: "#fafafa",
};

/**********************
 * Formatting helpers
 **********************/
const isNil = (v) =>
  v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));

export const safeText = (v, fallback = "—") =>
  v === 0 || typeof v === "boolean" ? String(v) : v ? String(v) : fallback;

export const num = (v, opts = {}) => {
  if (isNil(v)) return "—";
  const { decimals = 0 } = opts;
  try {
    return Number(v).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    return String(v);
  }
};

export const currency = (v, opts = {}) => {
  if (isNil(v)) return "—";
  const { code = "USD", decimals = 0 } = opts;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(v));
  } catch {
    // Fallback if bad currency code
    const fixed = Number(v).toFixed(decimals);
    return `${code} ${Number(fixed).toLocaleString()}`;
  }
};

export const percent = (v, opts = {}) => {
  if (isNil(v)) return "—";
  const { decimals = 1 } = opts;
  return `${Number(v).toFixed(decimals)}%`;
};

export const boolMark = (v) => (v ? "✓" : "—");

/**********************
 * Table layouts
 **********************/
export const tightTableLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => PALETTE.lightGray,
  vLineColor: () => PALETTE.lightGray,
  paddingLeft: () => 6,
  paddingRight: () => 6,
  paddingTop: () => 4,
  paddingBottom: () => 4,
};

export const noBordersLayout = {
  hLineWidth: () => 0,
  vLineWidth: () => 0,
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => 2,
  paddingBottom: () => 2,
};

export const goldRule = (width = 2) => ({
  canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: width, lineColor: PALETTE.gold }],
  margin: [0, 6, 0, 10],
});

/**********************
 * Cover
 **********************/
export function buildCoverSection({
  title,
  subtitle,
  address,
  city,
  state,
  postal_code,
  date_str,
  logoUrl,
} = {}) {
  const hdr = [
    {
      text: safeText(title || "InvestorIQ Elite Property Report"),
      fontSize: 22,
      bold: true,
      color: PALETTE.deepNavy,
      margin: [0, 0, 0, 2],
    },
    {
      text: safeText(subtitle || "Institutional-Grade Analysis"),
      fontSize: 12,
      color: PALETTE.midGray,
      margin: [0, 0, 0, 12],
    },
  ];

  const addrBlock = [
    {
      text: safeText(address, "Address not provided"),
      fontSize: 14,
      bold: true,
      color: PALETTE.ink,
      margin: [0, 0, 0, 2],
    },
    {
      text: safeText([city, state, postal_code].filter(Boolean).join(", "), "—"),
      fontSize: 11,
      color: PALETTE.midGray,
    },
    {
      text: `Report Date: ${safeText(
        date_str,
        new Date().toLocaleDateString()
      )}`,
      fontSize: 10,
      color: PALETTE.midGray,
      margin: [0, 12, 0, 0],
    },
  ];

  return {
    margin: [0, 0, 0, 20],
    stack: [
      ...hdr,
      goldRule(2),
      {
        columns: [
          { width: "*", stack: addrBlock },
          logoUrl
            ? {
                width: 120,
                image: logoUrl,
                fit: [120, 120],
                alignment: "right",
              }
            : { width: 120, text: "" },
        ],
        columnGap: 12,
      },
    ],
  };
}

/**********************
 * Property Snapshot
 **********************/
export function buildPropertySnapshot(parsed = {}) {
  const {
    address,
    city,
    state,
    postal_code,
    property_type,
    year_built,
    lot_size_sqft,
    building_size_sqft,
    units,
    bedrooms,
    bathrooms,
    parking_spaces,
    zoning,
  } = parsed;

  const rows = [
    ["Address", safeText(address)],
    ["City / State / ZIP", safeText([city, state, postal_code].filter(Boolean).join(", "))],
    ["Property Type", safeText(property_type)],
    ["Year Built", num(year_built)],
    ["Building Size (sqft)", num(building_size_sqft)],
    ["Lot Size (sqft)", num(lot_size_sqft)],
    ["Units", num(units)],
    ["Bedrooms", num(bedrooms)],
    ["Bathrooms", num(bathrooms)],
    ["Parking", num(parking_spaces)],
    ["Zoning", safeText(zoning)],
  ];

  return {
    margin: [0, 0, 0, 18],
    table: {
      widths: [160, "*"],
      body: [
        [
          {
            text: "Property Snapshot",
            fontSize: 14,
            bold: true,
            color: PALETTE.deepNavy,
            colSpan: 2,
            border: [false, false, false, true],
          },
          {},
        ],
        ...rows.map(([k, v]) => [
          { text: k, bold: true, fillColor: PALETTE.paper, color: PALETTE.ink },
          { text: v, color: PALETTE.ink },
        ]),
      ],
    },
    layout: tightTableLayout,
  };
}

/**********************
 * Pricing and Economics
 **********************/
export function buildPricingSection(parsed = {}) {
  const {
    ask_price,
    arv,
    rehab_cost,
    purchase_costs,
    closing_costs,
    rent_monthly,
    other_income_monthly,
    taxes_annual,
    insurance_annual,
    hoa_monthly,
    vacancy_rate_pct,
    maintenance_pct,
    management_pct,
    capex_pct,
    target_cap_rate_pct,
    currency_code = "USD",
  } = parsed;

  const noiMonthly =
    (rent_monthly || 0) +
    (other_income_monthly || 0) -
    ((taxes_annual || 0) / 12) -
    ((insurance_annual || 0) / 12) -
    (hoa_monthly || 0) -
    ((rent_monthly || 0) * (vacancy_rate_pct || 0) / 100) -
    ((rent_monthly || 0) * (maintenance_pct || 0) / 100) -
    ((rent_monthly || 0) * (management_pct || 0) / 100) -
    ((rent_monthly || 0) * (capex_pct || 0) / 100);

  const noiAnnual = noiMonthly * 12;
  const impliedValueFromCap = target_cap_rate_pct
    ? noiAnnual / (target_cap_rate_pct / 100)
    : null;

  const left = [
    ["Asking Price", currency(ask_price, { code: currency_code, decimals: 0 })],
    ["After-Repair Value (ARV)", currency(arv, { code: currency_code, decimals: 0 })],
    ["Rehab Cost (Est.)", currency(rehab_cost, { code: currency_code, decimals: 0 })],
    ["Purchase Costs (Est.)", currency(purchase_costs, { code: currency_code, decimals: 0 })],
    ["Closing Costs (Est.)", currency(closing_costs, { code: currency_code, decimals: 0 })],
  ];

  const right = [
    ["Monthly Rent", currency(rent_monthly, { code: currency_code, decimals: 0 })],
    ["Other Income (Monthly)", currency(other_income_monthly, { code: currency_code, decimals: 0 })],
    ["Taxes (Annual)", currency(taxes_annual, { code: currency_code, decimals: 0 })],
    ["Insurance (Annual)", currency(insurance_annual, { code: currency_code, decimals: 0 })],
    ["HOA (Monthly)", currency(hoa_monthly, { code: currency_code, decimals: 0 })],
    ["Vacancy Rate", percent(vacancy_rate_pct)],
    ["Maintenance", percent(maintenance_pct)],
    ["Management", percent(management_pct)],
    ["CapEx", percent(capex_pct)],
    ["Target Cap Rate", percent(target_cap_rate_pct)],
  ];

  const summary = [
    ["Net Operating Income (Monthly)", currency(noiMonthly, { code: currency_code, decimals: 0 })],
    ["Net Operating Income (Annual)", currency(noiAnnual, { code: currency_code, decimals: 0 })],
    [
      "Implied Value at Target Cap",
      impliedValueFromCap == null
        ? "—"
        : currency(impliedValueFromCap, { code: currency_code, decimals: 0 }),
    ],
  ];

  const twoCol = (title, rows) => ({
    table: {
      widths: ["*", "*"],
      body: [
        [
          {
            text: title,
            fontSize: 12,
            bold: true,
            color: PALETTE.deepNavy,
            colSpan: 2,
          },
          {},
        ],
        ...rows.map(([k, v]) => [
          { text: k, margin: [0, 1, 0, 1], color: PALETTE.ink },
          { text: v, margin: [0, 1, 0, 1], alignment: "right", color: PALETTE.ink },
        ]),
      ],
    },
    layout: noBordersLayout,
    margin: [0, 6, 0, 6],
  });

  return {
    margin: [0, 0, 0, 18],
    stack: [
      { text: "Pricing and Economics", fontSize: 14, bold: true, color: PALETTE.deepNavy, margin: [0, 0, 0, 6] },
      goldRule(1.5),
      {
        columns: [
          { width: "50%", stack: [twoCol("Acquisition", left)] },
          { width: "50%", stack: [twoCol("Income and Assumptions", right)] },
        ],
        columnGap: 18,
      },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "Summary", fontSize: 12, bold: true, color: PALETTE.deepNavy, colSpan: 2 },
              {},
            ],
            ...summary.map(([k, v]) => [
              { text: k, color: PALETTE.ink },
              { text: v, alignment: "right", bold: true, color: PALETTE.ink },
            ]),
          ],
        },
        layout: tightTableLayout,
        margin: [0, 10, 0, 0],
      },
      {
        text: "Notes: Values are estimates and subject to buyer verification.",
        color: PALETTE.midGray,
        fontSize: 9,
        margin: [0, 6, 0, 0],
      },
    ],
  };
}

/**********************
 * Rent Roll
 **********************/
export function buildRentRollSection(parsed = {}) {
  const { rent_roll = [], currency_code = "USD" } = parsed;

  const header = [
    { text: "Unit", bold: true },
    { text: "Beds", bold: true, alignment: "right" },
    { text: "Baths", bold: true, alignment: "right" },
    { text: "SqFt", bold: true, alignment: "right" },
    { text: "Rent", bold: true, alignment: "right" },
    { text: "Lease Start", bold: true },
    { text: "Lease End", bold: true },
    { text: "Occupied", bold: true, alignment: "center" },
  ];

  const bodyRows = rent_roll.map((u) => [
    safeText(u.unit),
    { text: num(u.beds), alignment: "right" },
    { text: num(u.baths), alignment: "right" },
    { text: num(u.sqft), alignment: "right" },
    { text: currency(u.rent, { code: currency_code }), alignment: "right" },
    safeText(u.lease_start),
    safeText(u.lease_end),
    { text: boolMark(u.occupied), alignment: "center" },
  ]);

  return {
    margin: [0, 0, 0, 18],
    table: {
      headerRows: 2,
      widths: [60, 40, 45, 45, 60, 70, 70, 55],
      body: [
        [
          {
            text: "Rent Roll",
            fontSize: 14,
            bold: true,
            color: PALETTE.deepNavy,
            colSpan: 8,
            border: [false, false, false, true],
          },
          {},
          {},
          {},
          {},
          {},
          {},
          {},
        ],
        header,
        ...(bodyRows.length
          ? bodyRows
          : [
              [
                {
                  text: "No rent roll data provided.",
                  colSpan: 8,
                  alignment: "center",
                  italics: true,
                  color: PALETTE.midGray,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            ]),
      ],
    },
    layout: tightTableLayout,
  };
}

/**********************
 * Comparable Sales and Listings
 **********************/
export function buildCompsSection(parsed = {}) {
  const { comps = [], currency_code = "USD" } = parsed;

  const header = [
    { text: "#", bold: true, alignment: "center" },
    { text: "Address", bold: true },
    { text: "Miles", bold: true, alignment: "right" },
    { text: "Beds", bold: true, alignment: "right" },
    { text: "Baths", bold: true, alignment: "right" },
    { text: "SqFt", bold: true, alignment: "right" },
    { text: "Price", bold: true, alignment: "right" },
    { text: "DOM", bold: true, alignment: "right" },
    { text: "Status", bold: true, alignment: "center" },
  ];

  const bodyRows = comps.map((c, idx) => [
    { text: String(idx + 1), alignment: "center" },
    safeText(c.address),
    { text: num(c.distance_miles, { decimals: 2 }), alignment: "right" },
    { text: num(c.beds), alignment: "right" },
    { text: num(c.baths), alignment: "right" },
    { text: num(c.sqft), alignment: "right" },
    { text: currency(c.price, { code: currency_code }), alignment: "right" },
    { text: num(c.days_on_market), alignment: "right" },
    { text: safeText(c.status), alignment: "center" },
  ]);

  return {
    margin: [0, 0, 0, 18],
    table: {
      headerRows: 2,
      widths: [18, "*", 40, 35, 40, 45, 60, 30, 50],
      body: [
        [
          {
            text: "Comparable Sales and Listings",
            fontSize: 14,
            bold: true,
            color: PALETTE.deepNavy,
            colSpan: 9,
            border: [false, false, false, true],
          },
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
        ],
        header,
        ...(bodyRows.length
          ? bodyRows
          : [
              [
                {
                  text: "No comparable data provided.",
                  colSpan: 9,
                  alignment: "center",
                  italics: true,
                  color: PALETTE.midGray,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            ]),
      ],
    },
    layout: tightTableLayout,
  };
}

/**********************
 * Analyst Notes
 **********************/
export function buildNotesSection(parsed = {}) {
  const { analyst_notes } = parsed;
  return {
    margin: [0, 0, 0, 0],
    stack: [
      {
        text: "Analyst Notes",
        fontSize: 14,
        bold: true,
        color: PALETTE.deepNavy,
        margin: [0, 0, 0, 6],
      },
      analyst_notes && analyst_notes.length
        ? {
            ol: analyst_notes.map((n) => safeText(n)),
            margin: [0, 0, 0, 0],
          }
        : {
            text: "No additional notes provided.",
            color: PALETTE.midGray,
            italics: true,
          },
    ],
  };
}

/**********************
 * Aggregator
 **********************/
export function buildAllSections(parsed = {}, opts = {}) {
  const { logoUrl } = opts;
  return [
    buildCoverSection({ ...parsed, logoUrl }),
    buildPropertySnapshot(parsed),
    buildPricingSection(parsed),
    buildRentRollSection(parsed),
    buildCompsSection(parsed),
    buildNotesSection(parsed),
  ];
}
