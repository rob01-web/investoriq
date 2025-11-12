import React from "react";
import { generatePDF } from "../lib/generatePDF";

export default function SampleReport() {
  // Harborview Drive demo data
  const sample = {
    reportTitle: "InvestorIQ Sample Report",
    subtitle: "Institutional-Grade Intelligence for Real Estate Investors",
    watermark: "Sample Report - InvestorIQ.ai",
    property: {
      address: "123 Harborview Drive, Tampa, FL 33602",
      type: "12-Unit Multifamily",
      askingPrice: 2150000,
      arv: 2550000,
      noi: 196000,
      yearBuilt: 1988,
      lotSizeSqFt: 14300,
      buildingSqFt: 9100,
      occupancy: 0.95,
      marketCapRate: 0.06,
      taxesAnnual: 26500,
      insuranceAnnual: 18000,
      maintenanceAnnual: 22000,
      utilitiesAnnual: 14500,
    },
    cashflow: [
      { label: "Debt Service", value: 120000 },
      { label: "Reserves", value: 20000 },
      { label: "CapEx", value: 10000 },
      { label: "Net Cash Flow", value: 46000 },
    ],
    rentRoll: [
      { unit: "101", beds: 1, baths: 1, sqft: 700, current: 1650, market: 1750, status: "Occupied" },
      { unit: "102", beds: 1, baths: 1, sqft: 705, current: 1650, market: 1750, status: "Occupied" },
      { unit: "103", beds: 1, baths: 1, sqft: 710, current: 1650, market: 1750, status: "Occupied" },
      { unit: "104", beds: 1, baths: 1, sqft: 715, current: 1650, market: 1750, status: "Occupied" },
      { unit: "201", beds: 2, baths: 1, sqft: 880, current: 1950, market: 2050, status: "Occupied" },
      { unit: "202", beds: 2, baths: 1, sqft: 882, current: 1950, market: 2050, status: "Occupied" },
      { unit: "203", beds: 2, baths: 1, sqft: 885, current: 1950, market: 2050, status: "Occupied" },
      { unit: "204", beds: 2, baths: 1, sqft: 890, current: 1950, market: 2050, status: "Occupied" },
      { unit: "301", beds: 2, baths: 2, sqft: 940, current: 2150, market: 2250, status: "Occupied" },
      { unit: "302", beds: 2, baths: 2, sqft: 942, current: 2150, market: 2250, status: "Occupied" },
      { unit: "303", beds: 2, baths: 2, sqft: 945, current: 2150, market: 2250, status: "Occupied" },
      { unit: "304", beds: 2, baths: 2, sqft: 950, current: 2150, market: 2250, status: "Occupied" },
    ],
    compsHeat: {
      columns: ["Price Per Door", "Distance", "Renovation Level", "Rent Delta", "Lot Premium"],
      rows: [
        { name: "Comp A", values: [0.7, 0.9, 0.4, 0.65, 0.5] },
        { name: "Comp B", values: [0.55, 0.75, 0.6, 0.55, 0.45] },
        { name: "Comp C", values: [0.85, 0.6, 0.55, 0.8, 0.65] },
        { name: "Comp D", values: [0.4, 0.82, 0.35, 0.5, 0.3] },
        { name: "Comp E", values: [0.63, 0.7, 0.45, 0.62, 0.48] },
      ],
    },
  };

  const handleViewReport = async () => {
    await generatePDF(sample, { preview: true }); // open in new tab (unblocked)
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <h1 className="text-3xl font-semibold text-slate-800 mb-2">
        InvestorIQ Sample Report
      </h1>
      <p className="text-slate-600 mb-6 max-w-md">
        View the flagship Harborview Drive analysis in a new tab.
        You can download or print directly from the PDF viewer.
      </p>
      <button
        onClick={handleViewReport}
        className="px-6 py-3 bg-black text-white rounded-xl hover:opacity-90 transition"
      >
        View Sample Report
      </button>
    </div>
  );
}
