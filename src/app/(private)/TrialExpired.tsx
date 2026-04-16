export default function TrialExpired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Trial Expired</h1>
        <p className="text-muted-foreground">
          Your trial period has ended. Please contact us to continue using
          Mapped.
        </p>
        <a
          href="mailto:hello@commonknowledge.coop"
          className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Get in touch
        </a>
      </div>
    </div>
  );
}
