import { Database, RotateCcw, Settings2, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '../components/PageParts';
import { Toggle } from '../components/Toggle';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';

export function SettingsPage() {
  const { state, dispatch } = useStore();
  const { push } = useToast();

  const update = (key: keyof typeof state.settings, value: boolean) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    push('Preference saved.');
  };

  const reset = () => {
    if (!window.confirm('Reset all local demo data to the original SafeSeat demo state?')) return;
    dispatch({ type: 'RESET' });
    push('Demo data reset.');
  };

  return (
    <div className="settings-layout">
      <section className="panel">
        <SectionHeading eyebrow="PREFERENCES" title="Control Center behavior" description="These preferences affect the admin dashboard presentation and demo-mode notifications." />
        <div className="settings-list">
          <div className="setting-row"><div><strong>Critical incident notifications</strong><span>Surface escalated incidents prominently in the dashboard.</span></div><Toggle label="Critical incident notifications" checked={state.settings.criticalNotifications} onChange={v => update('criticalNotifications', v)} /></div>
          <div className="setting-row"><div><strong>Resolved-event notifications</strong><span>Show passive notifications for incidents that are automatically cleared or reviewed.</span></div><Toggle label="Resolved event notifications" checked={state.settings.resolvedNotifications} onChange={v => update('resolvedNotifications', v)} /></div>
          <div className="setting-row"><div><strong>Hardware health warnings</strong><span>Surface degraded or offline hardware states to administrators.</span></div><Toggle label="Hardware health warnings" checked={state.settings.healthWarnings} onChange={v => update('healthWarnings', v)} /></div>
          <div className="setting-row"><div><strong>Show vitals in Overview table</strong><span>Display current HR, RR, and object temperature columns in the live-session table.</span></div><Toggle label="Show vitals in Overview table" checked={state.settings.showVitalsInTables} onChange={v => update('showVitalsInTables', v)} /></div>
          <div className="setting-row"><div><strong>Compact table density</strong><span>Reduce table and card spacing when more fleet information needs to fit on screen.</span></div><Toggle label="Compact table density" checked={state.settings.compactDensity} onChange={v => update('compactDensity', v)} /></div>
        </div>
      </section>

      <section className="panel">
        <SectionHeading eyebrow="DATA SOURCE" title="Data integration boundary" />
        <div className="integration-card"><div className="integration-card__icon"><Database /></div><div><span>Current mode</span><strong>Local persistent demo data</strong><p>Actions such as adding accounts, registering vehicles, resolving incidents, and running diagnostics persist in this browser through localStorage.</p></div><span className="status-badge status-badge--standby">Local mode</span></div>
        <div className="notice notice--subtle"><Settings2 size={18} /><div><strong>Backend-ready separation</strong><p>The UI and state layer are separated so the final SafeSeat backend/Firebase schema can replace the local repository without redesigning every screen. The ZIP intentionally does not invent a production database schema or credentials.</p></div></div>
        <button className="button button--danger-soft" onClick={reset}><RotateCcw size={17} />Reset prototype data</button>
      </section>

      <section className="panel">
        <SectionHeading eyebrow="SAFESEAT BOUNDARIES" title="Admin module safeguards" />
        <div className="policy-grid">
          <div><ShieldCheck /><strong>Non-diagnostic wording</strong><span>States and anomalies are shown without assigning medical diagnoses.</span></div>
          <div><ShieldCheck /><strong>Event-based camera</strong><span>No feature in the admin dashboard implies continuous camera surveillance.</span></div>
          <div><ShieldCheck /><strong>Consent visibility</strong><span>Admins can see consent state but cannot silently grant it on behalf of an occupant.</span></div>
          <div><ShieldCheck /><strong>Traceable incidents</strong><span>Event traces distinguish primary-sensor evidence, camera posture evidence, fusion decisions, and SMS escalation.</span></div>
        </div>
      </section>
    </div>
  );
}
