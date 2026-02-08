import { Link } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { PALETTE } from "@/lib/utils";

export default function About() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-10">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold" style={{ color: PALETTE.deepNavy }}>
              About InvestorIQ
            </h1>
          </div>

          <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                What InvestorIQ does
              </h2>
              <p>
                InvestorIQ produces institutional-format underwriting reports from the documents you provide.
                Outputs are document-based and deterministic. Missing inputs are displayed as DATA NOT AVAILABLE.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Method and controls
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload</li>
                <li>Parse</li>
                <li>Extract</li>
                <li>Validate</li>
                <li>Underwrite</li>
                <li>Score</li>
                <li>Render</li>
                <li>Publish</li>
                <li>Notify</li>
              </ul>
              <p className="mt-3">Each stage is logged and fail-closed.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                What InvestorIQ is not
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Not investment advice</li>
                <li>Not an appraisal</li>
                <li>No assumptions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Contact</h2>
              <p>
                <Link className="text-slate-900 underline" to="/contact">
                  Contact InvestorIQ
                </Link>
                {" "}
                or email{" "}
                <a className="text-slate-900 underline" href="mailto:hello@investoriq.tech">
                  hello@investoriq.tech
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
