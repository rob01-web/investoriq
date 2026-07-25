# AGENTS.md

Project-specific doctrine for this repo lives in:

- [InvestorIQ Product Doctrine](docs/INVESTORIQ_PRODUCT_DOCTRINE.md)
- [Premium Acquisition Underwriting V1 Doctrine](docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md)

The product doctrine controls all InvestorIQ work. The premium doctrine additionally controls every Underwriting Report expansion, calculation, model, renderer, certification, and rollout change.

All work on InvestorIQ must remain:

- document-driven only
- fail-closed behavior
- deterministic math
- institutional tone
- no hype
- no BUY/SELL language
- no fabricated narrative
- no unnecessary duplication between Screening and Underwriting

Premium Underwriting work must also preserve:

- the existing Source Truth, Delivery Gate, worker, publication, billing, credit, remedy, and Screening spine
- a consume-only canonical input contract
- a default-off feature flag and immutable job-level report-surface version before external activation
- no legacy underwriting resurrection
- no fixed page-count target or content padding
- independent premium certification with no silent downgrade for an externally promised premium report
