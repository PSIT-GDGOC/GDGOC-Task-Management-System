import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Plus, X } from 'lucide-react';
import { apiClient } from '../services/api';

type Status = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'REVOKED';
interface Invitation { id: string; reference: string; label: string | null; createdBy: { name: string }; createdAt: string; expiresAt: string; redeemedAt: string | null; redeemer: { name: string } | null; revokedAt: string | null; status: Status }
interface Summary { total: number; active: number; redeemed: number; expired: number }
const date = (value: string) => new Date(value).toLocaleString();

export const AdminInvitations: React.FC = () => {
  const [items, setItems] = useState<Invitation[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, redeemed: 0, expired: 0 });
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [label, setLabel] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  const refresh = async () => {
    setLoading(true); setError('');
    try { const result = await apiClient<{ data: Invitation[]; summary: Summary }>('/auth/invitations'); setItems(result.data); setSummary(result.summary); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load invitations.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => items.filter((item) => (filter === 'ALL' || item.status === filter) && `${item.reference} ${item.createdBy.name} ${item.label || ''}`.toLowerCase().includes(search.toLowerCase())), [items, filter, search]);
  const generate = async (event: React.FormEvent) => {
    event.preventDefault(); if (submitting) return;
    setSubmitting(true); setError('');
    try {
      const result = await apiClient<{ data: { rawCode: string; createdAt: string; expiresAt: string } }>('/auth/invitations', { method: 'POST', body: JSON.stringify({ position: label.trim() || undefined }) });
      setCode(result.data.rawCode); setExpiresAt(result.data.expiresAt); setCreatedAt(result.data.createdAt); setShowForm(false); setLabel(''); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate invitation.'); }
    finally { setSubmitting(false); }
  };
  const revoke = async (item: Invitation) => {
    if (!window.confirm(`Revoke invitation ${item.reference}? This cannot be undone.`)) return;
    try { await apiClient(`/auth/invitations/${encodeURIComponent(item.id)}`, { method: 'DELETE' }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to revoke invitation.'); }
  };
  const copy = async () => { if (!code) return; try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setError('Clipboard access was unavailable. Select and copy the invitation code.'); } };

  return <div className="max-w-6xl mx-auto space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Admin Invitations</h1><p className="text-xs text-gray-500 mt-1">Manage secure invitations for authorized GDGOC administrators.</p></div><button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><Plus className="w-4 h-4"/>Generate Invitation</button></div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Total Invitations', summary.total], ['Active', summary.active], ['Redeemed', summary.redeemed], ['Expired', summary.expired]].map(([title, value]) => <div key={title} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"><p className="text-[11px] font-semibold text-gray-500">{title}</p><p className="mt-1 text-2xl font-bold text-gray-900">{loading ? '—' : value}</p></div>)}</div>
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><h2 className="text-sm font-semibold text-gray-800">Invitation Records</h2><div className="flex gap-2"><input aria-label="Search invitations" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, creator, label" className="w-full sm:w-64 text-xs border border-gray-300 rounded-lg px-3 py-2"/><select aria-label="Filter invitations" value={filter} onChange={e => setFilter(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2"><option value="ALL">All</option>{['ACTIVE','REDEEMED','EXPIRED','REVOKED'].map(x => <option key={x}>{x}</option>)}</select></div></div>
      {loading ? <p className="p-8 text-center text-xs text-gray-500">Loading invitations…</p> : filtered.length === 0 ? <div className="p-10 text-center"><KeyRound className="mx-auto w-8 h-8 text-gray-300"/><p className="mt-3 text-sm font-semibold text-gray-800">{items.length ? 'No matching invitations.' : 'No invitations yet.'}</p>{!items.length && <><p className="mt-1 text-xs text-gray-500">Generate an invitation to securely onboard an authorized administrator.</p><button onClick={() => setShowForm(true)} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Generate Invitation</button></>}</div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-xs"><thead className="bg-gray-50 text-gray-600"><tr>{['Invitation','Label','Created By','Created At','Expires At','Status','Actions'].map(x => <th key={x} className="px-4 py-3 text-left font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{filtered.map(item => <tr key={item.id}><td className="px-4 py-3 font-mono">{item.reference}</td><td className="px-4 py-3">{item.label || '—'}</td><td className="px-4 py-3">{item.createdBy.name}{item.redeemer && <div className="text-[10px] text-gray-500">Redeemed by {item.redeemer.name}</div>}</td><td className="px-4 py-3 whitespace-nowrap">{date(item.createdAt)}</td><td className="px-4 py-3 whitespace-nowrap">{date(item.expiresAt)}{item.redeemedAt && <div className="text-[10px] text-gray-500">Redeemed {date(item.redeemedAt)}</div>}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3">{item.status === 'ACTIVE' && <button onClick={() => void revoke(item)} className="text-red-600 hover:underline">Revoke</button>}</td></tr>)}</tbody></table></div>}
    </section>
    {showForm && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={generate} className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl space-y-4"><div className="flex justify-between"><h2 className="font-bold text-gray-900">Generate New Invitation</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X className="w-4 h-4"/></button></div><p className="text-xs text-gray-500">Create a secure, single-use invitation for an authorized GDGOC administrator. This invitation expires 48 hours after generation.</p><label className="block text-xs font-semibold text-gray-700">Invitation label <span className="font-normal text-gray-400">(optional)</span><input maxLength={100} value={label} onChange={e => setLabel(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"/></label><p className="text-xs text-gray-500">Expiration: 48 hours</p><button disabled={submitting} className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white disabled:opacity-50">{submitting ? 'Generating…' : 'Generate Invitation'}</button></form></div>}
    {code && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-xl space-y-4"><h2 className="font-bold text-gray-900">Invitation Generated</h2><p className="text-xs text-gray-500">Copy this code now. It will not be available again.</p><code className="block break-all rounded-lg bg-gray-50 p-3 text-xs">{code}</code><div className="text-xs text-gray-600">Created: {date(createdAt)}<br/>Expires: {date(expiresAt)}<br/>Remaining validity: {Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 3600000))}h {Math.max(0, Math.floor(((new Date(expiresAt).getTime() - now) % 3600000) / 60000))}m</div><div className="flex justify-end gap-2"><button onClick={() => void copy()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">{copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}{copied ? 'Copied' : 'Copy Invitation Code'}</button><button onClick={() => { setCode(null); setCopied(false); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Done</button></div></div></div>}
  </div>;
};
