import { site } from '../lib/site';

const STACK = [
  { label: 'Languages', value: 'TypeScript, Python, Go, SQL' },
  { label: 'Frontend', value: 'React, Next.js, Tailwind, Vite' },
  { label: 'Backend', value: 'Node.js, FastAPI, Django, gRPC' },
  { label: 'Data', value: 'PostgreSQL, Redis, Kafka, ClickHouse' },
  { label: 'Infra', value: 'Docker, Kubernetes, Terraform, Cloudflare' },
  { label: 'Practice', value: 'Architecture, code review, mentoring' },
];

export default function About() {
  return (
    <div className="animate-rise pt-12 sm:pt-16">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="label-mono">
          <span className="text-[var(--accent)]">~/</span> about
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{site.author.name}</h1>
        <p className="mt-3 font-mono text-sm text-[var(--fg-muted)]">{site.author.role}</p>
      </header>

      <div className="prose mt-10 max-w-2xl">
        <p>
          I'm a lead fullstack engineer. I work across the whole stack — data models, APIs, and the interfaces people
          actually touch — and most of my job is making sure those layers agree with each other under load, over time,
          and across a team.
        </p>
        <p>
          This site is my engineering notebook. I write long-form about the problems I actually hit: schema migrations
          that can't take downtime, queues that silently reorder, caches that lie, render paths that quietly cost
          seconds, and the architectural decisions that looked obvious in a design doc and much less so six months
          later.
        </p>
        <p>
          Everything here is written in markdown, rendered at build time, and served as static HTML from Cloudflare's
          edge. No tracking, no newsletter popup, no cookie banner.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="label-mono mb-4">Stack</h2>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {STACK.map((item) => (
            <div key={item.label} className="bg-[var(--bg)] px-4 py-3.5">
              <dt className="label-mono">{item.label}</dt>
              <dd className="mt-1.5 font-mono text-[13px] text-[var(--fg)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="label-mono mb-4">Contact</h2>
        <p className="text-[0.9375rem] text-[var(--fg-muted)]">
          Best reached by email at{' '}
          <a
            href={`mailto:${site.author.email}`}
            className="font-mono text-[var(--accent)] underline decoration-[color-mix(in_oklch,var(--accent)_40%,transparent)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
          >
            {site.author.email}
          </a>
          , or on the links in the footer.
        </p>
      </section>
    </div>
  );
}
