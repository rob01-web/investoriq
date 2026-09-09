from pathlib import Path

FILES = {
    'pricing': Path('src/pages/Pricing.jsx'),
    'dashboard': Path('src/pages/Dashboard.jsx'),
    'login': Path('src/pages/Login.jsx'),
    'signup': Path('src/pages/SignUp.jsx'),
    'test': Path('tests/qa/launch-readiness-customer-journey-smoke.js'),
}


def replace_exact(path, old, new, expected=1):
    text = path.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} occurrence(s), found {count}: {old!r}')
    path.write_text(text.replace(old, new), encoding='utf-8')


pricing = FILES['pricing']
replace_exact(
    pricing,
    "    text-transform: none;\n  }\n\n  .pricing-card-header {",
    "    text-transform: none;\n    min-height: 32px;\n  }\n\n  .pricing-card-header {",
)
replace_exact(
    pricing,
    "    .pricing-card-header,\n    .pricing-card-price,\n    .pricing-card-description {",
    "    .pricing-note,\n    .pricing-card-header,\n    .pricing-card-price,\n    .pricing-card-description {",
)
replace_exact(pricing, "pricingNote: 'Founder’s Pricing · Early Member Access'", "pricingNote: 'One-time purchase | No subscription'", expected=2)
replace_exact(pricing, "eyebrow:     'Three-Report Bundle'", "eyebrow:     'Screening + Underwriting'")
replace_exact(
    pricing,
    "description: 'Screen two opportunities and take one finalist through full Underwriting for one fixed price.'",
    "description: 'Two Screening Reports plus one Underwriting Report at a lower combined price.'",
)
replace_exact(pricing, "pricingNote: 'Three report credits in one purchase'", "pricingNote: 'One-time purchase | 3 report credits'")
replace_exact(pricing, "'2 Screening report credits'", "'2 Screening Report credits'")
replace_exact(pricing, "'1 Underwriting report credit'", "'1 Underwriting Report credit'", expected=2)
replace_exact(pricing, "'Use the Underwriting credit on the deal that advances'", "'Use the credits on the opportunities you choose'")
replace_exact(pricing, "'One purchase, three report credits'", "'Lower price than purchasing the same three reports separately'")
replace_exact(
    pricing,
    'Document-driven underwriting for real estate investors.',
    'Document-driven real estate analysis for investment decisions.',
)
replace_exact(
    pricing,
    'InvestorIQ analyzes only what your uploaded evidence can support. Missing or conflicting inputs are disclosed, and unsupported sections are limited or omitted rather than invented. If no usable core source can be verified, no report is published and the report credit is restored.',
    'InvestorIQ analyzes only what your uploaded evidence can support. Missing or conflicting inputs are disclosed, and unsupported sections are limited or omitted rather than invented. If the required document package is incomplete or cannot be verified, generation does not begin and no report credit is consumed.',
)


dashboard = FILES['dashboard']
replace_exact(
    dashboard,
    'Upload your documents to generate an institutional underwriting report.',
    'Upload property documents to generate a Screening or Underwriting Report.',
)
replace_exact(dashboard, 'T12 + Rent Roll only', 'Requires T12 + Rent Roll. No additional documents.')
replace_exact(dashboard, 'For initial investment review.', 'Built for fast acquisition screening and early deal triage.')
replace_exact(dashboard, 'No charts. No projections.', 'Source gaps and inconsistencies are disclosed.')
replace_exact(dashboard, 'T12 + Rent Roll + at least 1 supporting document', 'Requires T12 + Rent Roll + at least 1 supporting document.')
replace_exact(dashboard, 'Full institutional underwriting report.', 'Built for deeper investment review, financing analysis, and downside testing.')
replace_exact(dashboard, 'Investment committee-ready depth.', 'Unsupported analysis is limited or omitted rather than invented.')
replace_exact(dashboard, '>\n                Bundle Purchase\n              </button>', '>\n                Three-Report Bundle\n              </button>')
replace_exact(dashboard, 'Launch bundle selected', 'Three-report bundle selected')


login = FILES['login']
replace_exact(
    login,
    'Sign in to access your InvestorIQ dashboard and generate institutional underwriting reports.',
    'Sign in to access your InvestorIQ dashboard and generate Screening and Underwriting Reports.',
)

signup = FILES['signup']
replace_exact(
    signup,
    'Create your InvestorIQ account to generate institutional underwriting reports from your property documents.',
    'Create your InvestorIQ account to generate Screening and Underwriting Reports from your property documents.',
)


test = FILES['test']
replace_exact(test, "assert.match(pricing, /Three-Report Bundle/);", "assert.match(pricing, /Screening \\+ Underwriting/);")
replace_exact(
    test,
    "assert.match(pricing, /Screen two opportunities and take one finalist through full Underwriting/i);",
    "assert.match(pricing, /Two Screening Reports plus one Underwriting Report at a lower combined price/i);",
)
replace_exact(
    test,
    "assert.match(pricing, /\\.pricing-card-header\\s*\\{/);",
    "assert.match(pricing, /\\.pricing-note\\s*\\{[\\s\\S]*min-height:\\s*32px/);\nassert.match(pricing, /\\.pricing-card-header\\s*\\{/);",
)
replace_exact(
    test,
    "assert.match(dashboard, /T12 \\+ Rent Roll only/);",
    "assert.match(dashboard, /Requires T12 \\+ Rent Roll\\. No additional documents\\./);",
)
replace_exact(
    test,
    "assert.match(dashboard, /T12 \\+ Rent Roll \\+ at least 1 supporting document/);",
    "assert.match(dashboard, /Requires T12 \\+ Rent Roll \\+ at least 1 supporting document\\./);",
)
replace_exact(
    test,
    "// Pricing -> login/signup -> pricing continuity must be wired on both auth surfaces.",
    "// Pricing and adjacent account surfaces must present both launch report products.\nassert.match(pricing, /Document-driven real estate analysis for investment decisions\\./);\nassert.match(pricing, /required document package is incomplete or cannot be verified/i);\nassert.equal(/no usable core source can be verified/i.test(pricing), false);\nassert.match(dashboard, /Upload property documents to generate a Screening or Underwriting Report\\./);\nassert.match(dashboard, /Three-report bundle selected/);\nassert.match(login, /generate Screening and Underwriting Reports/);\nassert.match(signup, /generate Screening and Underwriting Reports/);\n\n// Pricing -> login/signup -> pricing continuity must be wired on both auth surfaces.",
)
replace_exact(
    test,
    "  'Screen two opportunities and take one finalist through full Underwriting for one fixed price.',",
    "  'Two Screening Reports plus one Underwriting Report at a lower combined price.',",
)

print('customer journey pricing polish applied')
