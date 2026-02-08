import { Link } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { PALETTE } from "@/lib/utils";

export default function Contact() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-10">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold" style={{ color: PALETTE.deepNavy }}>
              Contact
            </h1>
          </div>

          <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
            <p>
              For product, billing, or report-related questions, contact us at
              {" "}
              <a className="text-slate-900 underline" href="mailto:hello@investoriq.tech">
                hello@investoriq.tech
              </a>
              .
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="mailto:hello@investoriq.tech"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-opacity"
              style={{ backgroundColor: PALETTE.teal }}
            >
              Email InvestorIQ
            </a>

            <Link
              to="/privacy"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Security and privacy
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
