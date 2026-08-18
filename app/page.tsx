const links = [
  { href: 'https://github.com/bdaskbot-maker/sst-dev-merged', label: 'GitHub' },
  { href: 'https://sst.dev/docs', label: 'Documentation' },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 md:px-10">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <a href="/" className="font-mono text-sm font-semibold tracking-tight">sst-dev</a>
          <nav aria-label="Project links" className="flex items-center gap-5 text-sm text-muted-foreground">
            {links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        <section className="flex flex-1 flex-col justify-center py-20 md:max-w-4xl md:py-28">
          <p className="mb-6 font-mono text-sm font-medium text-primary">Open-source infrastructure for TypeScript</p>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Build and ship on your cloud.
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            A merged SST developer repository with examples, infrastructure primitives, and the building blocks for deploying modern applications.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="https://sst.dev/docs" target="_blank" rel="noreferrer" className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Read the docs
            </a>
            <a href="https://github.com/bdaskbot-maker/sst-dev-merged" target="_blank" rel="noreferrer" className="rounded-md border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted">
              Explore the repository
            </a>
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <p>Source, examples, and deployment patterns in one place.</p>
        </footer>
      </div>
    </main>
  )
}
