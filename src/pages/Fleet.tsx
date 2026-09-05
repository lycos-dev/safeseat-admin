import { Activity, Camera, CarFront, Plus, Search, ShieldCheck, UserRound, Wifi, WifiOff } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { OccupantLabel } from '../components/OccupantLabel';
import { Field, SectionHeading } from '../components/PageParts';
import { StatusBadge } from '../components/StatusBadge';
import { VehicleDetail } from '../components/VehicleDetail';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';
import type { SensorModule, Vehicle } from '../types';

const nowIso = () => new Date().toISOString();

function defaultModules(vehicleId: string): SensorModule[] {
  const at = nowIso();
  return [
    { id: `${vehicleId}-hub`, name: 'SafeSeat Main Hub', shortName: 'Main Hub', placement: 'Central controller', purpose: 'Sensor fusion, state management, and system coordination.', status: 'operational', lastChecked: at, detail: 'Ready for telemetry integration.' },
    { id: `${vehicleId}-c1001`, name: 'C1001 mmWave Radar', shortName: 'C1001', placement: 'Front-facing, approximately 0.8–1.0 m from occupant', purpose: 'Local presence and physiological-signal context for SafeSeat fusion; exact readings are not exposed to administrators.', status: 'operational', lastChecked: at, detail: 'Ready for telemetry integration.' },
    { id: `${vehicleId}-mlx`, name: 'MLX90614 IR Temperature', shortName: 'MLX90614', placement: 'Headrest', purpose: 'Local non-contact thermal context for SafeSeat fusion; exact temperature values are not exposed to administrators.', status: 'operational', lastChecked: at, detail: 'Ready for telemetry integration.' },
    { id: `${vehicleId}-back-fsr`, name: 'Backrest FSR Array ×6', shortName: 'Backrest FSR', placement: 'Backrest overlay', purpose: 'Pressure-distribution and posture-context sensing.', status: 'operational', lastChecked: at, detail: 'Ready for telemetry integration.' },
    { id: `${vehicleId}-cush-fsr`, name: 'Cushion FSR Array ×3', shortName: 'Cushion FSR', placement: 'Seat cushion overlay', purpose: 'Seat occupancy and lower-body pressure context.', status: 'operational', lastChecked: at, detail: 'Ready for telemetry integration.' },
    { id: `${vehicleId}-mpu`, name: 'MPU6050 IMU', shortName: 'MPU6050', placement: 'Seat frame', purpose: 'Road vibration and deceleration context.', status: 'operational', lastChecked: at, detail: 'Ready for telemetry integration.' },
    { id: `${vehicleId}-cam`, name: 'ESP32-S3 Camera', shortName: 'Camera', placement: 'Front-facing cabin view', purpose: 'Event-based posture verification only.', status: 'standby', lastChecked: at, detail: 'Standby is expected until verification is requested.' }
  ];
}

export function Fleet() {
  const { state, dispatch, accountById } = useStore();
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ id: '', plate: '', label: '', seat: 'Front Passenger', hubId: '' });

  const filtered = useMemo(() => state.vehicles.filter(v => {
    const driver = accountById(v.driverId)?.name ?? '';
    const occupant = v.occupant?.kind === 'registered'
      ? accountById(v.occupant.accountId)?.name ?? ''
      : v.occupant?.kind === 'guest' ? `${v.occupant.displayName ?? 'Guest'} ${v.occupant.sessionId}` : '';
    return `${v.id} ${v.plate} ${v.label} ${v.hubId} ${driver} ${occupant}`.toLowerCase().includes(query.toLowerCase());
  }), [state.vehicles, query, accountById]);

  const addVehicle = (event: FormEvent) => {
    event.preventDefault();
    const id = form.id.trim().toUpperCase();
    if (!id || !form.plate.trim() || !form.label.trim() || !form.hubId.trim()) return;
    if (state.vehicles.some(v => v.id === id)) {
      push('Vehicle ID already exists.');
      return;
    }
    const vehicle: Vehicle = {
      id,
      plate: form.plate.trim().toUpperCase(),
      label: form.label.trim(),
      driverId: null,
      monitoredSeat: form.seat,
      occupant: null,
      hubId: form.hubId.trim().toUpperCase(),
      connection: 'online',
      state: 'NORMAL',
      camera: 'Standby',
      lastUpdate: nowIso(),
      modules: defaultModules(id)
    };
    dispatch({ type: 'ADD_VEHICLE', payload: vehicle });
    setAddOpen(false);
    setForm({ id: '', plate: '', label: '', seat: 'Front Passenger', hubId: '' });
    push(`${id} registered.`);
  };

  return (
    <>
      <section className="panel">
        <SectionHeading eyebrow="REGISTERED UNITS" title="Vehicle and monitored-seat registry" description="Each SafeSeat unit maps one vehicle, one Main Hub, one monitored seat, and the active occupant session. A session can belong to a registered occupant or a guest." action={<button className="button button--primary" onClick={() => setAddOpen(true)}><Plus size={17} />Register vehicle</button>} />
        <div className="toolbar">
          <div className="search-box"><Search size={17} /><input placeholder="Search vehicle, plate, hub, driver, or occupant…" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="toolbar__meta">{filtered.length} of {state.vehicles.length} vehicles</div>
        </div>

        <div className="fleet-grid">
          {filtered.map(vehicle => {
            const driver = accountById(vehicle.driverId);
            const issueCount = vehicle.modules.filter(m => m.status === 'degraded' || m.status === 'offline').length;
            return (
              <article className="fleet-card" key={vehicle.id}>
                <div className="fleet-card__header">
                  <div className="fleet-card__vehicle-icon"><CarFront /></div>
                  <div className="fleet-card__title"><span>{vehicle.id}</span><strong>{vehicle.label}</strong><small>{vehicle.plate}</small></div>
                  <StatusBadge status={vehicle.state} />
                </div>
                <div className="fleet-card__connection">{vehicle.connection === 'online' ? <><Wifi size={16} />Online</> : <><WifiOff size={16} />Offline</>}<span>Hub {vehicle.hubId}</span></div>
                <div className="fleet-card__chain">
                  <div><span>Monitored seat</span><strong>{vehicle.monitoredSeat}</strong></div>
                  <div className="fleet-card__occupant"><span>Occupant</span><OccupantLabel occupant={vehicle.occupant} compact /></div>
                  <div><span>Driver</span><strong>{driver?.name ?? 'Not assigned'}</strong></div>
                </div>
                <div className="fleet-card__footer">
                  <div className={`health-summary ${issueCount ? 'health-summary--warn' : ''}`}><Activity size={16} /><span>{issueCount ? `${issueCount} module issue${issueCount > 1 ? 's' : ''}` : 'Hardware nominal'}</span></div>
                  <div className="camera-mini"><Camera size={15} />{vehicle.camera}</div>
                </div>
                <button className="button button--secondary button--full" onClick={() => setSelected(vehicle)}>View SafeSeat unit</button>
              </article>
            );
          })}
        </div>
      </section>

      <div className="notice notice--green notice--page"><ShieldCheck size={18} /><div><strong>Guest occupants are session-only</strong><p>A guest does not need to appear in Account Management. The active session is identified as Guest, while registered occupants remain linked to their account. This keeps the admin view aligned with how SafeSeat may be used by passengers who do not have a registered account.</p></div></div>

      <VehicleDetail vehicle={selected} onClose={() => setSelected(null)} />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register SafeSeat vehicle" eyebrow="FLEET SETUP">
        <form onSubmit={addVehicle} className="form-stack">
          <div className="form-grid">
            <Field label="Vehicle ID"><input placeholder="SS-V05" value={form.id} onChange={e => setForm(x => ({ ...x, id: e.target.value }))} required /></Field>
            <Field label="Plate / identifier"><input placeholder="ABC 1234" value={form.plate} onChange={e => setForm(x => ({ ...x, plate: e.target.value }))} required /></Field>
          </div>
          <Field label="Vehicle label"><input placeholder="Fleet Unit 05" value={form.label} onChange={e => setForm(x => ({ ...x, label: e.target.value }))} required /></Field>
          <div className="form-grid">
            <Field label="Monitored seat"><select value={form.seat} onChange={e => setForm(x => ({ ...x, seat: e.target.value }))}><option>Front Passenger</option><option>Driver</option><option>Rear Left</option><option>Rear Center</option><option>Rear Right</option></select></Field>
            <Field label="Main Hub ID"><input placeholder="HUB-XXXX" value={form.hubId} onChange={e => setForm(x => ({ ...x, hubId: e.target.value }))} required /></Field>
          </div>
          <div className="notice notice--subtle"><UserRound size={17} /><div><strong>Session assignment stays outside vehicle registration</strong><p>Vehicle registration creates the hardware relationship. The SafeSeat deployment/session flow should provide whether the current occupant is registered or a guest.</p></div></div>
          <div className="modal-actions"><button type="button" className="button button--ghost" onClick={() => setAddOpen(false)}>Cancel</button><button type="submit" className="button button--primary"><Plus size={17} />Register vehicle</button></div>
        </form>
      </Modal>
    </>
  );
}
