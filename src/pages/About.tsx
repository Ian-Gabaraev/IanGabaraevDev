import { site } from '../lib/site';

const STACK = [
  { label: 'Languages', value: 'TypeScript, Python, Go, SQL' },
  { label: 'Frontend', value: 'React, Next.js, Tailwind, Vite' },
  { label: 'Backend', value: 'Node.js, FastAPI, Django, gRPC' },
  { label: 'Data', value: 'PostgreSQL, Redis, Kafka, ClickHouse' },
  { label: 'Infra', value: 'Docker, Kubernetes, Terraform, Cloudflare' },
  { label: 'Practice', value: 'Architecture, code review, mentoring' },
];

const FACETS = ['Engineer', 'Scuba diver', 'Photographer', 'Former journalist', 'Traveller'];

/** Context for each link in site.social, keyed by label. */
const NOTES: Record<string, string> = {
  GitHub: 'Code and side projects',
  LinkedIn: 'Work history',
  Instagram: 'Travel and photography',
  Pexels: 'Free-to-use photography',
  Quora: 'Answers, mostly about engineering',
  'iangabaraev.com': 'My other site',
};

export default function About() {
  const elsewhere = site.social.filter((item) => item.href.startsWith('http'));

  return (
    <div className="animate-rise pt-12 sm:pt-16">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="label-mono">
          <span className="text-[var(--accent)]">~/</span> about
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{site.author.name}</h1>
        <p className="mt-3 font-mono text-sm text-[var(--fg-muted)]">{site.author.role}</p>

        <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
          {FACETS.map((facet) => (
            <li
              key={facet}
              className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--fg-muted)]"
            >
              {facet}
            </li>
          ))}
        </ul>
      </header>

      <div className="prose mt-10 max-w-2xl">
        <p>
          I'm a lead fullstack engineer. I work across the whole stack — data models, APIs, and the interfaces people
          actually touch — and most of my job is making sure those layers agree with each other under load, over time,
          and across a team.
        </p>
        <p>
          I came to engineering from journalism, which turned out to be better preparation than it sounds. Both jobs are
          mostly about asking the uncomfortable question early, chasing a claim back to its source, and then explaining
          what you found to someone who doesn't have time for the long version. I still write for the same reason I
          reported: it's how I find out whether I actually understand something.
        </p>
        <p>
          I've been travelling full time for six years, working from wherever I happen to be. That's quietly shaped how
          I build things — asynchronous by default, documented well enough to survive a timezone gap, and resilient to a
          connection that drops halfway through a deploy.
        </p>
        <p>
          Away from the keyboard I'm usually underwater or behind a camera. I'm a scuba diver and a photographer, and
          the two overlap more often than not. Diving is also the best lesson in operational discipline I know:
          check your equipment, plan the dive, dive the plan, and respect the fact that the environment does not care
          how experienced you are.
        </p>
        <p>
          This site is my engineering notebook. I write long-form about the problems I actually hit: schema migrations
          that can't take downtime, queues that silently reorder, caches that lie, render paths that quietly cost
          seconds, and the architectural decisions that looked obvious in a design doc and much less so six months
          later. Everything here is written in markdown, rendered at build time, and served as static HTML from
          Cloudflare's edge. No tracking, no newsletter popup, no cookie banner.
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
        <h2 className="label-mono mb-4">Elsewhere</h2>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {elsewhere.map((item) => (
            <li key={item.href} className="bg-[var(--bg)]">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer me"
                className="group flex items-baseline justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--bg-subtle)]"
              >
                <span className="font-mono text-[13px] text-[var(--fg)] transition-colors group-hover:text-[var(--accent)]">
                  {item.label}
                </span>
                <span className="text-right text-xs text-[var(--fg-faint)]">{NOTES[item.label]}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
