export default function SampleReport({ sampleTitle = "Sample Report", sampleUrl = "/reports/sample.pdf" }) {
  const handleViewReport = () => {
    window.open(sampleUrl, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <h1 className="text-3xl font-semibold text-slate-800 mb-2">
        InvestorIQ {sampleTitle}
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
