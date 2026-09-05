import { Check, Plus, Search, ShieldCheck, UserCog, UserPlus, Users, UsersRound } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { Field, SectionHeading } from '../components/PageParts';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';
import type { Account, AccountRole } from '../types';

const fmt = (value: string) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function Accounts() {
  const { state, dispatch } = useStore();
  const activeGuests = state.vehicles.filter(v => v.connection === 'online' && v.occupant?.kind === 'guest').length;
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'All' | AccountRole>('All');
  const [selected, setSelected] = useState<Account | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', operatorId: '', role: 'Driver' as AccountRole });

  const filtered = useMemo(() => state.accounts.filter(account => {
    const matchSearch = `${account.name} ${account.email} ${account.operatorId}`.toLowerCase().includes(query.toLowerCase());
    return matchSearch && (role === 'All' || account.role === role);
  }), [state.accounts, query, role]);

  const addAccount = (event: FormEvent) => {
    event.preventDefault();
    const account: Account = {
      id: `acc-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      operatorId: form.operatorId.trim().toUpperCase(),
      role: form.role,
      status: 'ACTIVE',
      consent: { dataSharing: false, healthMonitoring: false, emergencyEscalation: false },
      lastActive: new Date().toISOString()
    };
    dispatch({ type: 'ADD_ACCOUNT', payload: account });
    setAddOpen(false);
    setForm({ name: '', email: '', operatorId: '', role: 'Driver' });
    push(`${account.name} added.`);
  };

  const toggle = (account: Account) => {
    dispatch({ type: 'TOGGLE_ACCOUNT', payload: account.id });
    setSelected(prev => prev?.id === account.id ? { ...account, status: account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : prev);
    push(`${account.name} ${account.status === 'ACTIVE' ? 'disabled' : 'enabled'}.`);
  };

  return (
    <>
      <div className="metric-grid metric-grid--three">
        <div className="mini-stat"><div className="mini-stat__icon"><Users /></div><div><span>Registered accounts</span><strong>{state.accounts.length}</strong></div></div>
        <div className="mini-stat"><div className="mini-stat__icon mini-stat__icon--gold"><UsersRound /></div><div><span>Active guest sessions</span><strong>{activeGuests}</strong></div></div>
        <div className="mini-stat"><div className="mini-stat__icon"><UserCog /></div><div><span>Active administrators</span><strong>{state.accounts.filter(a => a.role === 'Fleet Admin' && a.status === 'ACTIVE').length}</strong></div></div>
      </div>

      <section className="panel">
        <SectionHeading eyebrow="ACCESS & CONSENT" title="Account directory" description="Manage registered SafeSeat accounts and consent visibility. Guest occupants are session-only and do not require an account record." action={<button className="button button--primary" onClick={() => setAddOpen(true)}><UserPlus size={17} />Add account</button>} />
        <div className="toolbar">
          <div className="search-box"><Search size={17} /><input placeholder="Search name, email, or operator ID…" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <select className="filter-select" value={role} onChange={e => setRole(e.target.value as typeof role)}><option>All</option><option>Fleet Admin</option><option>Driver</option><option>Occupant</option></select>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Account</th><th>Role</th><th>Status</th><th>Consent summary</th><th>Last active</th><th></th></tr></thead>
            <tbody>{filtered.map(account => (
              <tr key={account.id}>
                <td><div className="account-cell"><div className="avatar">{account.name.split(' ').map(x => x[0]).slice(0,2).join('')}</div><div><strong>{account.name}</strong><span>{account.email} • {account.operatorId}</span></div></div></td>
                <td>{account.role}</td>
                <td><StatusBadge status={account.status} /></td>
                <td><div className="consent-dots"><span className={account.consent.dataSharing ? 'consent-on' : ''}>Data</span><span className={account.consent.healthMonitoring ? 'consent-on' : ''}>Monitor</span><span className={account.consent.emergencyEscalation ? 'consent-on' : ''}>Escalate</span></div></td>
                <td className="muted">{fmt(account.lastActive)}</td>
                <td><button className="text-button" onClick={() => setSelected(account)}>Manage</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <div className="notice notice--green notice--page"><UsersRound size={18} /><div><strong>Guests are not user accounts</strong><p>When a monitored passenger is using SafeSeat as a guest, the admin module shows that person as a Guest occupant within the active session and incident history. The guest does not appear in this account directory unless they later register an account.</p></div></div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} eyebrow={selected ? `${selected.role} • ${selected.operatorId}` : undefined}>
        {selected && <div className="form-stack">
          <div className="profile-summary"><div className="avatar avatar--large">{selected.name.split(' ').map(x => x[0]).slice(0,2).join('')}</div><div><h3>{selected.name}</h3><p>{selected.email}</p></div><StatusBadge status={selected.status} /></div>
          <div className="consent-panel">
            <span className="eyebrow">CONSENT VISIBILITY</span>
            <div className="consent-line"><div><strong>Data Sharing Consent</strong><span>Profile preference from the user-facing app.</span></div>{selected.consent.dataSharing ? <span className="consent-yes"><Check size={15} />Granted</span> : <span className="consent-no">Not granted</span>}</div>
            <div className="consent-line"><div><strong>Health Monitoring</strong><span>Permission for SafeSeat monitoring during assigned sessions.</span></div>{selected.consent.healthMonitoring ? <span className="consent-yes"><Check size={15} />Granted</span> : <span className="consent-no">Not granted</span>}</div>
            <div className="consent-line"><div><strong>Emergency Escalation</strong><span>Permission associated with configured emergency workflow.</span></div>{selected.consent.emergencyEscalation ? <span className="consent-yes"><Check size={15} />Granted</span> : <span className="consent-no">Not granted</span>}</div>
          </div>
          <div className="notice notice--subtle"><ShieldCheck size={17} /><div><strong>Admin boundary</strong><p>This screen exposes consent state for administration. It does not let an administrator silently grant consent on behalf of the occupant.</p></div></div>
          <div className="modal-actions"><button className={`button ${selected.status === 'ACTIVE' ? 'button--danger-soft' : 'button--primary'}`} onClick={() => toggle(selected)}>{selected.status === 'ACTIVE' ? 'Disable account' : 'Enable account'}</button></div>
        </div>}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add account" eyebrow="ACCOUNT MANAGEMENT" size="sm">
        <form className="form-stack" onSubmit={addAccount}>
          <Field label="Full name"><input required value={form.name} onChange={e => setForm(x => ({ ...x, name: e.target.value }))} /></Field>
          <Field label="Email"><input type="email" required value={form.email} onChange={e => setForm(x => ({ ...x, email: e.target.value }))} /></Field>
          <Field label="Operator ID"><input required placeholder="DRV-030" value={form.operatorId} onChange={e => setForm(x => ({ ...x, operatorId: e.target.value }))} /></Field>
          <Field label="Role"><select value={form.role} onChange={e => setForm(x => ({ ...x, role: e.target.value as AccountRole }))}><option>Fleet Admin</option><option>Driver</option><option>Occupant</option></select></Field>
          <p className="form-note">New accounts start with consent preferences disabled. Consent should be collected through the appropriate user flow.</p>
          <div className="modal-actions"><button type="button" className="button button--ghost" onClick={() => setAddOpen(false)}>Cancel</button><button className="button button--primary" type="submit"><Plus size={17} />Add account</button></div>
        </form>
      </Modal>
    </>
  );
}
