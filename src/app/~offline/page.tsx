export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Offline
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          OpsKings is temporarily offline
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The cached shell is still available, but fresh dashboard data could not be reached.
          Reconnect to sync the latest tickets, team metrics, and client analysis.
        </p>
      </div>
    </main>
  );
}
