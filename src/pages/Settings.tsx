import type { ReactNode } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  Cloud,
  Database,
  List,
  LockKeyhole,
  RotateCcw,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import { SectionHeading } from '../components/PageParts';
import { Toggle } from '../components/Toggle';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';
import { runtimeConfig } from '../config/runtime';

function SettingRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className={`preference-card ${checked ? 'preference-card--enabled' : ''}`}>
      <div className="preference-card__top">
        <div className="preference-card__icon" aria-hidden="true">{icon}</div>
        <div className="preference-card__status" data-enabled={checked ? 'true' : 'false'}>
          <span className="preference-card__status-dot" />
          {checked ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      <div className="preference-card__copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <div className="preference-card__footer">
        <span>{checked ? 'Preference is active' : 'Preference is inactive'}</span>
        <Toggle label={title} checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { state, dispatch, syncStatus, syncError } = useStore();
  const { push } = useToast();
  const firebaseMode = runtimeConfig.dataMode === 'firebase';

  const update = (key: keyof typeof state.settings, value: boolean) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    push(firebaseMode ? 'Preference queued for Firebase sync.' : 'Preference saved.');
  };

  const reset = () => {
    if (firebaseMode) return;
    if (!window.confirm('Reset the local demonstration records to the original SafeSeat demo state?')) return;
    dispatch({ type: 'RESET' });
    push('Demo data reset.');
  };

  return (
    <div className="settings-layout settings-layout--redesign">
      <section className="panel settings-panel settings-panel--preferences">
        <div className="settings-section-head">
          <SectionHeading
            eyebrow="PREFERENCES"
            title="Control Center behavior"
            description="Choose how administrative alerts and dashboard information are presented. SafeSeat privacy boundaries remain fixed regardless of these preferences."
          />
          <div className="settings-count-pill">4 controls</div>
        </div>

        <div className="preferences-grid">
          <SettingRow
            icon={<Bell />}
            title="Critical incident notifications"
            description="Surface escalated incidents prominently so urgent events remain visible to administrators."
            checked={state.settings.criticalNotifications}
            onChange={v => update('criticalNotifications', v)}
          />
          <SettingRow
            icon={<CheckCircle2 />}
            title="Resolved-event notifications"
            description="Show passive notifications when an incident is automatically cleared or reviewed."
            checked={state.settings.resolvedNotifications}
            onChange={v => update('resolvedNotifications', v)}
          />
          <SettingRow
            icon={<Activity />}
            title="Hardware health warnings"
            description="Surface degraded or offline hardware states so administrators can act on device health issues."
            checked={state.settings.healthWarnings}
            onChange={v => update('healthWarnings', v)}
          />
          <SettingRow
            icon={<List />}
            title="Compact table density"
            description="Reduce table and card spacing when more fleet information needs to fit on the screen."
            checked={state.settings.compactDensity}
            onChange={v => update('compactDensity', v)}
          />
        </div>
      </section>

      <section className="panel settings-panel settings-panel--data">
        <SectionHeading
          eyebrow="DATA SOURCE"
          title="SafeSeat data integration"
          description={firebaseMode
            ? 'This build is connected to Firebase Authentication and Firestore through the shared SafeSeat cloud project.'
            : 'This build is using deterministic local demo records for screenshots and UI review.'}
        />

        <div className="settings-data-grid">
          <div className="integration-card integration-card--primary settings-data-card">
            <div className="integration-card__icon">{firebaseMode ? <Cloud /> : <Database />}</div>
            <div className="integration-card__copy">
              <span>Current mode</span>
              <strong>{firebaseMode ? 'Firebase / Firestore backend' : 'Persistent demonstration data'}</strong>
              <p>{firebaseMode
                ? `Authentication and administrative records are sourced from the configured SafeSeat Firebase project. Realtime status: ${syncStatus}.`
                : 'Vehicle, account, incident, and hardware-status records are representative UI data. Changes persist only in this browser.'}</p>
            </div>
            <span className={`status-badge ${firebaseMode && syncStatus === 'live' ? 'status-badge--operational' : 'status-badge--standby'}`}>
              {firebaseMode ? syncStatus : 'Demo mode'}
            </span>
          </div>

          <div className="integration-card integration-card--secondary settings-data-card">
            <div className="integration-card__icon integration-card__icon--neutral"><ServerCog /></div>
            <div className="integration-card__copy">
              <span>System boundary</span>
              <strong>Same SafeSeat backend, no second cloud</strong>
              <p>The mobile app and Admin Module use the same Firebase project. The Main Hub remains the authoritative local controller; only privacy-minimized derived session/event state is synchronized to cloud records for administrative use.</p>
            </div>
          </div>
        </div>

        {firebaseMode && syncError && <div className="form-error settings-sync-error"><strong>Firebase synchronization error:</strong> {syncError}</div>}

        <div className="privacy-boundary-card settings-privacy-card">
          <div className="privacy-boundary-card__icon"><LockKeyhole /></div>
          <div>
            <span>Fixed privacy boundary</span>
            <strong>Exact physiological readings are excluded</strong>
            <p>The Admin Module schema does not include exact HR, RR, MLX temperature, FSR values, MPU samples, or camera frames. Only derived SafeSeat states, hardware health, posture-verification outcomes, and incident metadata belong in the cloud-facing Admin contract.</p>
          </div>
        </div>

        {!firebaseMode && (
          <div className="settings-action-row settings-reset-row">
            <div>
              <strong>Reset demonstration records</strong>
              <span>Restore the original representative vehicles, guest session, accounts, and incidents.</span>
            </div>
            <button className="button button--danger-soft" onClick={reset}><RotateCcw size={17} />Reset demo data</button>
          </div>
        )}
      </section>

      <section className="panel settings-panel settings-panel--safeguards">
        <SectionHeading
          eyebrow="SAFESEAT BOUNDARIES"
          title="Admin module safeguards"
          description="These safeguards are part of the administrative boundary and are not configurable preferences."
        />
        <div className="policy-grid settings-policy-grid">
          <div><span className="policy-grid__icon"><ShieldCheck /></span><strong>Non-diagnostic wording</strong><span>States and anomalies are shown without assigning medical diagnoses.</span></div>
          <div><span className="policy-grid__icon"><ShieldCheck /></span><strong>Event-based camera</strong><span>No feature in the admin dashboard implies continuous camera surveillance.</span></div>
          <div><span className="policy-grid__icon"><ShieldCheck /></span><strong>Consent visibility</strong><span>Admins can see consent state but cannot silently grant it on behalf of an occupant.</span></div>
          <div><span className="policy-grid__icon"><ShieldCheck /></span><strong>Privacy-minimized telemetry</strong><span>Administrative views receive derived states rather than exact physiological values.</span></div>
        </div>
      </section>
    </div>
  );
}
