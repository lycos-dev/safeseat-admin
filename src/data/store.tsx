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

const STORAGE_KEY = 'safeseat-admin-state-v1.1';

function loadState(): SafeSeatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SafeSeatState : seedState;
  } catch {
    return seedState;
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
                : 'Diagnostic response received.'
            }))
          };
        })
      };
    }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'RESET':
      return seedState;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
