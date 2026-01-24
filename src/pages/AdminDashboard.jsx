import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { FileText, Loader2, Users, BarChart3, RefreshCcw, Shield, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";

  export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    activeReports: 0,
  });
  const [jobSummary, setJobSummary] = useState({
    queued: 0,
    inProgress: 0,
    published: 0,
    failed: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState(null);

  // Admin Operations (manual queue runner)
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const runQueueNow = async () => {
    
    setRunLoading(true);
    setRunResult(null);

    try {
            const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token || "";

      const res = await fetch("/api/admin-run-worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRunResult({
          ok: false,
          message: data?.error || "Admin run failed.",
          details: data?.details || null,
        });
        return;
      }

      setRunResult({
        ok: true,
        message: `Queue processed. Jobs advanced: ${data?.processed ?? 0}.`,
        transitions: Array.isArray(data?.transitions) ? data.transitions : [],
      });
    } catch (err) {
      setRunResult({
        ok: false,
        message: "Admin run failed due to a network or server error.",
      });
    } finally {
      setRunLoading(false);
    }
  };

  const fetchQueueMetrics = async () => {
    setQueueLoading(true);
    setQueueError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token || "";
      const res = await fetch("/api/admin/queue-metrics", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load queue metrics.");
      }

      setQueueMetrics(data);
    } catch (err) {
      setQueueError(err?.message || "Failed to load queue metrics.");
    } finally {
      setQueueLoading(false);
    }
  };

    useEffect(() => {
        const fetchAdminData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

                const adminEmail = "hello@investoriq.tech";
        const userEmail = (user?.email || "").toLowerCase().trim();
        setIsAdmin(userEmail === adminEmail);

        const { count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        const { count: reportCount, data: reports } = await supabase
          .from("properties")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(5);
        const activeCount = (reports || []).filter((r) => r.status === "Processing").length;

        const { count: queuedCount } = await supabase
          .from("analysis_jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "queued");

        const { count: inProgressCount } = await supabase
          .from("analysis_jobs")
          .select("*", { count: "exact", head: true })
          .in("status", [
            "validating_inputs",
            "extracting",
            "underwriting",
            "scoring",
            "rendering",
            "pdf_generating",
            "publishing",
          ]);

        const { count: publishedCount } = await supabase
          .from("analysis_jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "published");

        const { count: failedCount } = await supabase
          .from("analysis_jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "failed");

        setStats({
          totalUsers: userCount || 0,
          totalReports: reportCount || 0,
          activeReports: activeCount,
        });
        setRecentReports(reports || []);
        setJobSummary({
          queued: queuedCount || 0,
          inProgress: inProgressCount || 0,
          published: publishedCount || 0,
          failed: failedCount || 0,
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();

    fetchQueueMetrics();
    const interval = setInterval(fetchQueueMetrics, 10 * 60 * 1000);
    return () => clearInterval(interval);
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

                              {/* OPERATIONS */}
                    {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <Shield className="h-5 w-5 text-[#0F172A]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A] uppercase tracking-[0.18em]">
                      Operations
                    </div>
                    <div className="text-sm font-medium text-[#334155]">
                      Manual queue processing for early access operations.
                    </div>
                  </div>
                </div>
              </div>

                            <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={runQueueNow}
                  disabled={runLoading}
                  className="inline-flex items-center justify-center rounded-md border border-[#0F172A] bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d1326] disabled:opacity-60"
                >
                  {runLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing.
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Process Queue Now
                    </>
                  )}
                </button>
              </div>

              {runResult && (
                <div
                  className={`mt-5 rounded-lg border p-4 text-sm font-medium ${
                    runResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-red-200 bg-red-50 text-red-900"
                  }`}
                >
                  <div>{runResult.message}</div>
                  {runResult.details && (
                    <div className="mt-2 text-xs opacity-80">
                      Details: {runResult.details}
                    </div>
                  )}
                  {runResult.ok &&
                    runResult.transitions &&
                    runResult.transitions.length > 0 && (
                      <div className="mt-3 text-xs">
                        <div className="mb-2 font-semibold uppercase tracking-[0.18em] text-[10px]">
                          Advanced Jobs
                        </div>
                        <div className="space-y-1 text-emerald-900/80">
                          {runResult.transitions.slice(0, 6).map((transition) => (
                            <div key={`${transition.job_id}-${transition.to_status}`}>
                              {transition.job_id} {transition.from_status} {"->"} {transition.to_status}
                            </div>
                          ))}
                          {runResult.transitions.length > 6 && (
                            <div>and {runResult.transitions.length - 6} more</div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </motion.div>
          )}

          {/* STATS GRID */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin h-10 w-10 text-[#1F8A8A]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Queued
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                    {jobSummary.queued}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    In Progress
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                    {jobSummary.inProgress}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Published
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                    {jobSummary.published}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Failed
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                    {jobSummary.failed}
                  </div>
                </div>
              </div>
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-lg shadow-sm p-8 border border-slate-200 mb-12"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    Queue Overview
                  </h2>
                  <button
                    onClick={fetchQueueMetrics}
                    className="flex items-center gap-2 text-[#1F8A8A] font-semibold hover:underline"
                  >
                    <RefreshCcw className="h-4 w-4" /> Refresh
                  </button>
                </div>

                {queueLoading ? (
                  <div className="text-sm text-slate-500">Loading queue metrics...</div>
                ) : queueError ? (
                  <div className="text-sm text-red-700">{queueError}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                      {[
                        ["Queued", "queued"],
                        ["Extracting", "extracting"],
                        ["Underwriting", "underwriting"],
                        ["Scoring", "scoring"],
                        ["Rendering", "rendering"],
                        ["PDF Generating", "pdf_generating"],
                        ["Publishing", "publishing"],
                        ["Published", "published"],
                        ["Failed", "failed"],
                      ].map(([label, key]) => (
                        <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            {label}
                          </div>
                          <div className="mt-1 text-xl font-extrabold text-[#0F172A]">
                            {queueMetrics?.counts_by_status?.[key] ?? 0}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-left text-[#0F172A] text-xs font-semibold bg-slate-50">
                            <th className="p-3 border-b border-slate-200">Job ID</th>
                            <th className="p-3 border-b border-slate-200">Property</th>
                            <th className="p-3 border-b border-slate-200">Status</th>
                            <th className="p-3 border-b border-slate-200">Created</th>
                            <th className="p-3 border-b border-slate-200">Started</th>
                            <th className="p-3 border-b border-slate-200">User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(queueMetrics?.recent_jobs || []).length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="p-4 text-center text-sm text-slate-500"
                              >
                                No recent jobs found.
                              </td>
                            </tr>
                          ) : (
                            queueMetrics.recent_jobs.map((job) => (
                              <tr key={job.id} className="border-b border-slate-100">
                                <td className="p-3 text-xs text-slate-600">{job.id}</td>
                                <td className="p-3 text-sm font-semibold text-[#0F172A]">
                                  {job.property_name || "Untitled Property"}
                                </td>
                                <td className="p-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {job.status}
                                </td>
                                <td className="p-3 text-xs text-slate-600">
                                  {job.created_at ? new Date(job.created_at).toLocaleString() : "—"}
                                </td>
                                <td className="p-3 text-xs text-slate-600">
                                  {(job.started_at || job.created_at) ? new Date(job.started_at || job.created_at).toLocaleString() : "-"}
                                </td>
                                <td className="p-3 text-xs text-slate-600">{job.user_id}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </motion.div>

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

      </div>
    </>
  );
}
