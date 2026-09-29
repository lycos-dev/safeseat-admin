import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { runtimeConfig } from '../config/runtime';
import { useAuth } from '../auth/AuthProvider';
import { seedState } from './demoSeed';
import type { Account, AdminSettings, IncidentStatus, SafeSeatState, Vehicle } from '../types';

type Action =
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'TOGGLE_ACCOUNT'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'SET_INCIDENT_STATUS'; payload: { id: string; status: IncidentStatus; resolution?: string } }
  | { type: 'RUN_DIAGNOSTIC'; payload: { vehicleId: string; at: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AdminSettings> }
  | { type: 'REPLACE_STATE'; payload: SafeSeatState }
  | { type: 'RESET' };

type SyncStatus = 'demo' | 'connecting' | 'live' | 'error';

const STORAGE_KEY = 'safeseat-admin-state-v1.4';
const RETIRED_STORAGE_KEYS = ['safeseat-admin-state-v1.3', 'safeseat-admin-state-v1.2', 'safeseat-admin-state-v1.1', 'safeseat-admin-state-v1'];

const emptyState: SafeSeatState = {
  accounts: [],
  vehicles: [],
  incidents: [],
  settings: {
    criticalNotifications: true,
    resolvedNotifications: false,
    healthWarnings: true,
    compactDensity: false
  },
  lastDiagnosticAt: null
};

/**
 * Fixed Admin privacy contract: exact physiological readings are not part of the
 * SafeSeat Admin state. The sanitizer also strips retired prototype fields.
 */
function sanitizeState(input: unknown): SafeSeatState {
  const candidate = (input && typeof input === 'object' ? input : seedState) as Partial<SafeSeatState> & Record<string, unknown>;
  const fallback = seedState;

  const vehicles = Array.isArray(candidate.vehicles) ? candidate.vehicles.map(raw => {
    const v = raw as Vehicle & Record<string, unknown>;
    const { heartRate: _heartRate, respirationRate: _respirationRate, objectTemperature: _objectTemperature, rawSensorData: _rawSensorData, cameraFrame: _cameraFrame, ...safeVehicle } = v;
    return safeVehicle as Vehicle;
  }) : fallback.vehicles;

  const settingsRaw = (candidate.settings && typeof candidate.settings === 'object' ? candidate.settings : fallback.settings) as Partial<AdminSettings>;
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

function loadDemoState(): SafeSeatState {
  try {
    RETIRED_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : sanitizeState(seedState);
  } catch {
    return sanitizeState(seedState);
  }
}

function reducer(state: SafeSeatState, action: Action): SafeSeatState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return sanitizeState(action.payload);
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [action.payload, ...state.accounts.filter(a => a.id !== action.payload.id)] };
    case 'TOGGLE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(a => a.id === action.payload ? { ...a, status: a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : a)
      };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [action.payload, ...state.vehicles.filter(v => v.id !== action.payload.id)] };
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
      if (runtimeConfig.dataMode === 'firebase') return { ...state, lastDiagnosticAt: checked };
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
  dispatch: (action: Action) => void;
  accountById: (id: string | null) => Account | undefined;
  vehicleById: (id: string) => Vehicle | undefined;
  syncStatus: SyncStatus;
  syncError: string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { identity, authenticated } = useAuth();
  const [state, baseDispatch] = useReducer(reducer, undefined, () => runtimeConfig.dataMode === 'demo' ? loadDemoState() : emptyState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(runtimeConfig.dataMode === 'demo' ? 'demo' : 'connecting');
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (runtimeConfig.dataMode !== 'demo') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state)));
  }, [state]);

  useEffect(() => {
    if (runtimeConfig.dataMode !== 'firebase') return;
    if (!authenticated || !identity) {
      baseDispatch({ type: 'REPLACE_STATE', payload: emptyState });
      setSyncStatus('connecting');
      return;
    }

    let active = true;
    let unsubscribe = () => {};
    setSyncStatus('connecting');
    setSyncError(null);

    void import('./repositories/firebaseRepository').then(repo => {
      if (!active) return;
      unsubscribe = repo.subscribeSafeSeatState(
        identity.uid,
        nextState => {
          if (!active) return;
          baseDispatch({ type: 'REPLACE_STATE', payload: nextState });
          setSyncStatus('live');
          setSyncError(null);
        },
        error => {
          if (!active) return;
          setSyncStatus('error');
          setSyncError(error.message);
        }
      );
    }).catch(error => {
      if (!active) return;
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : String(error));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authenticated, identity]);

  const dispatch = (action: Action) => {
    const before = state;
    baseDispatch(action);
    if (runtimeConfig.dataMode !== 'firebase' || !identity) return;

    void import('./repositories/firebaseRepository').then(async repo => {
      switch (action.type) {
        case 'ADD_ACCOUNT':
          await repo.addAccount(action.payload);
          break;
        case 'TOGGLE_ACCOUNT': {
          const account = before.accounts.find(a => a.id === action.payload);
          if (account) await repo.toggleAccount(account.id, account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
          break;
        }
        case 'ADD_VEHICLE':
          await repo.addVehicle(action.payload);
          break;
        case 'SET_INCIDENT_STATUS':
          await repo.setIncidentStatus(action.payload.id, action.payload.status, action.payload.resolution);
          break;
        case 'RUN_DIAGNOSTIC':
          await repo.requestDiagnostic(action.payload.vehicleId, identity.uid);
          break;
        case 'UPDATE_SETTINGS':
          await repo.updateSettings(identity.uid, action.payload);
          break;
        case 'RESET':
        case 'REPLACE_STATE':
          break;
      }
    }).catch(error => {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : String(error));
    });
  };

  const value = useMemo<StoreValue>(() => ({
    state,
    dispatch,
    accountById: id => state.accounts.find(a => a.id === id),
    vehicleById: id => state.vehicles.find(v => v.id === id),
    syncStatus,
    syncError
  }), [state, syncStatus, syncError]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
