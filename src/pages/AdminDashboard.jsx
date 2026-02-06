import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { FileText, Loader2, Users, BarChart3, RefreshCcw, Shield } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

  export default function AdminDashboard() {
  const { toast } = useToast();
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
    needsDocuments: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState(null);
  const [lastQueueMetricsAt, setLastQueueMetricsAt] = useState(null);
  const [issueUpdating, setIssueUpdating] = useState({});
  const [adminRunKey, setAdminRunKey] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("ADMIN_RUN_KEY") || "" : "")
  );


  const fetchQueueMetrics = async () => {
    if (!adminRunKey?.trim()) {
      setQueueError("Admin Run Key required.");
      return;
    }
    setQueueLoading(true);
    setQueueError(null);

    try {
      const res = await fetch("/api/admin/queue-metrics", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminRunKey}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load queue metrics.");
      }

      setQueueMetrics(data);
      setLastQueueMetricsAt(new Date());
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

        const { count: needsDocumentsCount } = await supabase
          .from("analysis_jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "needs_documents");

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
          needsDocuments: needsDocumentsCount || 0,
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
              Admin <span className="text-[#1F8A8A]">Console</span>
            </h1>
            <p className="text-[#334155] text-lg font-medium">
              Operational metrics, queue health, and issue triage.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Admin Run Key
              </label>
              <input
                type="password"
                value={adminRunKey}
                onChange={(event) => setAdminRunKey(event.target.value)}
                onBlur={(event) =>
                  localStorage.setItem("ADMIN_RUN_KEY", event.target.value || "")
                }
                className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F8A8A]/30"
                placeholder="Enter admin key"
              />
              {!adminRunKey.trim() ? (
                <div className="text-xs text-red-700">
                  Admin Run Key required to access admin endpoints.
                </div>
              ) : null}
            </div>
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
                      Queue processing runs automatically every few minutes.
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* STATS GRID */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin h-10 w-10 text-[#1F8A8A]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
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
                    Needs Documents
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                    {jobSummary.needsDocuments}
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
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Queue health</h2>
                  <div className="text-sm font-medium text-[#334155]">
                    Queue processing runs automatically every few minutes.
                  </div>
                </div>
                <button
                  onClick={fetchQueueMetrics}
                  className="flex items-center gap-2 text-[#1F8A8A] font-semibold hover:underline"
                >
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </button>
              </div>

              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                Last refresh: {lastQueueMetricsAt ? lastQueueMetricsAt.toLocaleString() : "-"}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const counts = queueMetrics?.counts_by_status || {};
                  const inProgressCount = [
                    "validating_inputs",
                    "extracting",
                    "underwriting",
                    "scoring",
                    "rendering",
                    "pdf_generating",
                    "publishing",
                  ].reduce((sum, key) => sum + (counts[key] || 0), 0);
                  const queuedCount = counts.queued || 0;
                  const blockedCount = counts.needs_documents || 0;
                  const failedCount = counts.failed || 0;

                  return (
                    <>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          Queued
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                          {queuedCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          In Progress
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                          {inProgressCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          Blocked (Needs Documents)
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                          {blockedCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          Failed
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                          {failedCount}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="text-sm font-medium text-[#334155]">
                {(() => {
                  const counts = queueMetrics?.counts_by_status || {};
                  const blockedCount = counts.needs_documents || 0;
                  const failedCount = counts.failed || 0;
                  if (failedCount > 0) {
                    return "Failures detected. Review job events.";
                  }
                  if (blockedCount > 0) {
                    return "Jobs are waiting on required documents.";
                  }
                  return "Pipeline healthy.";
                })()}
              </div>
            </motion.div>

            

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-sm p-8 border border-slate-200 mb-12"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#0F172A]">Queue overview</h2>
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
                        ["Needs Documents", "needs_documents"],
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
<motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-sm p-8 border border-slate-200 mb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0F172A]">Issue Inbox</h2>
              </div>

              {queueMetrics?.issues_error ? (
                <div className="text-sm text-slate-500">DATA NOT AVAILABLE</div>
              ) : (queueMetrics?.issues || []).length === 0 ? (
                <div className="text-sm text-slate-500">No issues reported.</div>
              ) : (
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-[#0F172A] text-xs font-semibold bg-slate-50">
                        <th className="p-3 border-b border-slate-200">Created</th>
                        <th className="p-3 border-b border-slate-200">Status</th>
                        <th className="p-3 border-b border-slate-200">Job ID</th>
                        <th className="p-3 border-b border-slate-200">User ID</th>
                        <th className="p-3 border-b border-slate-200">Message</th>
                        <th className="p-3 border-b border-slate-200">Attachment</th>
                        <th className="p-3 border-b border-slate-200 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueMetrics.issues.map((issue) => {
                        const message = issue?.message || "";
                        const truncated =
                          message.length > 120 ? `${message.slice(0, 120)}…` : message;
                        const isUpdating = Boolean(issueUpdating[issue.id]);
                        const regenKey = `regen-${issue.id}`;
                        const isRegenerating = Boolean(issueUpdating[regenKey]);
                        return (
                          <tr key={issue.id} className="border-b border-slate-100">
                            <td className="p-3 text-xs text-slate-600">
                              {issue.created_at ? new Date(issue.created_at).toLocaleString() : "-"}
                            </td>
                            <td className="p-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              {issue.status || "-"}
                            </td>
                            <td className="p-3 text-xs text-slate-600">{issue.job_id || "-"}</td>
                            <td className="p-3 text-xs text-slate-600">{issue.user_id || "-"}</td>
                            <td className="p-3 text-xs text-slate-600">{truncated}</td>
                            <td className="p-3 text-xs text-slate-600">
                              {issue.attachment_url ? (
                                <a
                                  href={issue.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#1F8A8A] font-semibold hover:underline"
                                >
                                  View attachment
                                </a>
                              ) : issue.attachment_path ? (
                                "DATA NOT AVAILABLE"
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-3 text-right text-xs text-slate-600">
                              <div className="flex justify-end gap-2">
                                {issue.status !== "reviewing" && (
                                  <button
                                    disabled={isUpdating}
                                    onClick={async () => {
                                      if (!adminRunKey?.trim()) {
                                        toast({ title: "Admin Run Key required", variant: "destructive" });
                                        return;
                                      }
                                      try {
                                        setIssueUpdating((prev) => ({ ...prev, [issue.id]: true }));
                                        const res = await fetch("/api/admin/queue-metrics", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${adminRunKey}`,
                                          },
                                          body: JSON.stringify({
                                            issue_id: issue.id,
                                            status: "reviewing",
                                          }),
                                        });
                                        const data = await res.json().catch(() => ({}));
                                        if (!res.ok || !data?.ok) {
                                          throw new Error("Update failed");
                                        }
                                        toast({ title: "Updated" });
                                        await fetchQueueMetrics();
                                      } catch (err) {
                                        toast({ title: "Update failed", variant: "destructive" });
                                      } finally {
                                        setIssueUpdating((prev) => ({ ...prev, [issue.id]: false }));
                                      }
                                    }}
                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    Mark reviewing
                                  </button>
                                )}
                                {issue.status !== "resolved" && (
                                  <button
                                    disabled={isUpdating}
                                    onClick={async () => {
                                      if (!adminRunKey?.trim()) {
                                        toast({ title: "Admin Run Key required", variant: "destructive" });
                                        return;
                                      }
                                      try {
                                        setIssueUpdating((prev) => ({ ...prev, [issue.id]: true }));
                                        const res = await fetch("/api/admin/queue-metrics", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${adminRunKey}`,
                                          },
                                          body: JSON.stringify({
                                            issue_id: issue.id,
                                            status: "resolved",
                                          }),
                                        });
                                        const data = await res.json().catch(() => ({}));
                                        if (!res.ok || !data?.ok) {
                                          throw new Error("Update failed");
                                        }
                                        toast({ title: "Updated" });
                                        await fetchQueueMetrics();
                                      } catch (err) {
                                        toast({ title: "Update failed", variant: "destructive" });
                                      } finally {
                                        setIssueUpdating((prev) => ({ ...prev, [issue.id]: false }));
                                      }
                                    }}
                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    Mark resolved
                                  </button>
                                )}
                                <button
                                  disabled={isRegenerating || !issue.job_id}
                                  onClick={async () => {
                                    if (!issue.job_id) return;
                                    if (!adminRunKey?.trim()) {
                                      toast({ title: "Admin Run Key required", variant: "destructive" });
                                      return;
                                    }
                                    try {
                                      setIssueUpdating((prev) => ({
                                        ...prev,
                                        [regenKey]: true,
                                      }));
                                      const res = await fetch("/api/admin/run-eligible-jobs-once", {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${adminRunKey}`,
                                        },
                                        body: JSON.stringify({
                                          job_id: issue.job_id,
                                        }),
                                      });
                                      const data = await res.json().catch(() => ({}));
                                      if (!res.ok || !data?.ok) {
                                        throw new Error("Regeneration failed");
                                      }
                                      toast({
                                        title: "Regeneration started",
                                        description: "Job queued for regeneration.",
                                      });
                                      await fetchQueueMetrics();
                                    } catch (err) {
                                      toast({
                                        title: "Regeneration failed",
                                        description: "Unable to start regeneration.",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setIssueUpdating((prev) => ({
                                        ...prev,
                                        [regenKey]: false,
                                      }));
                                    }
                                  }}
                                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                  title={!issue.job_id ? "No job id" : undefined}
                                >
                                  Regenerate
                                </button>
                              </div>
                              <div className="mt-2 text-[11px] text-slate-500 text-right">
                                Regeneration re-queues the same job ID. It does not create a new job and does not consume entitlements.
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

