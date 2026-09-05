import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Accounts } from './pages/Accounts';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Health } from './pages/Health';
import { Incidents } from './pages/Incidents';
import { Login } from './pages/Login';
import { SettingsPage } from './pages/Settings';

function ProtectedLayout() {
  const location = useLocation();
  const authenticated = sessionStorage.getItem('safeseat-admin-auth') === 'true';
  return authenticated ? <AppShell /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/health" element={<Health />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
