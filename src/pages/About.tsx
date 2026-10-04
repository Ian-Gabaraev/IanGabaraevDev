import { site } from '../lib/site';

const STACK = [
  { label: 'Languages', value: 'Python, TypeScript, JavaScript, Elixir, Java, C' },
  { label: 'Backend', value: 'Django, FastAPI, Flask, Phoenix' },
  { label: 'Runtime & concurrency', value: 'ASGI, Gunicorn, uWSGI, gthread, greenlets, asyncio' },
  { label: 'Frontend', value: 'React, Redux, Tailwind, Bootstrap' },
  { label: 'APIs', value: 'REST, GraphQL, gRPC, WebSockets' },
  { label: 'Realtime & voice', value: 'VoIP, WebRTC, FreeSWITCH, MQTT' },
  { label: 'Queues & caching', value: 'RabbitMQ, Kafka, Celery, Redis, Memcached' },
  { label: 'Data', value: 'PostgreSQL, MongoDB, Elasticsearch, SQLAlchemy, Alembic' },
  {
    label: 'AWS',
    value:
      'Lambda, API Gateway, S3, RDS, DynamoDB, SQS, SNS, EventBridge, Step Functions, CloudFront, Cognito, IAM, CloudWatch, CloudTrail',
  },
  { label: 'Azure', value: 'Functions, Container Apps, Blob Storage, Azure SQL, Key Vault' },
  { label: 'Infra & IaC', value: 'Docker, NGINX, CloudFormation, Bicep' },
  { label: 'Signal & embedded', value: 'DSP, FFT, PortAudio, KISS FFT, Raspberry Pi' },
  { label: 'ML', value: 'PyTorch, audio classification' },
  { label: 'CI/CD', value: 'GitHub Actions, GitLab CI' },
  { label: 'AI tooling', value: 'Claude Code, GitHub Copilot' },
  { label: 'Practice', value: 'Architecture, code review, mentoring' },
];

const FACETS = [
  'Engineer',
  'Scuba diver',
  'Mountain biker',
  'Drone pilot',
  'Photographer',
  'Bioacoustics',
  'Former journalist',
  'Traveller',
];

const BACKGROUND = [
  {
    label: 'Education',
    value: 'MGIMO, Moscow — International Relations (Italy focus)',
  },
  {
    label: 'Languages',
    value: 'Russian · English · Italian · Ossetian',
  },
];

const PROJECTS = [
  {
    name: 'BatSonar',
    blurb:
      'An app suite for monitoring bat activity. Ultrasonic audio is captured and processed in real time on a Raspberry Pi — FFT and DSP in C — then relayed over MQTT to a mobile monitor for visualisation. Species are identified by PyTorch models I trained on ultrasound I recorded myself. Published openly for educational use.',
    links: [
      { label: 'Bat-Sonar', href: 'https://github.com/Ian-Gabaraev/Bat-Sonar' },
      { label: 'Listener', href: 'https://github.com/Ian-Gabaraev/Bat-Sonar-Listener' },
      { label: 'Mobile Monitor', href: 'https://github.com/Ian-Gabaraev/Bat-Sonar-Mobile-Monitor' },
    ],
  },
  {
    name: 'PassiveSonar',
    blurb:
      'Noise monitoring for enclosed spaces — short-term rentals, offices, shared housing. It measures loudness continuously on a Raspberry Pi, visualises the trend, and pushes automated alerts over Telegram when levels cross a threshold, so a problem is caught while it is still happening.',
    links: [{ label: 'passivesonar', href: 'https://github.com/Ian-Gabaraev/passivesonar' }],
  },
];

/** Context for each link in site.social, keyed by label. */
const NOTES: Record<string, string> = {
  GitHub: 'Code and side projects',
  LinkedIn: 'Work history',
  Medium: 'Cross-posted writing',
  Instagram: 'Travel and photography',
  Pexels: 'Free-to-use photography',
  Shutterstock: 'Licensed stock photography',
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
          I studied International Relations at MGIMO in Moscow, specialising in Italy, and I speak four languages
          fluently — Russian, English, Italian and Ossetian. It is not the usual route into this profession, but
          learning a language is the same exercise as learning a system: absorb the rules, then spend much longer
          learning where the rules quietly stop applying.
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
          Away from the keyboard I'm usually underwater, on a bike, or flying something. I dive, I shoot stills and
          drone footage, and I ride mountain bikes — I own more of them than is strictly reasonable — most often on
          remote trails in Vietnam. Diving is the best lesson in operational discipline I know: check your equipment,
          plan the dive, dive the plan, and accept that the environment does not care how experienced you are. Being a
          long way down a trail with no signal and a broken derailleur teaches the same lesson in a different accent.
        </p>
        <p>
          A recurring side interest is bioacoustics and signal processing. I built BatSonar, a suite for monitoring bat
          activity from their echolocation calls — ultrasound well above human hearing, captured and run through an FFT
          pipeline in C on a Raspberry Pi, with species classification from models I trained on recordings I collected
          myself. It is the kind of problem I like: real-time constraints, noisy inputs, cheap hardware, and an answer
          you can check against the animal flying over your head.
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
        <h2 className="label-mono mb-4">Background</h2>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {BACKGROUND.map((item) => (
            <div key={item.label} className="bg-[var(--bg)] px-4 py-3.5">
              <dt className="label-mono">{item.label}</dt>
              <dd className="mt-1.5 font-mono text-[13px] text-[var(--fg)]">{item.value}</dd>
            </div>
          ))}
          {BACKGROUND.length % 2 === 1 && <div aria-hidden className="hidden bg-[var(--bg)] sm:block" />}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="label-mono mb-4">Projects</h2>
        <ul className="space-y-4">
          {PROJECTS.map((project) => (
            <li key={project.name} className="rounded-lg border border-[var(--border)] p-5">
              <h3 className="font-mono text-sm text-[var(--fg)]">{project.name}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--fg-muted)]">{project.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {project.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                    >
                      {link.label} →
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="label-mono mb-4">Stack</h2>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {STACK.map((item) => (
            <div key={item.label} className="bg-[var(--bg)] px-4 py-3.5">
              <dt className="label-mono">{item.label}</dt>
              <dd className="mt-1.5 font-mono text-[13px] text-[var(--fg)]">{item.value}</dd>
            </div>
          ))}
          {STACK.length % 2 === 1 && <div aria-hidden className="hidden bg-[var(--bg)] sm:block" />}
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
          {elsewhere.length % 2 === 1 && <li aria-hidden className="hidden bg-[var(--bg)] sm:block" />}
        </ul>
      </section>
    </div>
  );
}
