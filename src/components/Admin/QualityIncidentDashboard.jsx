import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileWarning,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';

const T = {
  green: '#0F2318',
  gold: '#C9A84C',
  goldDark: '#9A7A2C',
  ink: '#0C0C0C',
  ink2: '#363636',
  ink3: '#606060',
  ink4: '#9A9A9A',
  white: '#FFFFFF',
  warm: '#FAFAF8',
  hairline: '#E8E5DF',
  hairlineMid: '#D0CCC4',
  okGreen: '#1A4A22',
  okBg: '#F2F8F3',
  okBorder: '#B8D4BC',
  errRed: '#7A1A1A',
  errBg: '#FDF4F4',
  errBorder: '#E8C0C0',
  warnAmber: '#7A4A00',
  warnBg: '#FDF8EE',
  warnBorder: '#E8D4A0',
  infoBlue: '#1A3A7A',
  infoBg: '#F0F4FF',
  infoBorder: '#B8C8F0',
};

function queueStyle(queue) {
  if (queue === 'BLOCKED') return { color: T.errRed, background: T.errBg, border: T.errBorder };
  if (queue === 'PUBLISHED_WITH_LIMITATIONS') return { color: T.warnAmber, background: T.warnBg, border: T.warnBorder };
  return { color: T.okGreen, background: T.okBg, border: T.okBorder };
}

function riskStyle(risk) {
  if (risk === 'HIGH') return { color: T.errRed, background: T.errBg, border: T.errBorder };
  if (risk === 'MEDIUM') return { color: T.warnAmber, background: T.warnBg, border: T.warnBorder };
  return { color: T.okGreen, background: T.okBg, border: T.okBorder };
}

function Chip({ children, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 22,
      padding: '2px 7px',
      border: `1px solid ${style.border || T.hairlineMid}`,
      background: style.background || T.warm,
      color: style.color || T.ink3,
      fontFamily: "'DM Mono',monospace",
      fontSize: 8,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function Button({ children, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${danger ? T.errBorder : T.hairlineMid}`,
        background: disabled ? T.warm : T.white,
        color: disabled ? T.ink4 : danger ? T.errRed : T.ink2,
        padding: '7px 10px',
        fontFamily: "'DM Mono',monospace",
        fontSize: 8,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

function SummaryCard({ label, value, accent, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        border: `1px solid ${active ? accent : T.hairline}`,
        borderTop: `3px solid ${accent}`,
        background: T.white,
        padding: '13px 14px 12px',
        cursor: 'pointer',
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.ink4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: accent, marginTop: 3 }}>
        {value ?? 0}
      </div>
    </button>
  );
}

function DetailList({ title, items, empty = 'None recorded.' }) {
  return (
    <div style={{ border: `1px solid ${T.hairline}`, padding: 12, background: T.white }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.goldDark, marginBottom: 8 }}>
        {title}
      </div>
      {items?.length ? items : (
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink4 }}>{empty}</div>
      )}
    </div>
  );
}

function IncidentDetail({ incident, adminRunKey, onActionRecorded }) {
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const recordAction = async (action, needsReference = false) => {
    if (needsReference && !reference.trim()) {
      setMessage('Enter a report or regression reference first.');
      return;
    }
    setBusy(action);
    setMessage('');
    try {
      const response = await fetch('/api/admin/quality-incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminRunKey.trim()}`,
        },
        body: JSON.stringify({
          job_id: incident.jobId,
          action,
          note: note.trim() || null,
          reference: reference.trim() || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setMessage('Action receipt recorded. No authority or financial state was changed.');
      setNote('');
      setReference('');
      onActionRecorded();
    } catch (error) {
      setMessage(error?.message || 'Action receipt could not be recorded.');
    } finally {
      setBusy('');
    }
  };

  const supportDocuments = (incident.documents || []).filter((document) => document.documentClass === 'support');
  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${T.hairlineMid}` }}>
        <div style={{ background: T.warm, padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
            <DetailList
              title="Quality events"
              items={(incident.events || []).map((entry) => (
                <div key={`${entry.code}-${entry.scope}`} style={{ padding: '7px 0', borderBottom: `1px solid ${T.hairline}` }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip style={riskStyle(String(entry.severity).toUpperCase())}>{entry.severity}</Chip>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.ink2 }}>{entry.code}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink3, marginTop: 5, lineHeight: 1.45 }}>{entry.message}</div>
                </div>
              ))}
              empty="No limitations or defects recorded."
            />
            <DetailList
              title="Section decisions"
              items={(incident.sections || []).map((section) => (
                <div key={section.sectionKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.hairline}` }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink2 }}>{section.sectionKey}</span>
                  <Chip>{section.outcome}</Chip>
                </div>
              ))}
            />
            <DetailList
              title="Support authority"
              items={supportDocuments.map((document) => (
                <div key={document.sourceIdentityKey || document.documentId} style={{ padding: '5px 0', borderBottom: `1px solid ${T.hairline}` }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink2 }}>{document.originalFilename || document.documentId}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                    <Chip>{document.adjudicatedRole || 'not accepted'}</Chip>
                    <Chip style={document.sourceBacked ? riskStyle('LOW') : riskStyle('MEDIUM')}>
                      {document.sourceBacked ? 'source backed' : 'not source backed'}
                    </Chip>
                    {document.conflict?.state && document.conflict.state !== 'none' && <Chip>{document.conflict.state}</Chip>}
                  </div>
                </div>
              ))}
              empty="No support sources recorded."
            />
          </div>

          <div style={{ marginTop: 10, border: `1px solid ${T.hairline}`, background: T.white, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.goldDark }}>Remedy control</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.ink4, marginTop: 4 }}>
                  These controls record an auditable request. They do not override Source Truth, Delivery Gate, publication, credits, or billing.
                </div>
              </div>
              {incident.reportUrl && (
                <a href={incident.reportUrl} target="_blank" rel="noreferrer" style={{ color: T.infoBlue, fontFamily: "'DM Mono',monospace", fontSize: 9, textDecoration: 'none' }}>
                  Inspect report <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
                </a>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,2fr) minmax(180px,1fr)', gap: 8, marginTop: 10 }}>
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional internal note" maxLength={1000} style={{ border: `1px solid ${T.hairlineMid}`, padding: '8px 10px', fontFamily: "'DM Sans',sans-serif", fontSize: 12 }} />
              <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Report or regression reference" maxLength={300} style={{ border: `1px solid ${T.hairlineMid}`, padding: '8px 10px', fontFamily: "'DM Sans',sans-serif", fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Button disabled={Boolean(busy)} onClick={() => recordAction('mark_for_review')}>Mark for review</Button>
              <Button disabled={Boolean(busy)} onClick={() => recordAction('mark_customer_contacted')}>Customer contacted</Button>
              <Button disabled={Boolean(busy)} onClick={() => recordAction('request_free_corrected_rerun')}>Request corrected rerun</Button>
              <Button disabled={Boolean(busy)} onClick={() => recordAction('request_credit_restoration_review')}>Request credit review</Button>
              {incident.terminalOutcome?.customerDocumentReplacementRequired === true && (
                <Button disabled={Boolean(busy)} onClick={() => recordAction('record_replacement_source_required')}>Record replacement source required</Button>
              )}
              <Button disabled={Boolean(busy)} onClick={() => recordAction('link_regression_case', true)}>Link regression</Button>
              <Button disabled={Boolean(busy)} onClick={() => recordAction('attach_corrected_report_reference', true)}>Attach corrected report</Button>
              <Button disabled={Boolean(busy)} onClick={() => recordAction('close_incident')}>Close incident</Button>
            </div>
            {message && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: message.startsWith('Action') ? T.okGreen : T.errRed, marginTop: 8 }}>{message}</div>}
            {(incident.actionReceipts || []).length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.hairline}` }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recorded actions</div>
                {(incident.actionReceipts || []).slice(0, 8).map((receipt, index) => (
                  <div key={`${receipt.id || receipt.createdAt}-${index}`} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.ink3, marginTop: 4 }}>
                    {receipt.action} · {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : 'time unavailable'}{receipt.reference ? ` · ${receipt.reference}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function QualityIncidentDashboard({ adminRunKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState('');
  const [risk, setRisk] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState('');

  const load = useCallback(async () => {
    if (!adminRunKey?.trim()) {
      setError('Admin run key required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100', since_days: '90' });
      const response = await fetch(`/api/admin/quality-incidents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || `HTTP ${response.status}`);
      setData(body);
    } catch (loadError) {
      setError(loadError?.message || 'Quality incidents could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [adminRunKey]);

  useEffect(() => {
    if (adminRunKey?.trim()) load();
  }, [adminRunKey, load]);

  const incidents = useMemo(() => {
    let rows = Array.isArray(data?.incidents) ? data.incidents : [];
    if (queue) rows = rows.filter((row) => row.queue === queue);
    if (risk) rows = rows.filter((row) => row.customerAttentionRisk === risk);
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      rows = rows.filter((row) => [
        row.propertyName,
        row.jobId,
        row.reportId,
        ...(row.events || []).map((entry) => `${entry.code} ${entry.message}`),
      ].join(' ').toLowerCase().includes(needle));
    }
    return rows;
  }, [data, queue, risk, search]);

  const summary = data?.summary || {};
  return (
    <section data-testid="quality-incident-dashboard" style={{ background: T.white, border: `1px solid ${T.hairline}`, padding: '24px 28px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, borderBottom: `1px solid ${T.hairline}`, paddingBottom: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.goldDark }}>Canonical quality operations</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 500, color: T.ink, margin: '3px 0 0' }}>Quality Incidents and Customer Remedy</h2>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink4, marginTop: 5 }}>
            Finalized Report Quality Manifest plus canonical delivery authority only.
          </div>
        </div>
        <Button onClick={load} disabled={loading || !adminRunKey?.trim()}>
          <RefreshCcw size={10} /> {loading ? 'Loading' : 'Refresh'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 8, marginBottom: 12 }}>
        <SummaryCard label="Blocked" value={summary?.queues?.BLOCKED} accent={T.errRed} active={queue === 'BLOCKED'} onClick={() => setQueue(queue === 'BLOCKED' ? '' : 'BLOCKED')} />
        <SummaryCard label="Published with limitations" value={summary?.queues?.PUBLISHED_WITH_LIMITATIONS} accent={T.warnAmber} active={queue === 'PUBLISHED_WITH_LIMITATIONS'} onClick={() => setQueue(queue === 'PUBLISHED_WITH_LIMITATIONS' ? '' : 'PUBLISHED_WITH_LIMITATIONS')} />
        <SummaryCard label="Published clean" value={summary?.queues?.PUBLISHED_CLEAN} accent={T.okGreen} active={queue === 'PUBLISHED_CLEAN'} onClick={() => setQueue(queue === 'PUBLISHED_CLEAN' ? '' : 'PUBLISHED_CLEAN')} />
        <SummaryCard label="High attention risk" value={summary?.customerAttentionRisk?.HIGH} accent={T.infoBlue} active={risk === 'HIGH'} onClick={() => setRisk(risk === 'HIGH' ? '' : 'HIGH')} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search property, job, report, or issue" style={{ flex: '1 1 300px', border: `1px solid ${T.hairlineMid}`, padding: '8px 10px', fontFamily: "'DM Sans',sans-serif", fontSize: 12 }} />
        <select value={risk} onChange={(event) => setRisk(event.target.value)} style={{ border: `1px solid ${T.hairlineMid}`, padding: '8px 10px', background: T.white, fontFamily: "'DM Mono',monospace", fontSize: 9 }}>
          <option value="">All attention risks</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {(queue || risk || search) && <Button onClick={() => { setQueue(''); setRisk(''); setSearch(''); }}>Clear filters</Button>}
      </div>

      {error ? (
        <div style={{ background: T.errBg, border: `1px solid ${T.errBorder}`, color: T.errRed, padding: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}><AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />{error}</div>
      ) : loading && !data ? (
        <div style={{ padding: 24, textAlign: 'center', color: T.ink4, fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>Loading canonical quality receipts...</div>
      ) : incidents.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: T.ink4, fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
          <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />No finalized quality receipts match these filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                {['Property / Job', 'Report', 'Queue', 'Attention', 'Responsibility', 'Finalized', ''].map((label) => (
                  <th key={label} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${T.hairlineMid}`, color: T.ink4, fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => {
                const open = expanded === incident.jobId;
                return (
                  <React.Fragment key={incident.jobId}>
                    <tr style={{ background: open ? T.warm : T.white }}>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}` }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink2 }}>{incident.propertyName || 'Property not recorded'}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.ink4, marginTop: 3 }}>{incident.jobId}</div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}` }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.ink2 }}>{incident.reportFamily || incident.reportType || 'Report'}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.ink4, marginTop: 3 }}>{incident.reportId || 'not published'}</div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}` }}><Chip style={queueStyle(incident.queue)}>{incident.queue.replaceAll('_', ' ')}</Chip></td>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}` }}><Chip style={riskStyle(incident.customerAttentionRisk)}>{incident.customerAttentionRisk}</Chip></td>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}`, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.ink3 }}>{String(incident.responsibility || 'none').replaceAll('_', ' ')}</td>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}`, fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.ink4 }}>{incident.finalizedAt ? new Date(incident.finalizedAt).toLocaleString() : 'not recorded'}</td>
                      <td style={{ padding: '10px', borderBottom: `1px solid ${T.hairline}` }}>
                        <Button onClick={() => setExpanded(open ? '' : incident.jobId)}>{open ? <ChevronUp size={10} /> : <ChevronDown size={10} />} Detail</Button>
                      </td>
                    </tr>
                    {open && <IncidentDetail incident={incident} adminRunKey={adminRunKey} onActionRecorded={load} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: `1px solid ${T.hairline}`, marginTop: 12, paddingTop: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.ink4 }}>
        <span><FileWarning size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Defect families: {summary?.defectFamilies?.length || 0}</span>
        <span><CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Receipt-only projection</span>
        <span><ShieldCheck size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />No legacy alias fallback</span>
      </div>
    </section>
  );
}
