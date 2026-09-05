import { Activity, Camera, CheckCircle2, Cpu, Gauge, RefreshCw, Radio, ShieldCheck, Thermometer, WifiOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SectionHeading } from '../components/PageParts';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';

const fmt = (value: string | null) => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not run';

function iconFor(shortName: string) {
  if (shortName === 'C1001') return <Radio />;
  if (shortName === 'MLX90614') return <Thermometer />;
  if (shortName === 'MPU6050') return <Gauge />;
  if (shortName === 'Camera') return <Camera />;
  if (shortName === 'Main Hub') return <Cpu />;
  return <Activity />;
}

export function Health() {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const [vehicleId, setVehicleId] = useState(state.vehicles[0]?.id ?? '');
  const [running, setRunning] = useState(false);
  const vehicle = state.vehicles.find(v => v.id === vehicleId) ?? state.vehicles[0];

  const totals = useMemo(() => {
    const all = state.vehicles.flatMap(v => v.modules);
    return {
      operational: all.filter(m => m.status === 'operational' || m.status === 'standby').length,
      degraded: all.filter(m => m.status === 'degraded').length,
      offline: all.filter(m => m.status === 'offline').length,
      total: all.length
    };
  }, [state.vehicles]);

  const runDiagnostic = () => {
    if (!vehicle || running) return;
    setRunning(true);
    window.setTimeout(() => {
      dispatch({ type: 'RUN_DIAGNOSTIC', payload: { vehicleId: vehicle.id, at: new Date().toISOString() } });
      setRunning(false);
      push(vehicle.connection === 'online' ? `${vehicle.id} diagnostic complete.` : `${vehicle.id} remains offline.`);
    }, 1200);
  };

  if (!vehicle) return null;
  const percent = Math.round((totals.operational / Math.max(totals.total, 1)) * 100);

  return (
    <>
      <div className="metric-grid metric-grid--three">
        <div className="mini-stat"><div className="mini-stat__icon"><CheckCircle2 /></div><div><span>Healthy / standby states</span><strong>{percent}%</strong></div></div>
        <div className="mini-stat"><div className="mini-stat__icon mini-stat__icon--gold"><Activity /></div><div><span>Degraded modules</span><strong>{totals.degraded}</strong></div></div>
        <div className="mini-stat"><div className="mini-stat__icon mini-stat__icon--danger"><WifiOff /></div><div><span>Offline module states</span><strong>{totals.offline}</strong></div></div>
      </div>

      <section className="panel">
        <SectionHeading eyebrow="DIAGNOSTICS" title="SafeSeat hardware status" description="Inspect the final hardware stack without reintroducing sensors removed from the current prototype." action={<div className="health-actions"><select className="filter-select" value={vehicle.id} onChange={e => setVehicleId(e.target.value)}>{state.vehicles.map(v => <option key={v.id} value={v.id}>{v.id} — {v.plate}</option>)}</select><button className="button button--primary" onClick={runDiagnostic} disabled={running}><RefreshCw className={running ? 'spin' : ''} size={17} />{running ? 'Running…' : 'Run diagnostic'}</button></div>} />

        <div className="health-hero">
          <div><span className={`connection-dot connection-dot--${vehicle.connection}`} /><strong>{vehicle.id}</strong><span>{vehicle.label} • {vehicle.monitoredSeat}</span></div>
          <div><span>Last fleet diagnostic</span><strong>{fmt(state.lastDiagnosticAt)}</strong></div>
        </div>

        <div className="health-module-grid">
          {vehicle.modules.map(module => (
            <article className={`health-card health-card--${module.status}`} key={module.id}>
              <div className="health-card__head"><div className="health-card__icon">{iconFor(module.shortName)}</div><StatusBadge status={module.status} /></div>
              <h3>{module.name}</h3>
              <span className="health-card__placement">{module.placement}</span>
              <p>{module.purpose}</p>
              <div className="health-card__detail">{module.detail}</div>
              <div className="health-card__checked">Checked {fmt(module.lastChecked)}</div>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <SectionHeading eyebrow="CURRENT SENSOR ROLES" title="What each subsystem contributes" />
          <div className="role-list">
            <div><Radio /><span><strong>C1001 mmWave</strong>Provides local presence and physiological-signal context to fusion. Exact readings are not part of the Admin Module.</span></div>
            <div><Thermometer /><span><strong>MLX90614</strong>Provides local thermal context and confidence information to fusion. Exact temperature values are not exposed here.</span></div>
            <div><Activity /><span><strong>FSR arrays</strong>Backrest ×6 and cushion ×3 pressure-distribution context for occupancy and posture-related evidence.</span></div>
            <div><Gauge /><span><strong>MPU6050</strong>Road vibration/deceleration context only; not an occupant-motion or medical anomaly detector.</span></div>
            <div><Camera /><span><strong>ESP32-S3 camera</strong>Event-triggered posture verification after a sensor-fusion request.</span></div>
          </div>
        </section>
        <section className="panel">
          <SectionHeading eyebrow="PRIVACY & SAFETY" title="Expected camera state" />
          <div className="camera-standby-card"><Camera size={28} /><div><strong>Standby is healthy.</strong><p>During Normal Monitoring, the camera is not expected to stream continuously. A Standby badge therefore represents correct behavior, not degraded hardware.</p></div></div>
          <div className="notice notice--green"><ShieldCheck size={18} /><div><strong>Verification-safe behavior</strong><p>An UNKNOWN camera result must not clear a sensor-triggered verification. Only a temporally accepted upright result can support clearing, together with normalized primary-sensor evidence.</p></div></div>
        </section>
      </div>
    </>
  );
}
