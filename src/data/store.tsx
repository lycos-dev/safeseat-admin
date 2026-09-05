import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { seedState } from './demoSeed';
import type { Account, AdminSettings, IncidentStatus, SafeSeatState, Vehicle } from '../types';

type Action =
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'TOGGLE_ACCOUNT'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'SET_INCIDENT_STATUS'; payload: { id: string; status: IncidentStatus; resolution?: string } }
  | { type: 'RUN_DIAGNOSTIC'; payload: { vehicleId: string; at: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AdminSettings> }
  | { type: 'RESET' };

const STORAGE_KEY = 'safeseat-admin-state-v1.2';
const RETIRED_STORAGE_KEYS = ['safeseat-admin-state-v1.1', 'safeseat-admin-state-v1'];

/**
 * The admin data contract deliberately excludes exact physiological readings.
 * This sanitizer also strips fields that may remain in older prototype state.
 */
function sanitizeState(input: unknown): SafeSeatState {
  const candidate = (input && typeof input === 'object' ? input : seedState) as Partial<SafeSeatState> & Record<string, unknown>;
  const fallback = seedState;

  const vehicles = Array.isArray(candidate.vehicles) ? candidate.vehicles.map(raw => {
    const v = raw as Vehicle & Record<string, unknown>;
    const { heartRate: _heartRate, respirationRate: _respirationRate, objectTemperature: _objectTemperature, ...safeVehicle } = v;
    return safeVehicle as Vehicle;
  }) : fallback.vehicles;

  const settingsRaw = (candidate.settings && typeof candidate.settings === 'object' ? candidate.settings : fallback.settings) as Partial<AdminSettings> & Record<string, unknown>;
  const settings: AdminSettings = {
    criticalNotifications: typeof settingsRaw.criticalNotifications === 'boolean' ? settingsRaw.criticalNotifications : fallback.settings.criticalNotifications,
    resolvedNotifications: typeof settingsRaw.resolvedNotifications === 'boolean' ? settingsRaw.resolvedNotifications : fallback.settings.resolvedNotifications,
    healthWarnings: typeof settingsRaw.healthWarnings === 'boolean' ? settingsRaw.healthWarnings : fallback.settings.healthWarnings,
    compactDensity: typeof settingsRaw.compactDensity === 'boolean' ? settingsRaw.compactDensity : fallback.settings.compactDensity
  };

  return {
    accounts: Array.isArray(candidate.accounts) ? candidate.accounts : fallback.accounts,
    vehicles,
    incidents: Array.isArray(candidate.incidents) ? candidate.incidents : fallback.incidents,
    settings,
    lastDiagnosticAt: typeof candidate.lastDiagnosticAt === 'string' || candidate.lastDiagnosticAt === null ? candidate.lastDiagnosticAt : fallback.lastDiagnosticAt
  };
}

function loadState(): SafeSeatState {
  try {
    // V1.1 demo state contained example exact readings. Remove those retired stores on upgrade.
    RETIRED_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : sanitizeState(seedState);
  } catch {
    return sanitizeState(seedState);
  }
}

function reducer(state: SafeSeatState, action: Action): SafeSeatState {
  switch (action.type) {
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [action.payload, ...state.accounts] };
    case 'TOGGLE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(a => a.id === action.payload ? { ...a, status: a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : a)
      };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [action.payload, ...state.vehicles] };
    case 'SET_INCIDENT_STATUS':
      return {
        ...state,
        incidents: state.incidents.map(i => i.id === action.payload.id ? {
          ...i,
          status: action.payload.status,
          resolution: action.payload.resolution ?? i.resolution
        } : i)
      };
    case 'RUN_DIAGNOSTIC': {
      const checked = action.payload.at;
      return {
        ...state,
        lastDiagnosticAt: checked,
        vehicles: state.vehicles.map(v => {
          if (v.id !== action.payload.vehicleId) return v;
          if (v.connection === 'offline') {
            return { ...v, modules: v.modules.map(m => ({ ...m, status: 'offline', lastChecked: checked, detail: m.shortName === 'Main Hub' ? 'No heartbeat from Main Hub.' : 'Unavailable while Main Hub is offline.' })) };
          }
          return {
            ...v,
            modules: v.modules.map(m => ({
              ...m,
              status: m.shortName === 'Camera' && v.camera === 'Standby' ? 'standby' : 'operational',
              lastChecked: checked,
              detail: m.shortName === 'Camera' && v.camera === 'Standby'
                ? 'Standby is expected during normal monitoring. Camera is not continuously active.'
                : 'Diagnostic response received. No occupant physiological values are included in this admin diagnostic.'
            }))
          };
        })
      };
    }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'RESET':
      return sanitizeState(seedState);
    default:
      return state;
  }
}

interface StoreValue {
  state: SafeSeatState;
  dispatch: Dispatch<Action>;
  accountById: (id: string | null) => Account | undefined;
  vehicleById: (id: string) => Vehicle | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state)));
  }, [state]);

  const value = useMemo<StoreValue>(() => ({
    state,
    dispatch,
    accountById: id => state.accounts.find(a => a.id === id),
    vehicleById: id => state.vehicles.find(v => v.id === id)
  }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
