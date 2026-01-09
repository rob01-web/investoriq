import { Link } from "react-router-dom";
import InvestorIQHeader from "@/components/InvestorIQHeader";

export default function MainLayout({ children }) {
  return (
    <>
      <InvestorIQHeader />

      <main className="min-h-screen">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-600">
          <div className="mb-4 sm:mb-0">
            © {new Date().getFullYear()} InvestorIQ. All rights reserved.
          </div>

          <div className="flex space-x-6">
            <Link
              to="/terms"
              className="hover:text-slate-900 transition-colors"
            >
              Terms of Use
            </Link>

            <Link
              to="/privacy"
              className="hover:text-slate-900 transition-colors"
            >
              Privacy Policy
            </Link>

            <Link
              to="/disclosures"
              className="hover:text-slate-900 transition-colors"
            >
              Analysis Disclosures
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
