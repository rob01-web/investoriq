from pathlib import Path

p = Path("tests/qa/acquisition-memo-v2-document-smoke.js")
text = p.read_text(encoding="utf-8")

old = (
    'assert.match(partialAppraisalFinalHtml, /Valuation Position &amp; Reconciliation/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraisal \\/ Valuation Context/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraisal Reconciliation/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Appraised Value/i);\n'
    'assert.doesNotMatch(partialAppraisalFinalHtml, /Appraisal Stabilized NOI/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Accepted-Basis Value Indication/i);'
)
new = (
    'assert.match(partialAppraisalFinalHtml, /Valuation Position &amp; Reconciliation/i);\n'
    'assert.match(partialAppraisalFinalHtml, /Accepted-Basis Value Indication/i);\n'
    'const partialAppraisalReconciliationMatch = partialAppraisalFinalHtml.match(/<div class="subsection-block" data-iq-subsection="appraisal-reconciliation">[\\s\\S]*?<\\/div>/i);\n'
    'assert.ok(partialAppraisalReconciliationMatch, "Missing partial ELITE Appraisal Reconciliation subsection");\n'
    'assert.match(partialAppraisalReconciliationMatch[0], /Appraisal \\/ Valuation Context/i);\n'
    'assert.match(partialAppraisalReconciliationMatch[0], /Appraisal Reconciliation/i);\n'
    'assert.match(partialAppraisalReconciliationMatch[0], /Appraised Value/i);\n'
    'assert.doesNotMatch(partialAppraisalReconciliationMatch[0], /Appraisal Stabilized NOI/i);'
)

if old not in text:
    raise SystemExit("STOP: partial-appraisal migrated assertion block not found")
text = text.replace(old, new, 1)
p.write_text(text, encoding="utf-8")
print("updated: partial appraisal assertion scoped to appraisal reconciliation surface")
