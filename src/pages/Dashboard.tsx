import { Activity, AlertTriangle, ArrowRight, Camera, CarFront, Radio, ShieldCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DonutChart } from '../components/DonutChart';
import { MetricCard } from '../components/MetricCard';
import { OccupantLabel } from '../components/OccupantLabel';
import { SectionHeading } from '../components/PageParts';
import { StatusBadge } from '../components/StatusBadge';
import { VehicleDetail } from '../components/VehicleDetail';
import { useStore } from '../data/store';
import type { Vehicle } from '../types';
import { isOccupied } from '../utils/occupant';

const fmtTime = (value: string) => new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const fmtDateTime = (value: string) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export function Dashboard() {
  const { state, vehicleById } = useStore();
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const navigate = useNavigate();
  const escalated = state.incidents.filter(i => i.status === 'ESCALATED');
  const online = state.vehicles.filter(v => v.connection === 'online').length;
  const live = state.vehicles.filter(v => v.connection === 'online' && isOccupied(v.occupant)).length;
  const guestSessions = state.vehicles.filter(v => v.connection === 'online' && v.occupant?.kind === 'guest').length;
  const allModules = state.vehicles.flatMap(v => v.modules);
  const degraded = allModules.filter(m => m.status === 'degraded' || m.status === 'offline').length;
  const fleetHealth = allModules.length
    ? Math.round((allModules.filter(m => m.status === 'operational' || m.status === 'standby').length / allModules.length) * 100)
    : 100;

  const distribution = useMemo(() => ({
    normal: state.vehicles.filter(v => v.state === 'NORMAL' || v.state === 'CLEARED').length,
    warning: state.vehicles.filter(v => v.state === 'SUSPECTED' || v.state === 'VERIFYING').length,
    critical: state.vehicles.filter(v => v.state === 'EMERGENCY').length
  }), [state.vehicles]);

  const recentEvents = state.incidents
    .flatMap(incident => incident.timeline.slice(-1).map(event => ({ ...event, incidentId: incident.id, vehicleId: incident.vehicleId, status: incident.status })))
    .sort((a, b) => +new Date(b.time) - +new Date(a.time))
    .slice(0, 5);

  return (
    <div className="screen screen--dashboard">
      {state.settings.criticalNotifications && escalated.length > 0 && (
        <button className="critical-banner" onClick={() => navigate('/incidents')}>
          <div className="critical-banner__icon"><AlertTriangle /></div>
          <div className="critical-banner__copy"><strong>{escalated.length} incident requires review</strong><span>{escalated[0].vehicleId} • {escalated[0].category} • {fmtDateTime(escalated[0].occurredAt)}</span></div>
          <div className="critical-banner__action">Review incident <ArrowRight size={17} /></div>
        </button>
      )}

      <div className="metric-grid">
        <MetricCard icon={CarFront} label="Registered vehicles" value={state.vehicles.length} detail={`${online} currently online`} />
        <MetricCard icon={Users} label="Live sessions" value={live} detail={guestSessions ? `${guestSessions} guest session${guestSessions > 1 ? 's' : ''} active` : 'Occupied monitored seats'} tone="gold" />
        <MetricCard icon={AlertTriangle} label="Escalated incidents" value={escalated.length} detail="Administrator attention required" tone={escalated.length ? 'red' : 'green'} />
        <MetricCard icon={Activity} label="Fleet hardware health" value={`${fleetHealth}%`} detail={`${degraded} degraded/offline module states`} tone={degraded ? 'gold' : 'green'} />
      </div>

      <section className="panel dashboard-live-panel">
        <SectionHeading eyebrow="LIVE MONITOR" title="Active SafeSeat sessions" description="Administrative status only: vehicle, monitored seat, occupant session, fusion state, and event-based camera state. Exact physiological readings are intentionally excluded." action={<button className="text-button" onClick={() => navigate('/fleet')}>Manage fleet <ArrowRight size={16} /></button>} />
        <div className="dashboard-live-grid">
          <div className="dashboard-live-main">
            <div className="table-wrap">
              <table className="data-table data-table--sessions">
                <thead><tr><th>Vehicle</th><th>Monitored seat</th><th>Occupant</th><th>Fusion state</th><th>Camera</th><th>Updated</th></tr></thead>
                <tbody>
                  {state.vehicles.map(vehicle => (
                    <tr key={vehicle.id} className="clickable-row" onClick={() => setSelected(vehicle)}>
                      <td><div className="table-primary"><span className={`connection-dot connection-dot--${vehicle.connection}`} /><div><strong>{vehicle.id}</strong><span>{vehicle.plate}</span></div></div></td>
                      <td>{vehicle.monitoredSeat}</td>
                      <td><OccupantLabel occupant={vehicle.occupant} /></td>
                      <td><StatusBadge status={vehicle.state} /></td>
                      <td><span className={`camera-state camera-state--${vehicle.camera.toLowerCase()}`}><Camera size={14} />{vehicle.camera}</span></td>
                      <td className="muted">{fmtTime(vehicle.lastUpdate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="privacy-inline"><ShieldCheck size={15} /><span>Admin telemetry contract: derived system states only. Raw HR, RR, temperature, pressure values, and camera frames are not displayed or persisted in this dashboard.</span></div>
          </div>

          <aside className="dashboard-state-card">
            <div className="dashboard-state-card__head"><span className="eyebrow">FLEET STATE</span><h3>Monitoring distribution</h3><p>Current runtime state across registered SafeSeat units.</p></div>
            <DonutChart normal={distribution.normal} warning={distribution.warning} critical={distribution.critical} />
          </aside>
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--balanced">
        <section className="panel dashboard-design-panel">
          <SectionHeading eyebrow="SYSTEM DESIGN" title="Verification is event-based" description="The camera participates only when the sensor-fusion flow requests posture context." />
          <div className="flow-strip">
            <div className="flow-node flow-node--active"><Radio /><strong>Primary sensors</strong><span>Continuous local monitoring</span></div>
            <ArrowRight className="flow-arrow" />
            <div className="flow-node"><AlertTriangle /><strong>Suspected</strong><span>Fusion requests context</span></div>
            <ArrowRight className="flow-arrow" />
            <div className="flow-node"><Camera /><strong>Camera verify</strong><span>Posture evidence only</span></div>
            <ArrowRight className="flow-arrow" />
            <div className="flow-node"><ShieldCheck /><strong>Fusion decision</strong><span>Clear or escalate</span></div>
          </div>
          <div className="notice notice--green"><ShieldCheck size={18} /><div><strong>Privacy-preserving admin view</strong><p>The dashboard receives operational states and incident outcomes, not exact physiological readings. Camera posture remains supporting evidence and does not independently determine an emergency.</p></div></div>
        </section>

        <section className="panel dashboard-activity-panel">
          <SectionHeading eyebrow="RECENT ACTIVITY" title="Latest safety events" action={<button className="text-button" onClick={() => navigate('/incidents')}>All incidents <ArrowRight size={16} /></button>} />
          <div className="activity-list">
            {recentEvents.map(event => {
              const vehicle = vehicleById(event.vehicleId);
              return <button className="activity-item" key={`${event.incidentId}-${event.time}`} onClick={() => navigate('/incidents')}><span className={`activity-dot activity-dot--${event.status.toLowerCase()}`} /><div><strong>{event.title}</strong><span>{event.vehicleId} • {vehicle?.monitoredSeat ?? ''} • {fmtDateTime(event.time)}</span></div><ArrowRight size={16} /></button>;
            })}
          </div>
        </section>
      </div>

      <VehicleDetail vehicle={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
