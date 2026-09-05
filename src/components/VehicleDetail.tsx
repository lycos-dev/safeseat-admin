import { Activity, Camera, Gauge, LockKeyhole, Radio, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
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
      <div className="detail-grid detail-grid--privacy">
        <div className="detail-card detail-card--accent">
          <div className="detail-card__top"><span>Monitoring state</span><StatusBadge status={vehicle.state} /></div>
          <h3>{vehicle.monitoredSeat}</h3>
          <div className="detail-occupant-row"><OccupantLabel occupant={vehicle.occupant} /><span>Driver: <strong>{driver?.name ?? 'Unassigned'}</strong></span></div>
          <div className="chain"><span>Vehicle</span><b>→</b><span>{vehicle.hubId}</span><b>→</b><span>{vehicle.monitoredSeat}</span><b>→</b><span title={occupantMeta}>{occupantName}</span></div>
        </div>

        <div className="safe-tile"><div className="safe-tile__icon"><ShieldCheck /></div><span>Fusion state</span><strong>{vehicle.state}</strong><small>Derived system state only</small></div>
        <div className="safe-tile"><div className="safe-tile__icon"><Camera /></div><span>Camera</span><strong>{vehicle.camera}</strong><small>Event-based verification</small></div>
        <div className="safe-tile"><div className="safe-tile__icon">{vehicle.connection === 'online' ? <Wifi /> : <WifiOff />}</div><span>Hub connection</span><strong>{vehicle.connection === 'online' ? 'Online' : 'Offline'}</strong><small>{vehicle.hubId}</small></div>
        <div className="safe-tile safe-tile--privacy"><div className="safe-tile__icon"><LockKeyhole /></div><span>Physiological data</span><strong>Not exposed</strong><small>No exact readings in admin state</small></div>
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
      <div className="notice notice--green"><LockKeyhole size={18} /><div><strong>Privacy boundary</strong><p>Exact heart rate, respiration rate, temperature, pressure readings, and camera frames are intentionally outside the Admin Module. Administrators see only operational health, derived SafeSeat states, posture-verification outcomes when requested, and incident status.</p></div></div>
    </Modal>
  );
}
