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

      <div className="min-h-screen bg-white p-6 sm:p-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto flex-grow"
        >
          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#0F172A]">
              <span className="text-[#0F172A]">InvestorIQ</span> Report History
            </h1>
            <p className="text-[#334155] mt-2 text-lg">
              Access your past Property IQ Reports and download them anytime.
            </p>
            <div className="mt-4 h-1 w-24 bg-[#0F172A] mx-auto rounded-full" />
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
              className="bg-white rounded-lg shadow-sm p-10 text-center border border-slate-200"
            >
              <FileText className="h-12 w-12 mx-auto text-[#0F172A] mb-3" />
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">
                No Reports Yet
              </h3>
              <p className="text-[#334155] mb-6">
                Upload your first property documents to generate your first
                InvestorIQ Property IQ Report™.
              </p>
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
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
              className="bg-white rounded-lg shadow-sm p-8 border border-slate-200"
            >
              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr className="text-left text-[#0F172A] text-sm font-semibold bg-slate-50">
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
                      className="hover:bg-slate-50 transition border-b border-slate-100"
                    >
                      <td className="p-4 text-slate-800 font-medium">
                        {r.property_address || "N/A"}
                      </td>
                      <td className="p-4 text-[#334155] text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#0F172A]" />
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
                          className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] text-white text-xs px-3 py-1 font-semibold hover:bg-[#0d1326]"
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

        <BackButton />
      </div>
    </>
  );
}
