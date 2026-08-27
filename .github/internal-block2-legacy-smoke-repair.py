from pathlib import Path

p = Path("tests/qa/acquisition-memo-v2-document-smoke.js")
text = p.read_text(encoding="utf-8")


def replace_once(old, new, label, required=False):
    global text
    count = text.count(old)
    if count:
        text = text.replace(old, new, 1)
        print(f"updated: {label}")
        return True
    if required:
        raise SystemExit(f"STOP: required marker missing: {label}")
    print(f"already aligned or absent: {label}")
    return False


# Current footer contract.
text = text.replace(
    "CONFIDENTIAL - INVESTORIQ TECHNOLOGIES INC\\.",
    "CONFIDENTIAL \\| INVESTORIQ TECHNOLOGIES INC\\.",
)

# Raw HTML intentionally contains <wbr> tags in long Source Register filenames.
first_marker = 'assert.match(finalHtml, /Current_Debt_Stonebridge\\.pdf/i);'
if first_marker in text and "const finalHtmlWithoutSoftWraps" not in text:
    text = text.replace(
        first_marker,
        'const finalHtmlWithoutSoftWraps = finalHtml.replace(/<wbr\\s*\\/?>/gi, "");\n'
        'assert.match(finalHtmlWithoutSoftWraps, /Current_Debt_Stonebridge\\.pdf/i);',
        1,
    )
replace_once(
    'const assumptionsRowMatch = finalHtml.match(/<tr[^>]*>[\\s\\S]{0,1200}?Stonebridge_Assumptions\\.pdf[\\s\\S]*?<\\/tr>/i);',
    'const assumptionsRowMatch = finalHtmlWithoutSoftWraps.match(/<tr[^>]*>[\\s\\S]{0,1200}?Stonebridge_Assumptions\\.pdf[\\s\\S]*?<\\/tr>/i);',
    "initial assumptions filename soft-wrap",
)
replace_once(
    'assert.match(finalHtml, /Stonebridge_Reno_Plan\\.pdf/i);',
    'assert.match(finalHtmlWithoutSoftWraps, /Stonebridge_Reno_Plan\\.pdf/i);',
    "initial renovation filename soft-wrap",
)

# Current institutional valuation chapter supersedes the legacy cap-rate section when available.
replace_once(
    'assert.match(finalHtml, /Cap-Rate Value Indication/i);',
    'assert.match(finalHtml, /Valuation &amp; Reconciliation/i);',
    "initial valuation chapter",
)

retest_marker = 'assert.match(retest6FinalHtml, /class="report-container"/i);'
if "const retest6FinalHtmlWithoutSoftWraps" not in text and retest_marker in text:
    text = text.replace(
        retest_marker,
        'const retest6FinalHtmlWithoutSoftWraps = retest6FinalHtml.replace(/<wbr\\s*\\/?>/gi, "");\n' + retest_marker,
        1,
    )

replace_once(
    'assert.match(retest6FinalHtml, /Rent Position \\/ Whole-Property Value Context/i);',
    'assert.match(retest6FinalHtml, /Valuation Position &amp; Reconciliation/i);',
    "RETEST6 valuation section",
)
replace_once(
    'assert.match(retest6FinalHtml, /Cap-Rate Value Indication/i);',
    'assert.match(retest6FinalHtml, /Accepted-Basis Value Indication/i);',
    "RETEST6 accepted-basis valuation",
)
replace_once('  "Rent Position / Whole-Property Value Context",\n', '', "remove legacy rent-position order row")
replace_once(
    '  "Cap-Rate Value Indication",\n',
    '  "Valuation Position & Reconciliation",\n',
    "current valuation order row",
)
replace_once('  "Methodology & Data Transparency",\n', '', "methodology compact hierarchy")

# Redundant legacy per-unit presentation rows; NOI/unit is already certified in the key metrics surface.
replace_once('assert.match(retest6FinalHtml, /EGI per Unit/i);\n', '', "remove redundant EGI/unit row")
replace_once('assert.match(retest6FinalHtml, /OpEx per Unit/i);\n', '', "remove redundant OpEx/unit row")
replace_once('assert.match(retest6FinalHtml, /NOI per Unit/i);\n', '', "remove duplicate NOI/unit row")

replace_once(
    'assert.match(retest6FinalHtml, /InvestorIQ does not assume or gap-fill missing data/i);\n'
    'assert.match(retest6FinalHtml, /Methodology Notes/i);\n'
    'assert.match(retest6FinalHtml, /Data Limitations &amp; Missing Inputs/i);',
    'assert.match(retest6FinalHtml, /No gap-filling/i);\n'
    'assert.match(retest6FinalHtml, /Unsupported assumptions and missing inputs remain visible rather than being inferred/i);\n'
    'assert.match(retest6FinalHtml, /Evidence-bound analysis/i);',
    "current methodology language",
)

ordering_anchor = '  lastSectionIndex = sectionIndex;\n}\n'
if "methodologyOrderIndex" not in text and ordering_anchor in text:
    text = text.replace(
        ordering_anchor,
        '  lastSectionIndex = sectionIndex;\n}\n'
        'const sourceRegisterOrderIndex = retest6FinalHtml.indexOf("Source Register &amp; Document Treatment");\n'
        'const methodologyOrderIndex = retest6FinalHtml.indexOf("Methodology &amp; Data Transparency");\n'
        'assert.ok(sourceRegisterOrderIndex >= 0 && methodologyOrderIndex > sourceRegisterOrderIndex, "Methodology & Data Transparency is out of order");\n',
        1,
    )

replace_once(
    'const sourceRegisterSectionMatch = retest6FinalHtml.match(/Source Register &amp; Document Treatment[\\s\\S]{0,8000}?<\\/section>/i);',
    'const sourceRegisterSectionMatch = retest6FinalHtmlWithoutSoftWraps.match(/Source Register &amp; Document Treatment[\\s\\S]{0,8000}?<\\/section>/i);',
    "Source Register soft-wrap normalization",
)
for old, new, label in [
    (
        'assert.match(retest6FinalHtml, /Stonebridge_Appraisal_Summary\\.pdf[\\s\\S]{0,2000}Appraisal Context/i);',
        'assert.match(retest6FinalHtmlWithoutSoftWraps, /Stonebridge_Appraisal_Summary\\.pdf[\\s\\S]{0,2000}Appraisal Context/i);',
        "appraisal filename soft-wrap",
    ),
    (
        'assert.match(retest6FinalHtml, /Stonebridge_Market_Survey\\.pdf[\\s\\S]{0,2000}Market Survey Context/i);',
        'assert.match(retest6FinalHtmlWithoutSoftWraps, /Stonebridge_Market_Survey\\.pdf[\\s\\S]{0,2000}Market Survey Context/i);',
        "market filename soft-wrap",
    ),
    (
        'assert.match(retest6FinalHtml, /Stonebridge_Phase_I_ESA\\.pdf[\\s\\S]{0,2000}Environmental Context/i);',
        'assert.match(retest6FinalHtmlWithoutSoftWraps, /Stonebridge_Phase_I_ESA\\.pdf[\\s\\S]{0,2000}Environmental Context/i);',
        "environmental filename soft-wrap",
    ),
]:
    replace_once(old, new, label)

replace_once(
    'assert.match(retest6FinalHtml, /<tr data-iq-cap-rate-row="accepted" data-iq-cap-rate="0\\.07"><td>7\\.0%<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td><td style="font-weight:600;">\\$210,938<\\/td><\\/tr>/i);',
    'assert.match(retest6FinalHtml, /Accepted Going-In Cap Rate<\\/td><td>7\\.00%<\\/td>/i);\n'
    'assert.match(retest6FinalHtml, /InvestorIQ Implied Value<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td>/i);\n'
    'assert.match(retest6FinalHtml, /Implied Value Per Unit<\\/td><td>\\$210,938<\\/td>/i);',
    "RETEST6 accepted valuation rows",
)
replace_once(
    'assert.match(retest6FinalHtml, /Value delta vs purchase price<\\/td><td style="font-weight:600;">\\$0<\\/td>/i);',
    'assert.match(retest6FinalHtml, /InvestorIQ Implied Value Less Purchase Price<\\/td><td>\\$0<\\/td>/i);',
    "RETEST6 value delta label",
)
replace_once(
    'assert.equal(/Cap-Rate Value Indication[\\s\\S]{0,700}>-<\\/td>/i.test(retest6FinalHtml), false);',
    'assert.equal(/Accepted-Basis Value Indication[\\s\\S]{0,700}>-<\\/td>/i.test(retest6FinalHtml), false);',
    "RETEST6 no placeholder valuation",
)
replace_once(
    'assert.doesNotMatch(retest6FinalHtml, /<tr[^>]*><td>[56]\\.0%<\\/td>/i);',
    'assert.doesNotMatch(retest6FinalHtml, /data-iq-valuation-sensitivity-row="scenario"/i);',
    "RETEST6 no ungoverned sensitivity rows",
)

# Replace the pre-ELITE appraisal-comparison block with current ELITE valuation/appraisal certification.
old_start = 'const governedComparisonSectionMatch = governedFinalHtml.match(/<div class="subsection-block" data-iq-subsection="valuation-appraisal-comparison">'
old_end = 'assert.doesNotMatch(governedComparisonSectionMatch[0], /Appraised value<\\/td><td>\\$13,500,000<\\/td>/i);\n'
start = text.find(old_start)
if start >= 0:
    end_start = text.find(old_end, start)
    if end_start < 0:
        raise SystemExit("STOP: governed comparison end marker not found")
    end = end_start + len(old_end)
    replacement = r'''const governedValuationSectionMatch = governedFinalHtml.match(/<section class="section" data-iq-section="eliteValuationReconciliation"[\s\S]*?<\/section>/i);
assert.ok(governedValuationSectionMatch, "Missing ELITE Valuation Position & Reconciliation section");
assert.match(governedValuationSectionMatch[0], /Valuation Position &amp; Reconciliation/i);
assert.match(governedValuationSectionMatch[0], /Accepted-Basis Value Indication/i);
assert.match(governedValuationSectionMatch[0], /Accepted T12 NOI<\/td><td>\$945,000<\/td>/i);
assert.match(governedValuationSectionMatch[0], /Accepted Going-In Cap Rate<\/td><td>7\.00%<\/td>/i);
assert.match(governedValuationSectionMatch[0], /InvestorIQ Implied Value<\/td><td style="font-weight:600;">\$13,500,000<\/td>/i);
assert.match(governedValuationSectionMatch[0], /Implied Value Per Unit<\/td><td>\$210,938<\/td>/i);
assert.match(governedValuationSectionMatch[0], /Valuation Bridge/i);
assert.match(governedValuationSectionMatch[0], /Purchase Price Reconciliation/i);
const governedAppraisalReconciliationMatch = governedFinalHtml.match(/<div class="subsection-block" data-iq-subsection="appraisal-reconciliation">[\s\S]*?<\/div>/i);
assert.ok(governedAppraisalReconciliationMatch, "Missing ELITE Appraisal Reconciliation subsection");
assert.match(governedAppraisalReconciliationMatch[0], /Appraisal \/ Valuation Context/i);
assert.match(governedAppraisalReconciliationMatch[0], /Appraisal Reconciliation/i);
assert.match(governedAppraisalReconciliationMatch[0], /Appraised Value<\/td><td>\$12,000,000<\/td>/i);
assert.match(governedAppraisalReconciliationMatch[0], /Appraisal Stabilized NOI<\/td><td>\$622,000<\/td>/i);
assert.match(governedAppraisalReconciliationMatch[0], /Appraisal Stabilized Cap Rate<\/td><td>6\.25%<\/td>/i);
assert.match(governedAppraisalReconciliationMatch[0], /Appraised Value Less InvestorIQ Implied Value<\/td><td>\(\$1,500,000\)<\/td>/i);
assert.match(governedAppraisalReconciliationMatch[0], /Appraised Value Less Purchase Price<\/td><td>\(\$1,500,000\)<\/td>/i);
assert.doesNotMatch(governedAppraisalReconciliationMatch[0], /correct|approved|recommended|final|\bBUY\b|\bSELL\b|\bHOLD\b|overvalued|undervalued|attractive|aggressive|conservative/i);
assert.doesNotMatch(governedFinalHtml, /data-iq-subsection="valuation-appraisal-comparison"/i);
'''
    text = text[:start] + replacement + text[end:]
    print("updated: governed ELITE appraisal reconciliation")

replace_once(
    'assert.match(propertyTaxPresentHtml, /Cap-Rate Value Indication/i);',
    'assert.match(propertyTaxPresentHtml, /Accepted-Basis Value Indication/i);',
    "property-tax current valuation surface",
)
replace_once(
    'if (expectBridge) assert.match(omissionHtml, /Revenue \\/ Expense \\/ NOI Bridge/i, `Missing NOI bridge for ${label}`);\n'
    '  assert.match(omissionHtml, /Cap-Rate Value Indication/i, `Missing cap-rate section for ${label}`);',
    'if (expectBridge) assert.match(omissionHtml, /Revenue \\/ Expense \\/ NOI Bridge/i, `Missing NOI bridge for ${label}`);\n'
    '  assert.match(omissionHtml, /Accepted-Basis Value Indication/i, `Missing accepted-basis valuation section for ${label}`);',
    "property-tax omission current valuation surface",
)

replace_once(
    'assert.match(partialAppraisalFinalHtml, /Appraisal \\/ Valuation Context/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraised Value/i);\n'
    'assert.doesNotMatch(partialAppraisalFinalHtml, /Valuation \\/ Appraisal Comparison/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Cap-Rate Value Indication/i);',
    'assert.match(partialAppraisalFinalHtml, /Valuation Position &amp; Reconciliation/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraisal \\/ Valuation Context/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraisal Reconciliation/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraised Value/i);\n'
    'assert.doesNotMatch(partialAppraisalFinalHtml, /Appraisal Stabilized NOI/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Accepted-Basis Value Indication/i);',
    "partial appraisal ELITE reconciliation",
)
replace_once(
    'assert.doesNotMatch(unsupportedAppraisalFinalHtml, /Valuation \\/ Appraisal Comparison/i);',
    'assert.doesNotMatch(unsupportedAppraisalFinalHtml, /data-iq-subsection="appraisal-reconciliation"/i);',
    "unsupported appraisal collapse",
)

structured_old = (
    'assert.match(structuredFinalHtml, /<tr data-iq-cap-rate-row="accepted" data-iq-cap-rate="0\\.07"><td>7\\.0%<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td><td style="font-weight:600;">\\$210,938<\\/td><\\/tr>/i);\n'
    'assert.doesNotMatch(structuredFinalHtml, /<tr[^>]*><td>[56]\\.0%<\\/td>/i);\n'
    'assert.equal(/Cap-Rate Value Indication[\\s\\S]{0,700}>-<\\/td>/i.test(structuredFinalHtml), false);'
)
structured_new = (
    'assert.match(structuredFinalHtml, /Accepted Going-In Cap Rate<\\/td><td>7\\.00%<\\/td>/i);\n'
    'assert.match(structuredFinalHtml, /InvestorIQ Implied Value<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td>/i);\n'
    'assert.match(structuredFinalHtml, /Implied Value Per Unit<\\/td><td>\\$210,938<\\/td>/i);\n'
    'assert.doesNotMatch(structuredFinalHtml, /data-iq-valuation-sensitivity-row="scenario"/i);\n'
    'assert.equal(/Accepted-Basis Value Indication[\\s\\S]{0,700}>-<\\/td>/i.test(structuredFinalHtml), false);'
)
replace_once(structured_old, structured_new, "structured accepted-basis valuation")

cap_old = (
    'assert.match(capRateSevenFinalHtml, /Implied value at going-in cap rate<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td>/i);\n'
    'assert.match(capRateSevenFinalHtml, /<tr data-iq-cap-rate-row="accepted" data-iq-cap-rate="0\\.07"><td>7\\.0%<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td><td style="font-weight:600;">\\$210,938<\\/td><\\/tr>/i);\n'
    'assert.doesNotMatch(capRateSevenFinalHtml, /<tr[^>]*><td>[56]\\.0%<\\/td>/i);\n'
    'assert.match(capRateSevenFinalHtml, /Value delta vs purchase price<\\/td><td style="font-weight:600;">\\$0<\\/td>/i);'
)
cap_new = (
    'assert.match(capRateSevenFinalHtml, /Accepted Going-In Cap Rate<\\/td><td>7\\.00%<\\/td>/i);\n'
    'assert.match(capRateSevenFinalHtml, /InvestorIQ Implied Value<\\/td><td style="font-weight:600;">\\$13,500,000<\\/td>/i);\n'
    'assert.match(capRateSevenFinalHtml, /Implied Value Per Unit<\\/td><td>\\$210,938<\\/td>/i);\n'
    'assert.doesNotMatch(capRateSevenFinalHtml, /data-iq-valuation-sensitivity-row="scenario"/i);\n'
    'assert.match(capRateSevenFinalHtml, /InvestorIQ Implied Value Less Purchase Price<\\/td><td>\\$0<\\/td>/i);'
)
replace_once(cap_old, cap_new, "7-percent normalization accepted-basis valuation")

p.write_text(text, encoding="utf-8")
print("temporary legacy smoke migration complete")
