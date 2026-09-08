from pathlib import Path

product = Path('docs/INVESTORIQ_PRODUCT_DOCTRINE.md')
product_text = product.read_text(encoding='utf-8-sig')
product_anchor = '# InvestorIQ Product Doctrine\n'
product_marker = '## September 8, 2026 owner admission clarification - CURRENT AUTHORITY'
product_block = '''

## September 8, 2026 owner admission clarification - CURRENT AUTHORITY

This clarification is current owner authority for customer intake and controls wherever older doctrine prose, plans, migrations, tests, or historical notes conflict. Historical material below remains preserved as history and must not be rewritten to erase earlier states.

- **Screening admission:** both a usable T12 / operating statement and a usable Rent Roll are required before generation may begin. Screening accepts only those two core document categories. Supporting or additional due-diligence documents are not admitted for Screening.
- **Underwriting admission:** both a usable T12 / operating statement and a usable Rent Roll are required, plus at least one additional readable supporting due-diligence document, before generation may begin.
- **Admission is separate from downstream survivability:** `dual_source_core`, `t12_minimum_core`, `rent_roll_minimum_core`, and `insufficient_core` are downstream source-truth / publication-survivability states after a job has already been validly admitted. They do not reduce or replace the customer upload requirements above.
- A downstream survivor state may qualify, collapse, omit, or otherwise govern dependent analysis after admission. It does not retroactively make a one-core-document customer submission valid at intake.
'''
if product_marker in product_text:
    raise SystemExit('Product doctrine clarification already present')
if product_text.count(product_anchor) != 1:
    raise SystemExit('Product doctrine title anchor mismatch')
product.write_text(product_text.replace(product_anchor, product_anchor + product_block, 1), encoding='utf-8')

architecture = Path('docs/PRODUCTION_PIPELINE_ARCHITECTURE.md')
architecture_text = architecture.read_text(encoding='utf-8-sig')
architecture_anchor = '**Date:** 2026-08-18\n'
architecture_marker = '## September 8, 2026 admission authority clarification'
architecture_block = '''

## September 8, 2026 admission authority clarification

Customer admission is strict and is separate from downstream source-survivor modes:

- **Screening:** both a usable T12 / operating statement and a usable Rent Roll are required. Screening admits no supporting or additional due-diligence documents.
- **Underwriting:** both a usable T12 / operating statement and a usable Rent Roll are required, plus at least one additional readable supporting due-diligence document.
- `t12_minimum_core` and `rent_roll_minimum_core` remain valid only as downstream source-truth / publication-survivability states after valid admission. They do not authorize customer intake with one core document.

This clarification controls the current admission boundary wherever older architecture notes, migrations, or tests conflict.
'''
if architecture_marker in architecture_text:
    raise SystemExit('Architecture clarification already present')
if architecture_text.count(architecture_anchor) != 1:
    raise SystemExit('Architecture date anchor mismatch')
architecture.write_text(architecture_text.replace(architecture_anchor, architecture_anchor + architecture_block, 1), encoding='utf-8')
