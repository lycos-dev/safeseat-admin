import { AlertTriangle, Camera, CheckCircle2, Download, FileWarning, Filter, MessageSquareText, Search, ShieldCheck } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { OccupantLabel } from '../components/OccupantLabel';
import { SectionHeading } from '../components/PageParts';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useStore } from '../data/store';
import type { Incident, IncidentStatus } from '../types';
import { occupantDisplayName, occupantSearchText } from '../utils/occupant';

const fmt = (value: string) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const fmtClock = (value: string) => new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(value));

export function Incidents() {
  const { state, dispatch, accountById } = useStore();
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | IncidentStatus>('All');
  const [selected, setSelected] = useState<Incident | null>(null);


  const trend = useMemo(() => {
    if (!state.incidents.length) return [];
    const end = new Date(Math.max(...state.incidents.map(i => +new Date(i.occurredAt))));
    end.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(end);
      day.setDate(end.getDate() - (6 - index));
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const items = state.incidents.filter(i => { const d = new Date(i.occurredAt); return d >= day && d < next; });
      return { label: new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(day), count: items.length, escalated: items.filter(i => i.status === 'ESCALATED').length };
    });
  }, [state.incidents]);

  const heatmap = useMemo(() => {
    const slots = ['00–05', '06–11', '12–17', '18–23'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const cells = days.flatMap((day, dayIndex) => slots.map((slot, slotIndex) => {
      const count = state.incidents.filter(i => {
        const d = new Date(i.occurredAt);
        const jsDay = d.getDay() === 0 ? 6 : d.getDay() - 1;
        return jsDay === dayIndex && Math.floor(d.getHours() / 6) === slotIndex;
      }).length;
      return { day, slot, count };
    }));
    return { days, slots, cells, max: Math.max(1, ...cells.map(c => c.count)) };
  }, [state.incidents]);
  const filtered = useMemo(() => state.incidents.filter(incident => {
    const occupant = occupantSearchText(incident.occupant, accountById);
    const haystack = `${incident.id} ${incident.vehicleId} ${incident.category} ${occupant}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'All' || incident.status === status);
  }), [state.incidents, query, status, accountById]);

  const resolveIncident = (incident: Incident) => {
    dispatch({ type: 'SET_INCIDENT_STATUS', payload: { id: incident.id, status: 'RESOLVED', resolution: 'Reviewed by administrator and marked resolved.' } });
    setSelected({ ...incident, status: 'RESOLVED', resolution: 'Reviewed by administrator and marked resolved.' });
    push(`${incident.id} marked resolved.`);
  };

  const exportCsv = () => {
    const rows = [
      ['Incident ID', 'Occurred At', 'Vehicle', 'Seat', 'Occupant', 'Category', 'Posture', 'Peak State', 'Status', 'SMS Escalated', 'Resolution'],
      ...filtered.map(i => [i.id, i.occurredAt, i.vehicleId, i.seat, occupantDisplayName(i.occupant, accountById), i.category, i.posture, i.stateAtPeak, i.status, i.smsEscalated ? 'Yes' : 'No', i.resolution])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeseat-incidents-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push('Incident CSV exported.');
  };

  return (
    <div className="screen screen--incidents">
      <div className="metric-grid metric-grid--three">
        <div className="mini-stat"><div className="mini-stat__icon mini-stat__icon--danger"><AlertTriangle /></div><div><span>Escalated</span><strong>{state.incidents.filter(i => i.status === 'ESCALATED').length}</strong></div></div>
        <div className="mini-stat"><div className="mini-stat__icon"><CheckCircle2 /></div><div><span>Resolved</span><strong>{state.incidents.filter(i => i.status === 'RESOLVED').length}</strong></div></div>
        <div className="mini-stat"><div className="mini-stat__icon mini-stat__icon--gold"><ShieldCheck /></div><div><span>Auto-cleared</span><strong>{state.incidents.filter(i => i.status === 'CLEARED').length}</strong></div></div>
      </div>

      <div className="dashboard-grid incident-analytics">
        <section className="panel">
          <SectionHeading eyebrow="INCIDENT TRENDS" title="Recent safety-event volume" description="Seven-day view anchored to the most recent recorded incident." />
          <div className="bar-chart" aria-label="Seven-day incident trend">
            {trend.map(day => {
              const max = Math.max(1, ...trend.map(d => d.count));
              const height = Math.max(day.count ? 18 : 3, (day.count / max) * 100);
              return <div className="bar-chart__col" key={day.label}><div className="bar-chart__value">{day.count}</div><div className="bar-chart__track"><div className={`bar-chart__bar ${day.escalated ? 'bar-chart__bar--critical' : ''}`} style={{ height: `${height}%` }} /></div><span>{day.label}</span></div>;
            })}
          </div>
        </section>
        <section className="panel">
          <SectionHeading eyebrow="INCIDENT HEATMAP" title="Day and time concentration" description="Safety-event density grouped into six-hour windows." />
          <div className="heatmap">
            <div className="heatmap__corner" />
            {heatmap.slots.map(slot => <div className="heatmap__slot" key={slot}>{slot}</div>)}
            {heatmap.days.map(day => <Fragment key={day}>
              <div className="heatmap__day" key={`${day}-label`}>{day}</div>
              {heatmap.slots.map(slot => {
                const cell = heatmap.cells.find(c => c.day === day && c.slot === slot)!;
                const level = cell.count === 0 ? 0 : Math.ceil((cell.count / heatmap.max) * 4);
                return <div key={`${day}-${slot}`} className={`heatmap__cell heatmap__cell--${level}`} title={`${day} ${slot}: ${cell.count} incident(s)`}>{cell.count || ''}</div>;
              })}
            </Fragment>)}
          </div>
          <div className="heatmap__legend"><span>Less</span>{[0,1,2,3,4].map(level => <i key={level} className={`heatmap__cell heatmap__cell--${level}`} />)}<span>More</span></div>
        </section>
      </div>

      <section className="panel">
        <SectionHeading eyebrow="SAFETY EVENT HISTORY" title="Incident audit trail" description="Review the evidence path from primary-sensor suspicion through optional posture verification and the final fusion outcome." action={<button className="button button--secondary" onClick={exportCsv}><Download size={17} />Export CSV</button>} />
        <div className="toolbar">
          <div className="search-box"><Search size={17} /><input placeholder="Search incident, vehicle, category, occupant…" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="toolbar__filters"><Filter size={16} /><select className="filter-select" value={status} onChange={e => setStatus(e.target.value as typeof status)}><option>All</option><option>ESCALATED</option><option>RESOLVED</option><option>CLEARED</option></select></div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date & time</th><th>Incident</th><th>Vehicle / seat</th><th>Occupant</th><th>Category</th><th>Camera posture</th><th>Outcome</th><th></th></tr></thead>
            <tbody>{filtered.map(incident => (
              <tr key={incident.id}>
                <td className="muted">{fmt(incident.occurredAt)}</td>
                <td><strong>{incident.id}</strong></td>
                <td><div className="stacked-cell"><strong>{incident.vehicleId}</strong><span>{incident.seat}</span></div></td>
                <td><OccupantLabel occupant={incident.occupant} /></td>
                <td>{incident.category}</td>
                <td><span className="camera-state"><Camera size={14} />{incident.posture}</span></td>
                <td><StatusBadge status={incident.status} /></td>
                <td><button className="text-button" onClick={() => setSelected(incident)}>View trace</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ?? ''} eyebrow={selected ? `${selected.vehicleId} • ${fmt(selected.occurredAt)}` : undefined} size="lg">
        {selected && (
          <div className="incident-detail">
            <div className="incident-summary-grid">
              <div className="summary-block"><span>Outcome</span><StatusBadge status={selected.status} /></div>
              <div className="summary-block"><span>Peak system state</span><StatusBadge status={selected.stateAtPeak} /></div>
              <div className="summary-block"><span>Monitored seat</span><strong>{selected.seat}</strong></div>
              <div className="summary-block"><span>Occupant</span><OccupantLabel occupant={selected.occupant} /></div>
              <div className="summary-block"><span>Camera posture</span><strong>{selected.posture}</strong></div>
              <div className="summary-block"><span>Emergency SMS</span><strong>{selected.smsEscalated ? 'Dispatched' : 'Not dispatched'}</strong></div>
            </div>

            <div className="notice notice--subtle"><FileWarning size={18} /><div><strong>{selected.category}</strong><p>{selected.triggerSummary}</p></div></div>

            <div className="section-heading section-heading--small"><div><span className="eyebrow">EVENT TRACE</span><h3>How SafeSeat reached this outcome</h3></div></div>
            <div className="timeline">
              {selected.timeline.map((event, idx) => (
                <div className="timeline__item" key={`${event.time}-${idx}`}>
                  <div className="timeline__rail"><span className="timeline__dot" />{idx !== selected.timeline.length - 1 && <span className="timeline__line" />}</div>
                  <div className="timeline__content"><span>{fmtClock(event.time)}</span><strong>{event.title}</strong><p>{event.description}</p></div>
                </div>
              ))}
            </div>

            <div className="incident-resolution"><MessageSquareText size={18} /><div><span>Resolution note</span><p>{selected.resolution}</p></div></div>
            <div className="notice notice--green"><Camera size={18} /><div><strong>Camera is corroborative, not decisive</strong><p>Posture classification is shown because it may support a verification event. The final emergency state belongs to SafeSeat's sensor-fusion logic, not the camera classifier by itself.</p></div></div>

            <div className="modal-actions">
              <button className="button button--ghost" onClick={() => setSelected(null)}>Close</button>
              {selected.status === 'ESCALATED' && <button className="button button--primary" onClick={() => resolveIncident(selected)}><CheckCircle2 size={17} />Mark resolved</button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
