import { Database, LockKeyhole, RotateCcw, ServerCog, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '../components/PageParts';
import { Toggle } from '../components/Toggle';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';

function SettingRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="setting-row">
      <div className="setting-row__copy"><strong>{title}</strong><span>{description}</span></div>
      <div className="setting-row__control"><Toggle label={title} checked={checked} onChange={onChange} /></div>
    </div>
  );
}

export function SettingsPage() {
  const { state, dispatch } = useStore();
  const { push } = useToast();

  const update = (key: keyof typeof state.settings, value: boolean) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    push('Preference saved.');
  };

  const reset = () => {
    if (!window.confirm('Reset the local demonstration records to the original SafeSeat demo state?')) return;
    dispatch({ type: 'RESET' });
    push('Demo data reset.');
  };

  return (
    <div className="settings-layout">
      <section className="panel settings-panel">
        <SectionHeading eyebrow="PREFERENCES" title="Control Center behavior" description="Presentation preferences for the administrative dashboard. Privacy boundaries are fixed and cannot be disabled here." />
        <div className="settings-list">
          <SettingRow title="Critical incident notifications" description="Surface escalated incidents prominently in the dashboard." checked={state.settings.criticalNotifications} onChange={v => update('criticalNotifications', v)} />
          <SettingRow title="Resolved-event notifications" description="Show passive notifications for incidents that are automatically cleared or reviewed." checked={state.settings.resolvedNotifications} onChange={v => update('resolvedNotifications', v)} />
          <SettingRow title="Hardware health warnings" description="Surface degraded or offline hardware states to administrators." checked={state.settings.healthWarnings} onChange={v => update('healthWarnings', v)} />
          <SettingRow title="Compact table density" description="Reduce table and card spacing when more fleet information needs to fit on screen." checked={state.settings.compactDensity} onChange={v => update('compactDensity', v)} />
        </div>
      </section>

      <section className="panel settings-panel">
        <SectionHeading eyebrow="DATA SOURCE" title="Data integration boundary" description="The current build uses deterministic demonstration records so the interface can be reviewed and captured consistently before backend integration." />
        <div className="integration-stack">
          <div className="integration-card integration-card--primary">
            <div className="integration-card__icon"><Database /></div>
            <div className="integration-card__copy"><span>Current mode</span><strong>Persistent demonstration data</strong><p>Vehicle, account, incident, and hardware-status records are representative UI data. Changes persist only in this browser during the prototype phase.</p></div>
            <span className="status-badge status-badge--standby">Demo mode</span>
          </div>

          <div className="integration-card integration-card--secondary">
            <div className="integration-card__icon integration-card__icon--neutral"><ServerCog /></div>
            <div className="integration-card__copy"><span>Integration design</span><strong>Backend-ready data layer</strong><p>Page components consume the shared state layer instead of embedding records in the UI. The final SafeSeat backend/Firebase provider can replace the demo repository without redesigning the screens.</p></div>
          </div>

          <div className="privacy-boundary-card">
            <div className="privacy-boundary-card__icon"><LockKeyhole /></div>
            <div><span>Fixed privacy boundary</span><strong>Exact physiological readings are excluded</strong><p>The Admin Module does not display or persist raw HR, RR, temperature, pressure values, or camera frames. Only derived SafeSeat states, hardware health, posture-verification outcomes, and incident metadata belong in this interface.</p></div>
          </div>

          <div className="settings-action-row">
            <div><strong>Reset demonstration records</strong><span>Restore the original representative vehicles, guest session, accounts, and incidents.</span></div>
            <button className="button button--danger-soft" onClick={reset}><RotateCcw size={17} />Reset demo data</button>
          </div>
        </div>
      </section>

      <section className="panel settings-panel">
        <SectionHeading eyebrow="SAFESEAT BOUNDARIES" title="Admin module safeguards" />
        <div className="policy-grid">
          <div><ShieldCheck /><strong>Non-diagnostic wording</strong><span>States and anomalies are shown without assigning medical diagnoses.</span></div>
          <div><ShieldCheck /><strong>Event-based camera</strong><span>No feature in the admin dashboard implies continuous camera surveillance.</span></div>
          <div><ShieldCheck /><strong>Consent visibility</strong><span>Admins can see consent state but cannot silently grant it on behalf of an occupant.</span></div>
          <div><ShieldCheck /><strong>Privacy-minimized telemetry</strong><span>Administrative views receive derived states rather than exact physiological values.</span></div>
        </div>
      </section>
    </div>
  );
}
