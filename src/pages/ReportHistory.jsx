import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { FileText, Loader2, Clock, FileDown } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

export default function ReportHistory() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("id, property_address, created_at, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  return (
    <>
      <Helmet>
        <title>Report History – InvestorIQ</title>
        <meta
          name="description"
          content="Review, manage, and download your previously generated InvestorIQ Property IQ Reports."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white via-[#F9FAFB] to-[#EAEAEA] p-6 sm:p-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto flex-grow"
        >
          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#0F172A]">
              <span className="text-[#1F8A8A]">InvestorIQ</span> Report History
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Access your past Property IQ Reports and download them anytime.
            </p>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-[#D4AF37] to-[#1F8A8A] mx-auto rounded-full" />
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 text-[#1F8A8A] animate-spin mb-4" />
              <p className="text-slate-600 text-lg">
                Fetching your report history...
              </p>
            </div>
          ) : reports.length === 0 ? (
            /* EMPTY STATE */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl p-10 text-center border border-slate-200"
            >
              <FileText className="h-12 w-12 mx-auto text-[#1F8A8A] mb-3" />
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">
                No Reports Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Upload your first property documents to generate your first
                InvestorIQ Property IQ Report™.
              </p>
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                className="bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-semibold shadow-md hover:scale-105 transition-transform"
              >
                Upload a New Deal
              </Button>
            </motion.div>
          ) : (
            /* TABLE VIEW */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200"
            >
              <table className="w-full border-collapse rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1F8A8A]/10 to-[#D4AF37]/10 text-left text-[#0F172A] text-sm font-semibold">
                    <th className="p-4 border-b border-slate-200">
                      Property Address
                    </th>
                    <th className="p-4 border-b border-slate-200">Created</th>
                    <th className="p-4 border-b border-slate-200">Status</th>
                    <th className="p-4 border-b border-slate-200 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#1F8A8A]/5 transition border-b border-slate-100"
                    >
                      <td className="p-4 text-slate-800 font-medium">
                        {r.property_address || "N/A"}
                      </td>
                      <td className="p-4 text-slate-500 text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#1F8A8A]" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            r.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : r.status === "Processing"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#D4AF37] to-[#b9972b] text-white text-xs px-3 py-1 font-semibold rounded-md hover:scale-105 transition-transform"
                          onClick={() =>
                            alert(`Download for ${r.property_address} coming soon.`)
                          }
                        >
                          <FileDown className="h-4 w-4 mr-1 inline" /> Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </motion.div>

        {/* FOOTER */}
        <footer className="py-6 border-t border-slate-200 bg-white/80 backdrop-blur-md text-center text-slate-500 text-sm mt-12">
          © 2025{" "}
          <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
        </footer>

        <BackButton />
      </div>
    </>
  );
}
