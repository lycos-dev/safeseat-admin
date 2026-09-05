const env = import.meta.env;

export const runtimeConfig = {
  dataMode: String(env.VITE_SAFESEAT_DATA_MODE || 'local'),
  demoAdminEmail: String(env.VITE_DEMO_ADMIN_EMAIL || 'admin@safeseat.demo'),
  demoAdminPassword: String(env.VITE_DEMO_ADMIN_PASSWORD || 'SafeSeat2026!')
} as const;
