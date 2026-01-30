import React from "react";

const AnalysisScopePreview = ({
  hasRentRoll,
  hasT12,
  hasPurchase,
  hasCapex,
  hasDebt,
  hasMarket,
  rentRollCoverage = null,
}) => {
  const operatingIncluded = Boolean(hasRentRoll && hasT12);
  const dealIncluded = Boolean(operatingIncluded && hasPurchase && hasCapex && hasDebt);
  const icIncluded = Boolean(dealIncluded && hasMarket);

  const statusBadge = (included) =>
    included ? (
      <span className="text-xs font-semibold text-[#1F8A8A] bg-[#1F8A8A]/10 border border-[#1F8A8A] rounded-full px-2 py-0.5">
        INCLUDED
      </span>
    ) : (
      <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
        NOT INCLUDED
      </span>
    );

  const hasProvidedUnits =
    rentRollCoverage && Number.isFinite(rentRollCoverage.provided);
  const hasTotalUnits =
    rentRollCoverage && Number.isFinite(rentRollCoverage.total);
  const hasPercent =
    rentRollCoverage && Number.isFinite(rentRollCoverage.percent);
  const showCoverageWarning = hasPercent && rentRollCoverage.percent < 70;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Analysis Scope Preview
          </h3>
          <p className="text-sm text-slate-600">
            Summary of what will be included based on the documents provided.
          </p>
        </div>
      </div>

      {hasProvidedUnits && (
        <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {hasPercent && hasTotalUnits ? (
            <>
              Rent Roll Coverage: {rentRollCoverage.provided} / {rentRollCoverage.total}{' '}
              units ({Math.round(rentRollCoverage.percent)}%).
              {showCoverageWarning ? ' Analysis reflects only the units provided.' : ''}
            </>
          ) : (
            <>
              Rent Roll Units Provided: {rentRollCoverage.provided}. Total unit count not
              provided in uploaded documents.
            </>
          )}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">
              First-Look Operating Snapshot
            </h4>
            {statusBadge(operatingIncluded)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Requires: Rent Roll + T12/Operating Statement
          </p>
          <ul className="mt-3 text-sm text-slate-700 list-disc list-inside space-y-1">
            <li>Unit count, occupancy, and rent roll summary</li>
            <li>Trailing 12 income and expense snapshot</li>
            <li>Document source summary</li>
          </ul>
        </div>

        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">
              Deal Underwriting
            </h4>
            {statusBadge(dealIncluded)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Requires: Operating Snapshot + Purchase, Capex, Debt
          </p>
          <ul className="mt-3 text-sm text-slate-700 list-disc list-inside space-y-1">
            <li>Underwriting inputs for price, capex, and debt</li>
            <li>Base-case return summary</li>
            <li>Scenario highlights from provided inputs</li>
          </ul>
        </div>

        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">
              IC-Ready Investment Memo
            </h4>
            {statusBadge(icIncluded)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Requires: Deal Underwriting + Market Data
          </p>
          <ul className="mt-3 text-sm text-slate-700 list-disc list-inside space-y-1">
            <li>Market positioning and location summary</li>
            <li>Risk and sensitivity highlights</li>
            <li>Institutional report formatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisScopePreview;
