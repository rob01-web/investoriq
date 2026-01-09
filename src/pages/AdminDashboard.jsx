import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { FileText, Loader2, Users, BarChart3, RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    activeReports: 0,
  });
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const { count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        const { count: reportCount, data: reports } = await supabase
          .from("properties")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(5);
        const activeCount = (reports || []).filter((r) => r.status === "Processing").length;

        setStats({
          totalUsers: userCount || 0,
          totalReports: reportCount || 0,
          activeReports: activeCount,
        });
        setRecentReports(reports || []);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - InvestorIQ</title>
        <meta
          name="description"
          content="Administrative overview of user activity, report performance, and platform usage for InvestorIQ."
        />
      </Helmet>

      <div className="min-h-screen bg-white p-8">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#0F172A] mb-2">
              Admin <span className="text-[#1F8A8A]">Control Panel</span>
            </h1>
            <p className="text-[#334155] text-lg font-medium">
              Monitor InvestorIQ usage, reports, and user activity in real time.
            </p>
            <div className="mt-4 h-1 w-24 bg-[#0F172A] mx-auto rounded-full" />
          </div>

          {/* STATS GRID */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin h-10 w-10 text-[#1F8A8A]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 text-center"
                >
                  <Users className="h-10 w-10 text-[#1F8A8A] mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-[#0F172A] mb-1">Total Users</h3>
                  <p className="text-4xl font-extrabold text-[#0F172A]">
                    {stats.totalUsers}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 text-center"
                >
                  <FileText className="h-10 w-10 text-[#1F8A8A] mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-[#0F172A] mb-1">Total Reports</h3>
                  <p className="text-4xl font-extrabold text-[#0F172A]">
                    {stats.totalReports}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 text-center"
                >
                  <BarChart3 className="h-10 w-10 text-[#1F8A8A] mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-[#0F172A] mb-1">Active Reports</h3>
                  <p className="text-4xl font-extrabold text-[#0F172A]">
                    {stats.activeReports}
                  </p>
                </motion.div>
              </div>

              {/* RECENT REPORTS */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-lg shadow-sm p-8 border border-slate-200"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    Recent Property Reports
                  </h2>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 text-[#1F8A8A] font-semibold hover:underline"
                  >
                    <RefreshCcw className="h-4 w-4" /> Refresh
                  </button>
                </div>

                {recentReports.length === 0 ? (
                  <p className="text-[#334155] text-center py-8">
                    No recent reports available.
                  </p>
                ) : (
                  <table className="w-full border-collapse rounded-xl overflow-hidden">
                    <thead>
                      <tr className="text-left text-[#0F172A] text-sm font-semibold bg-slate-50">
                        <th className="p-4 border-b border-slate-200">Property</th>
                        <th className="p-4 border-b border-slate-200">User</th>
                        <th className="p-4 border-b border-slate-200">Created</th>
                        <th className="p-4 border-b border-slate-200">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((r, i) => (
                        <tr
                          key={r.id || i}
                          className="hover:bg-[#1F8A8A]/5 transition border-b border-slate-100"
                        >
                          <td className="p-4 text-[#0F172A] font-semibold">
                            {r.property_address || "N/A"}
                          </td>
                          <td className="p-4 text-[#334155] text-sm font-medium">
                            {r.user_email || "Unknown"}
                          </td>
                          <td className="p-4 text-[#334155] text-sm font-medium">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            </>
          )}
        </motion.div>

        {/* FOOTER */}
        <footer className="py-6 border-t border-slate-200 bg-white/80 backdrop-blur-md text-center text-[#334155] text-sm mt-12">
          (c) 2025 <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
        </footer>
      </div>
    </>
  );
}
