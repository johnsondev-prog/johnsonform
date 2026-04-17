const requiredServerEnv = [
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_WEBHOOK_SECRET',
  'FIVESIM_API_KEY',
  'OWLET_API_KEY',
  'OWLET_BASE_URL',
  'RESEND_API_KEY',
] as const;

export function App() {
  return (
    <main className="container">
      <h1>Owlet Connect Platform Starter</h1>
      <p>
        Vite + Clerk frontend is configured for deployment on Vercel. Provider keys stay server-side in Vercel
        environment variables.
      </p>

      <section>
        <h2>Deployment checks</h2>
        <ul>
          <li>Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> for production auth UI.</li>
          <li>
            Configure required server env vars: <code>{requiredServerEnv.join(', ')}</code>.
          </li>
          <li>
            Verify health route after deploy: <code>/api/health</code>.
          </li>
          <li>
            Verify env checks after deploy: <code>/api/env-check</code>.
          </li>
        </ul>
      </section>
    </main>
  );
}
