const env = import.meta.env;

export const runtimeConfig = {
  // V1.2 is intentionally a deterministic demo-data build for UI review/manuscript figures.
  dataMode: 'demo' as const,
  demoAdminEmail: String(env.VITE_DEMO_ADMIN_EMAIL || 'admin@safeseat.demo'),
  demoAdminPassword: String(env.VITE_DEMO_ADMIN_PASSWORD || 'SafeSeat2026!')
} as const;
