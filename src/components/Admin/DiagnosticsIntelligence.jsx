// src/components/Admin/DiagnosticsIntelligence.jsx
// -----------------------------------------------------------------------------
// Diagnostics Intelligence — Slice 1 (additive, read-only)
//
// Surfaces cross-job diagnostic rollup data the QA stack is already computing
// (qa_action_plan, report_contract_qa, source_report_coverage_qa,
// validator_diagnostics_rollup) so admin gains product intelligence without
// any change to publish behavior, doctrine wiring, or customer surface.
//
// This component:
//   - is read-only end-to-end (no mutating API calls)
//   - reuses the existing adminRunKey Bearer pattern
//   - uses the same Card/SectionHeader/Btn visual primitives as AdminDashboard
//   - shows a compact table with optional per-row local expand for example job_ids
//   - never wires job_ids into any mutating control
// -----------------------------------------------------------------------------
import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';

// Visual tokens identical to AdminDashboard.jsx's T constants so the panel
// blends in without importing private symbols.
const T = {
  ink: '#0C0C0C',
  ink2: '#363636',
  ink3: '#606060',
  ink4: '#9A9A9A',
  hairline: '#E8E5DF',
  hairlineMid: '#D0CCC4',
  warm: '#FAFAF8',
  white: '#FFFFFF',
  green: '#0F2318',
  gold: '#C9A84C',
  goldDark: '#9A7A2C',
  okGreen: '#1A4A22',
  okBg: '#F2F8F3',
  okBorder: '#B8D4BC',
  warnAmber: '#7A4A00',
  warnBg: '#FDF8EE',
  warnBorder: '#E8D4A0',
  errRed: '#7A1A1A',
  errBg: '#FDF4F4',
  errBorder: '#E8C0C0',
};

function severityChip(severity) {
  const s = String(severity || 'low').toLowerCase();
  if (s === 'critical') return { color: T.errRed, bg: T.errBg, border: T.errBorder, label: 'CRITICAL' };
  if (s === 'high') return { color: T.errRed, bg: T.errBg, border: T.errBorder, label: 'HIGH' };
  if (s === 'medium') return { color: T.warnAmber, bg: T.warnBg, border: T.warnBorder, label: 'MEDIUM' };
  return { color: T.ink3, bg: T.warm, border: T.hairline, label: s.toUpperCase() || 'LOW' };
}

function BlockChip({ label, color }) {
  return (
    <span
      style={{
        fontFamily: "'DM Mono',monospace",
        fontSize: 8,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        background: T.warm,
        color,
        border: `1px solid ${T.hairline}`,
      }}
    >
      {label}
    </span>
  );
}

export default function DiagnosticsIntelligence({ adminRunKey }) {
  const [rollup, setRollup] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const load = useCallback(async () => {
    if (!adminRunKey?.trim()) {
      setError('Admin run key required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/queue-metrics?include_diagnostics_rollup=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (data?.diagnostics_rollup_error) throw new Error(data.diagnostics_rollup_error);
      setRollup(Array.isArray(data?.diagnostics_rollup) ? data.diagnostics_rollup : []);
      setHasFetched(true);
    } catch (err) {
      setError(err?.message || 'Failed to load diagnostics rollup.');
    } finally {
      setLoading(false);
    }
  }, [adminRunKey]);

  useEffect(() => {
    if (adminRunKey?.trim()) load();
  }, [adminRunKey, load]);

  const toggleExpand = (code) => setExpanded((prev) => (prev === code ? null : code));

  return (
    <div data-testid="diagnostics-intelligence" style={{ marginBottom: 0 }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${T.hairline}`,
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.goldDark,
              marginBottom: 4,
              margin: 0,
            }}
          >
            Product Intelligence · Cross-Job 30d
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              color: T.ink,
              lineHeight: 1.1,
              margin: '4px 0 0',
            }}
          >
            Diagnostics Intelligence
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          data-testid="diagnostics-refresh"
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '6px 11px',
            background: 'transparent',
            color: loading ? T.ink4 : T.ink3,
            border: `1px solid ${T.hairlineMid}`,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <RefreshCcw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: T.errBg,
            border: `1px solid ${T.errBorder}`,
            color: T.errRed,
            padding: '10px 14px',
            marginBottom: 14,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12,
          }}
        >
          <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {error}
        </div>
      )}

      {!error && hasFetched && rollup.length === 0 && !loading && (
        <div
          data-testid="diagnostics-empty"
          style={{
            background: T.white,
            border: `1px solid ${T.hairline}`,
            padding: '28px 24px',
            textAlign: 'center',
            color: T.ink3,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 13,
          }}
        >
          <ShieldCheck size={20} color={T.okGreen} style={{ marginBottom: 8 }} />
          <div>No diagnostics requiring product attention.</div>
        </div>
      )}

      {rollup.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['CODE', 'OWNER', 'SECTION', 'SEVERITY', '7d', '30d', 'BLOCKS', ''].map((h, i) => (
                  <th
                    key={h + i}
                    style={{
                      textAlign: i === 4 || i === 5 ? 'right' : 'left',
                      padding: '8px 10px',
                      borderBottom: `1px solid ${T.hairline}`,
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 8,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: T.ink4,
                      fontWeight: 400,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rollup.map((row) => {
                const sev = severityChip(row.severity);
                const isOpen = expanded === row.code;
                return (
                  <React.Fragment key={row.code}>
                    <tr
                      data-testid={`diagnostics-row-${row.code}`}
                      onClick={() => toggleExpand(row.code)}
                      style={{ cursor: 'pointer', borderBottom: `1px solid ${T.hairline}` }}
                    >
                      <td
                        style={{
                          padding: '10px',
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          color: T.ink,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.code}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: 12,
                          color: T.ink3,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.owner_area || '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: 12,
                          color: T.ink3,
                        }}
                      >
                        {row.section || '—'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 8,
                            letterSpacing: '0.18em',
                            padding: '2px 7px',
                            background: sev.bg,
                            color: sev.color,
                            border: `1px solid ${sev.border}`,
                          }}
                        >
                          {sev.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'right',
                          fontFamily: "'Cormorant Garamond',Georgia,serif",
                          fontSize: 18,
                          color: T.ink,
                          fontWeight: 500,
                        }}
                      >
                        {row.count_7d ?? 0}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'right',
                          fontFamily: "'Cormorant Garamond',Georgia,serif",
                          fontSize: 18,
                          color: T.ink3,
                          fontWeight: 500,
                        }}
                      >
                        {row.count_30d ?? 0}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {row.blocks_customer_delivery && (
                            <BlockChip label="Customer" color={T.errRed} />
                          )}
                          {row.blocks_public_sample && (
                            <BlockChip label="Public" color={T.warnAmber} />
                          )}
                          {row.blocks_high_value_outreach && (
                            <BlockChip label="Outreach" color={T.warnAmber} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px', color: T.ink4 }}>
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr
                        data-testid={`diagnostics-detail-${row.code}`}
                        style={{ background: T.warm, borderBottom: `1px solid ${T.hairline}` }}
                      >
                        <td colSpan={8} style={{ padding: '12px 14px' }}>
                          <div
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 9,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: T.ink4,
                              marginBottom: 8,
                            }}
                          >
                            Example job_ids (up to 5)
                          </div>
                          {Array.isArray(row.example_job_ids) && row.example_job_ids.length > 0 ? (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {row.example_job_ids.map((id) => (
                                <span
                                  key={id}
                                  style={{
                                    fontFamily: "'DM Mono',monospace",
                                    fontSize: 11,
                                    color: T.ink2,
                                    background: T.white,
                                    border: `1px solid ${T.hairline}`,
                                    padding: '4px 8px',
                                  }}
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p
                              style={{
                                fontFamily: "'DM Sans',sans-serif",
                                fontSize: 12,
                                color: T.ink4,
                                margin: 0,
                              }}
                            >
                              No example job_ids recorded.
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!hasFetched && !loading && !error && (
        <p
          style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12,
            color: T.ink4,
            margin: 0,
          }}
        >
          Loading diagnostics intelligence…
        </p>
      )}
    </div>
  );
}
