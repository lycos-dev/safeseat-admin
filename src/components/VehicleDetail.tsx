import { Activity, Camera, Gauge, HeartPulse, Radio, Thermometer, Wind } from 'lucide-react';
import { useStore } from '../data/store';
import type { Vehicle } from '../types';
import { occupantDisplayName, occupantSecondaryText } from '../utils/occupant';
import { Modal } from './Modal';
import { OccupantLabel } from './OccupantLabel';
import { StatusBadge } from './StatusBadge';

const formatTime = (value: string) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function VehicleDetail({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const { accountById } = useStore();
  if (!vehicle) return null;
  const driver = accountById(vehicle.driverId);
  const occupantName = occupantDisplayName(vehicle.occupant, accountById);
  const occupantMeta = occupantSecondaryText(vehicle.occupant, accountById);

  return (
    <Modal open={!!vehicle} onClose={onClose} eyebrow={`${vehicle.id} • ${vehicle.plate}`} title={vehicle.label} size="lg">
      <div className="detail-grid">
        <div className="detail-card detail-card--accent">
          <div className="detail-card__top"><span>Monitoring state</span><StatusBadge status={vehicle.state} /></div>
          <h3>{vehicle.monitoredSeat}</h3>
          <div className="detail-occupant-row"><OccupantLabel occupant={vehicle.occupant} /><span>Driver: <strong>{driver?.name ?? 'Unassigned'}</strong></span></div>
          <div className="chain"><span>Vehicle</span><b>→</b><span>{vehicle.hubId}</span><b>→</b><span>{vehicle.monitoredSeat}</span><b>→</b><span title={occupantMeta}>{occupantName}</span></div>
        </div>
        <div className="vital-tile"><HeartPulse /><span>Heart rate</span><strong>{vehicle.heartRate ?? '—'}{vehicle.heartRate !== null ? ' bpm' : ''}</strong></div>
        <div className="vital-tile"><Wind /><span>Respiration</span><strong>{vehicle.respirationRate ?? '—'}{vehicle.respirationRate !== null ? ' rpm' : ''}</strong></div>
        <div className="vital-tile"><Thermometer /><span>Object temp</span><strong>{vehicle.objectTemperature ?? '—'}{vehicle.objectTemperature !== null ? ' °C' : ''}</strong></div>
        <div className="vital-tile"><Camera /><span>Camera</span><strong>{vehicle.camera}</strong></div>
      </div>

      <div className="section-heading section-heading--small"><div><span className="eyebrow">Hardware path</span><h3>Module status</h3></div><span className="muted">Updated {formatTime(vehicle.lastUpdate)}</span></div>
      <div className="module-list module-list--compact">
        {vehicle.modules.map(module => (
          <div className="module-row" key={module.id}>
            <div className="module-row__icon">{module.shortName === 'C1001' ? <Radio /> : module.shortName === 'Camera' ? <Camera /> : module.shortName === 'MPU6050' ? <Gauge /> : <Activity />}</div>
            <div className="module-row__body"><strong>{module.name}</strong><span>{module.placement}</span><small>{module.detail}</small></div>
            <StatusBadge status={module.status} />
          </div>
        ))}
      </div>
      <div className="notice notice--green"><Camera size={18} /><div><strong>Privacy-first camera behavior</strong><p>The camera remains on standby during normal monitoring and is requested only when sensor fusion needs posture verification. Camera posture is supporting evidence; it does not diagnose or independently declare an emergency.</p></div></div>
    </Modal>
  );
}
