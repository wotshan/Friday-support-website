import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  Circle,
  CircleDot,
  Clock3,
  Cloud,
  Command,
  Database,
  Gauge,
  Globe2,
  Layers3,
  Menu,
  MonitorCog,
  MoreHorizontal,
  RefreshCw,
  Rocket,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetBotActivityQueryKey,
  getGetBotAnalyticsQueryKey,
  getGetBotSummaryQueryKey,
  useExecuteBotCommand,
  useGetBotActivity,
  useGetBotAnalytics,
  useGetBotSummary,
  useUpdateBotStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

const queryClient = new QueryClient();

type CommandName = 'restart' | 'sync_memory' | 'deploy' | 'webhook';
type StatusName = 'online' | 'idle' | 'offline';

const partners = [
  { name: 'OpenAI', mark: 'O' },
  { name: 'Anthropic', mark: 'A' },
  { name: 'Vercel', mark: '▲' },
  { name: 'Linear', mark: 'L' },
  { name: 'Stripe', mark: 'S' },
  { name: 'Notion', mark: 'N' },
  { name: 'Slack', mark: 'S' },
  { name: 'Snowflake', mark: 'S' },
];

const commandMeta: Record<CommandName, { label: string; description: string; icon: typeof Rocket; tone: string }> = {
  deploy: { label: 'Deploy latest', description: 'Push the current memory and tools to production.', icon: Rocket, tone: 'blue' },
  restart: { label: 'Restart runtime', description: 'Cycle the runtime without changing its memory.', icon: RotateCcw, tone: 'violet' },
  sync_memory: { label: 'Sync memory', description: 'Pull the latest approved context from connected sources.', icon: Database, tone: 'teal' },
  webhook: { label: 'Test webhook', description: 'Send a signed test event through the active endpoint.', icon: Zap, tone: 'amber' },
};

function FridayMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-friday">
      <div className={`relative grid place-items-center border border-primary/60 bg-primary/10 ${compact ? 'h-8 w-8' : 'h-9 w-9'} rounded-[10px]`}>
        <span className="font-display text-sm font-bold tracking-[-.12em] text-primary">F</span>
        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-accent shadow-[0_0_14px_hsl(var(--accent)/.8)]" />
      </div>
      {!compact && <span className="font-display text-[17px] font-semibold tracking-[-.04em] text-foreground">friday</span>}
    </div>
  );
}

function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link href="/" data-testid="link-home"><FridayMark /></Link>
        <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex" aria-label="Primary navigation">
          <a href="#principles" data-testid="link-principles" className="transition-colors hover:text-foreground">Principles</a>
          <a href="#command-center" data-testid="link-command-center" className="transition-colors hover:text-foreground">Command center</a>
          <a href="#integrations" data-testid="link-integrations" className="transition-colors hover:text-foreground">Integrations</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/dashboard" data-testid="link-dashboard-nav" className="rounded-full px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
          <Link href="/dashboard" data-testid="link-launch-nav" className="group flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-[13px] font-semibold text-primary transition-all hover:border-primary/80 hover:bg-primary/15">
            Launch Friday <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <button type="button" data-testid="button-open-mobile-nav" onClick={() => setMenuOpen((value) => !value)} className="rounded-lg border border-border p-2 text-muted-foreground md:hidden" aria-label="Toggle navigation">
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-5 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl md:hidden">
            {[
              ['#principles', 'Principles'],
              ['#command-center', 'Command center'],
              ['#integrations', 'Integrations'],
            ].map(([href, label]) => (
              <a key={href} href={href} data-testid={`mobile-link-${label.toLowerCase().replace(' ', '-')}`} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">{label}</a>
            ))}
            <Link href="/dashboard" data-testid="link-mobile-launch" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground">Open command center</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function PartnerCarousel() {
  const repeated = [...partners, ...partners];
  return (
    <div id="integrations" className="border-y border-border/70 bg-card/35 py-7">
      <div className="mx-auto mb-5 flex max-w-[1240px] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[.22em] text-muted-foreground">Trusted connective tissue</span>
        <span className="h-px flex-1 bg-border/70" />
      </div>
      <div className="fade-edge overflow-hidden">
        <div className="marquee-track flex items-center gap-5 px-5 sm:gap-8">
          {repeated.map((partner, index) => (
            <div key={`${partner.name}-${index}`} className="flex min-w-[128px] items-center justify-center gap-2.5 text-muted-foreground/65">
              <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-muted/50 font-display text-xs font-semibold">{partner.mark}</span>
              <span className="font-display text-[13px] font-medium tracking-[-.02em]">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="noise min-h-[100dvh] overflow-hidden bg-background">
      <PublicNav />
      <main>
        <section className="hero-glow relative min-h-[760px] overflow-hidden px-5 pb-28 pt-40 sm:px-8 lg:px-10">
          <div className="dot-grid absolute inset-x-0 top-0 h-[640px] opacity-35" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
            <div className="max-w-[700px]">
              <div className="reveal mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-primary">
                <span className="pulse-dot h-2 w-2 rounded-full bg-primary" />
                The quiet command center for AI
              </div>
              <h1 className="reveal reveal-delay-1 text-balance font-display text-[clamp(3.4rem,8vw,7.6rem)] font-semibold leading-[.91] tracking-[-.075em] text-foreground">
                Make your<br /><span className="text-primary">automation</span><br />unmissable.
              </h1>
              <p className="reveal reveal-delay-2 mt-8 max-w-[500px] text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                Friday gives teams one precise place to see what their AI is doing, decide what happens next, and trust the outcome.
              </p>
              <div className="reveal reveal-delay-3 mt-9 flex flex-wrap items-center gap-3">
                <Link href="/dashboard" data-testid="link-hero-dashboard" className="group flex items-center gap-3 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90">
                  Open command center <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#principles" data-testid="link-hero-story" className="flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
                  Read the approach <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="reveal reveal-delay-4 mt-12 flex items-center gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>Built for teams that would rather know than guess.</span>
              </div>
            </div>
            <HeroInstrument />
          </div>
        </section>

        <PartnerCarousel />

        <section id="principles" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 py-28 sm:px-8 lg:px-10 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.22em] text-accent">A different default</p>
              <h2 className="mt-5 max-w-[390px] font-display text-4xl font-semibold leading-[1.02] tracking-[-.06em] text-foreground sm:text-5xl">No theater.<br />Just signal.</h2>
              <p className="mt-6 max-w-[360px] text-sm leading-6 text-muted-foreground">The best automation feels less like a magic trick and more like a reliable teammate: visible, accountable, and ready when you are.</p>
            </div>
            <div className="grid gap-0 border-t border-border lg:grid-cols-3 lg:border-t-0">
              {[
                { number: '01', icon: EyeMark, title: 'See the whole system', body: 'A live operational view that makes status, throughput, and drift legible at a glance.' },
                { number: '02', icon: BrainCircuit, title: 'Decide with context', body: 'Every command carries its consequence. Review what changes before you let it run.' },
                { number: '03', icon: Gauge, title: 'Move with confidence', body: 'Fast controls, durable logs, and a clear paper trail for every important action.' },
              ].map((item) => (
                <article key={item.number} className="border-b border-border py-7 lg:border-b-0 lg:border-l lg:px-7 lg:py-0 first:lg:border-l-0 first:lg:pl-0">
                  <div className="flex items-center justify-between">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-mono text-[11px] text-muted-foreground">{item.number}</span>
                  </div>
                  <h3 className="mt-10 font-display text-xl font-semibold tracking-[-.04em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="command-center" className="scroll-mt-8 border-y border-border/70 bg-card/45 px-5 py-28 sm:px-8 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">Inside Friday</p>
                <h2 className="mt-4 max-w-[570px] font-display text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">A calmer way to run the complex stuff.</h2>
              </div>
              <p className="max-w-[290px] text-sm leading-6 text-muted-foreground">The command center keeps the important signals close, without turning your day into a wall of alerts.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
              <div className="rounded-2xl border border-border bg-background/75 p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-border pb-5">
                  <div className="flex items-center gap-3"><Activity className="h-4 w-4 text-primary" /><span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Live overview</span></div>
                  <span className="flex items-center gap-2 font-mono text-[10px] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> 12 sec ago</span>
                </div>
                <div className="mt-7 grid gap-8 sm:grid-cols-[.75fr_1.25fr]">
                  <div><span className="text-xs text-muted-foreground">Requests this week</span><p className="mt-3 font-display text-5xl font-semibold tracking-[-.08em]">18,420</p><span className="mt-2 block text-xs text-accent">+12.8% from last week</span></div>
                  <MiniChart />
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-5">
                  {[['99.2%', 'success rate'], ['420ms', 'median latency'], ['08', 'active sessions']].map(([value, label]) => <div key={label}><div className="font-display text-lg font-semibold">{value}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</div></div>)}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background/75 p-5 sm:p-7">
                <div className="flex items-center gap-3"><Terminal className="h-4 w-4 text-accent" /><span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Control surface</span></div>
                <div className="mt-10 space-y-3">
                  {['Deploy latest', 'Sync memory', 'Restart runtime'].map((command, index) => <div key={command} className="flex items-center justify-between rounded-xl border border-border/80 bg-card px-3.5 py-3"><div className="flex items-center gap-3"><span className={`grid h-7 w-7 place-items-center rounded-lg ${index === 0 ? 'bg-primary/10 text-primary' : index === 1 ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}><span className="font-mono text-[10px]">0{index + 1}</span></span><span className="text-sm">{command}</span></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>)}
                </div>
                <p className="mt-7 text-xs leading-5 text-muted-foreground">Commands are previewed, accepted, and logged in one continuous loop.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-28 sm:px-8 lg:px-10 lg:py-36">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--accent)/.14),transparent_35%),hsl(var(--card)/.7)] px-6 py-14 sm:px-12 sm:py-20">
            <div className="relative max-w-[600px]">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="mt-7 font-display text-4xl font-semibold leading-[1] tracking-[-.06em] sm:text-6xl">Your best systems should feel quiet.</h2>
              <p className="mt-6 max-w-[470px] text-sm leading-6 text-muted-foreground">Friday is the layer between a team and its growing fleet of intelligent work. Make the next move obvious.</p>
              <Link href="/dashboard" data-testid="link-final-dashboard" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground">Enter Friday <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="absolute -right-10 -top-16 hidden h-80 w-80 rounded-full border border-primary/15 sm:block" />
            <div className="absolute -right-2 -top-8 hidden h-64 w-64 rounded-full border border-accent/15 sm:block" />
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <FridayMark compact />
          <span>Operational clarity for intelligent teams.</span>
          <span className="font-mono text-[10px] uppercase tracking-[.14em]">© Friday Systems</span>
        </div>
      </footer>
    </div>
  );
}

function EyeMark(props: { className?: string }) {
  return <Globe2 {...props} />;
}

function HeroInstrument() {
  return (
    <motion.div initial={{ opacity: 0, scale: .96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8, delay: .2 }} className="relative mx-auto w-full max-w-[530px]">
      <div className="absolute -inset-6 rounded-[2rem] bg-primary/5 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2"><FridayMark compact /><span className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">command center / overview</span></div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-card p-5"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" /> operating normally</div><div className="mt-7 font-display text-4xl font-semibold tracking-[-.08em]">99.2<span className="text-lg text-muted-foreground">%</span></div><div className="mt-1 text-[11px] text-muted-foreground">success rate</div></div>
          <div className="bg-card p-5"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground"><Timer className="h-3 w-3" /> median response</div><div className="mt-7 font-display text-4xl font-semibold tracking-[-.08em]">420<span className="text-lg text-muted-foreground">ms</span></div><div className="mt-1 text-[11px] text-muted-foreground">within target</div></div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Request volume</span><span className="text-[10px] text-accent">Last 7 days</span></div>
          <div className="mt-6 flex h-28 items-end gap-2">
            {[34, 48, 43, 65, 59, 77, 70, 88, 84, 96, 87, 100].map((height, index) => <div key={index} className="flex flex-1 items-end"><div className={`w-full rounded-t-sm ${index > 8 ? 'bg-primary' : 'bg-primary/30'}`} style={{ height: `${height}%` }} /></div>)}
          </div>
          <div className="mt-3 flex justify-between font-mono text-[9px] text-muted-foreground"><span>MON 04</span><span>THU 07</span><span>SUN 10</span></div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/35 px-5 py-3"><span className="font-mono text-[9px] text-muted-foreground">LAST EVENT</span><span className="flex items-center gap-2 text-[11px] text-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Memory synced · 14 sec ago</span></div>
      </div>
    </motion.div>
  );
}

function MiniChart() {
  return <div className="relative h-36"><div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" /><div className="absolute inset-x-0 top-1/4 border-t border-dashed border-border/60" /><div className="flex h-full items-end gap-1.5 px-2">{[28, 36, 32, 51, 45, 59, 52, 66, 62, 76, 72, 84, 78, 96].map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className={`w-full rounded-t-sm ${index > 10 ? 'bg-primary' : 'bg-primary/35'}`} style={{ height: `${height}%` }} /></div>)}</div></div>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Gauge },
    { href: '/dashboard?view=analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard?view=activity', label: 'Activity', icon: Activity },
    { href: '/settings', label: 'Bot settings', icon: Settings2 },
  ];
  return (
    <div className="noise flex min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center border-b border-border px-6"><Link href="/dashboard" data-testid="link-sidebar-brand"><FridayMark /></Link></div>
        <div className="flex-1 px-3 py-7">
          <p className="px-3 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">Workspace</p>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const active = location.startsWith(item.href.split('?')[0]) && (item.href === '/dashboard' ? !location.includes('view=') : location.includes(item.href.split('=')[1] ?? ''));
              return <Link key={item.href} href={item.href} data-testid={`link-sidebar-${item.label.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${active ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`}><item.icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}</Link>;
            })}
          </nav>
          <p className="mt-10 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">Environment</p>
          <div className="mt-3 rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center gap-2"><span className="pulse-dot h-2 w-2 rounded-full bg-accent" /><span className="text-xs font-semibold">Production</span><span className="ml-auto font-mono text-[9px] text-muted-foreground">LIVE</span></div>
            <div className="mt-3 flex items-center justify-between font-mono text-[9px] text-muted-foreground"><span>friday-core</span><span>v2.4.1</span></div>
          </div>
        </div>
        <div className="border-t border-border p-4"><div className="flex items-center gap-3 rounded-lg px-2 py-2"><div className="grid h-8 w-8 place-items-center rounded-full border border-border bg-muted font-mono text-xs text-primary">TM</div><div className="min-w-0"><div className="truncate text-xs font-semibold">Team Meridian</div><div className="truncate text-[11px] text-muted-foreground">Operator access</div></div><MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" /></div></div>
      </aside>
      {mobileOpen && <button type="button" data-testid="button-close-sidebar-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3"><button type="button" data-testid="button-open-sidebar" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"><Menu className="h-4 w-4" /></button><div className="hidden font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground sm:block">Friday / {location.includes('settings') ? 'Bot settings' : location.includes('analytics') ? 'Analytics' : location.includes('activity') ? 'Activity' : 'Overview'}</div></div>
          <div className="flex items-center gap-4"><button type="button" data-testid="button-notifications" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Notifications"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /></button><div className="h-5 w-px bg-border" /><span className="font-mono text-[10px] text-muted-foreground">UTC 14:32:08</span></div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function Dashboard() {
  const [location] = useLocation();
  const view = new URLSearchParams(location.split('?')[1] ?? '').get('view') ?? 'overview';
  const queryClient = useQueryClient();
  const summaryQuery = useGetBotSummary();
  const analyticsQuery = useGetBotAnalytics();
  const activityQuery = useGetBotActivity();
  const updateStatus = useUpdateBotStatus();
  const executeCommand = useExecuteBotCommand();
  const [notice, setNotice] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<CommandName>('deploy');
  const [lastResult, setLastResult] = useState<{ message: string; accepted: boolean } | null>(null);
  const summary = summaryQuery.data;
  const analytics = analyticsQuery.data;
  const activity = activityQuery.data;
  const isBusy = updateStatus.isPending || executeCommand.isPending;

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: getGetBotSummaryQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetBotAnalyticsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetBotActivityQueryKey() });
  };

  const handleStatus = (status: StatusName) => {
    setNotice('');
    updateStatus.mutate({ data: { status } }, {
      onSuccess: (result) => {
        setNotice(`Bot is now ${result.label.toLowerCase()}.`);
        invalidateAll();
      },
      onError: () => setNotice('Status update could not be applied. Try again.'),
    });
  };

  const handleCommand = () => {
    setNotice('');
    executeCommand.mutate({ data: { command: selectedCommand } }, {
      onSuccess: (result) => {
        setLastResult({ message: result.message, accepted: result.accepted });
        setNotice(result.accepted ? `${commandMeta[selectedCommand].label} accepted.` : 'Command was not accepted.');
        invalidateAll();
      },
      onError: () => setNotice('Command could not be sent. Check the connection and retry.'),
    });
  };

  const isLoading = summaryQuery.isLoading || analyticsQuery.isLoading || activityQuery.isLoading;
  if (isLoading) return <DashboardLoading />;
  if (summaryQuery.isError || analyticsQuery.isError || activityQuery.isError) return <DashboardError onRetry={() => { void summaryQuery.refetch(); void analyticsQuery.refetch(); void activityQuery.refetch(); }} />;

  const status = summary?.status;
  const pointMax = Math.max(...(analytics?.points?.map((point) => point.requests) ?? [1]));
  const successPercent = summary ? (summary.successRate <= 1 ? summary.successRate * 100 : summary.successRate) : 0;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" /> System nominal</div><h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] sm:text-5xl">{view === 'analytics' ? 'Analytics' : view === 'activity' ? 'Activity log' : 'Good afternoon, T.'}</h1><p className="mt-3 max-w-[510px] text-sm leading-6 text-muted-foreground">{view === 'analytics' ? 'A measured view of how Friday is handling the work.' : view === 'activity' ? 'A complete, chronological record of meaningful bot events.' : 'A clear view of what your bot knows, is doing, and needs from you.'}</p></div>
        <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">Updated just now</span><button type="button" data-testid="button-refresh-dashboard" onClick={() => invalidateAll()} className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Refresh dashboard"><RefreshCw className="h-4 w-4" /></button></div>
      </div>

      <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-primary" data-testid="status-command-notice"><Check className="h-4 w-4" />{notice}</motion.div>}</AnimatePresence>

      {view === 'analytics' ? <AnalyticsView analytics={analytics} /> : view === 'activity' ? <ActivityView activity={activity} /> : (
        <>
          <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total requests" value={formatNumber(summary?.totalRequests)} detail="across all channels" icon={Layers3} accent="blue" />
            <MetricCard label="Active sessions" value={formatNumber(summary?.activeSessions)} detail="currently in motion" icon={Globe2} accent="violet" />
            <MetricCard label="Response latency" value={`${formatNumber(summary?.responseLatency)}ms`} detail="median over 24 hours" icon={Timer} accent="teal" />
            <MetricCard label="Success rate" value={`${successPercent.toFixed(1)}%`} detail="within healthy range" icon={ShieldCheck} accent="amber" />
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_.6fr]">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Request volume</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">A steady week</h2></div><span className="rounded-full border border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground">Last 7 days</span></div>
              {analytics?.points?.length ? <div className="mt-9"><div className="flex h-56 items-end gap-2 sm:gap-4">{analytics.points.map((point, index) => <div key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-3"><div className="flex h-full w-full items-end gap-1"><div className="bar-grow w-1/2 rounded-t-sm bg-primary/30" style={{ height: `${Math.max(4, (point.requests / pointMax) * 100)}%`, animationDelay: `${index * 40}ms` }} /><div className="bar-grow w-1/2 rounded-t-sm bg-primary" style={{ height: `${Math.max(4, (point.successes / pointMax) * 100)}%`, animationDelay: `${index * 40 + 80}ms` }} /></div><span className="font-mono text-[9px] text-muted-foreground">{point.label}</span></div>)}</div></div> : <EmptyState label="No request data yet." />}
              <div className="mt-6 flex items-center gap-5 border-t border-border pt-4 text-[10px] text-muted-foreground"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary" />Successful</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary/30" />Total volume</span></div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Channels</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Where work lands</h2></div><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></div>
              <div className="mt-8 flex items-center gap-6">{analytics?.channels?.length ? <div className="h-28 w-28 shrink-0 rounded-full" style={{ background: donutGradient(analytics.channels) }}><div className="m-3 grid h-[calc(100%-24px)] place-items-center rounded-full bg-card"><span className="font-display text-xl font-semibold">{analytics.channels.reduce((total, channel) => total + channel.value, 0)}%</span></div></div> : <div className="h-28 w-28 rounded-full border border-dashed border-border" />}<div className="min-w-0 flex-1 space-y-3">{analytics?.channels?.map((channel) => <div key={channel.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 truncate"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />{channel.name}</span><span className="font-mono text-muted-foreground">{channel.value}%</span></div>)}</div></div>
              <div className="mt-8 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">Values represent completed requests.</div>
            </div>
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[.85fr_1.15fr]">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Operating status</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Bot presence</h2></div><MonitorCog className="h-5 w-5 text-primary" /></div>
              <div className="mt-8 rounded-xl border border-border bg-muted/35 p-4"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${status?.status === 'online' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}><CircleDot className="h-5 w-5" /></span><div><div className="text-sm font-semibold">{status?.label ?? 'Unknown'}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">Updated {status?.updatedAt ? formatRelative(status.updatedAt) : 'recently'}</div></div></div></div>
              <div className="mt-4 grid grid-cols-3 gap-2">{(['online', 'idle', 'offline'] as StatusName[]).map((option) => <button type="button" key={option} data-testid={`button-status-${option}`} disabled={isBusy} onClick={() => handleStatus(option)} className={`rounded-lg border px-2 py-2.5 text-[11px] capitalize transition-colors ${status?.status === option ? 'border-primary/50 bg-primary/10 font-semibold text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{option}</button>)}</div>
            </div>
            <CommandPanel selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} onExecute={handleCommand} isBusy={isBusy} lastResult={lastResult} />
          </section>

          <section className="mt-3 rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Latest signal</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Activity</h2></div><Link href="/dashboard?view=activity" data-testid="link-view-all-activity" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
            <ActivityList activity={activity?.slice(0, 5) ?? []} />
          </section>
          <div className="mt-4 text-[10px] text-muted-foreground">Deployed {summary?.deployedAt ? formatDate(summary.deployedAt) : 'not yet deployed'}</div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, accent }: { label: string; value: string; detail: string; icon: typeof Gauge; accent: string }) {
  const colors: Record<string, string> = { blue: 'text-primary bg-primary/10', violet: 'text-accent bg-accent/10', teal: 'text-[hsl(var(--chart-3))] bg-[hsl(var(--chart-3)/.1)]', amber: 'text-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/.1)]' };
  return <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${colors[accent]}`}><Icon className="h-4 w-4" /></span></div><div className="mt-7 font-display text-3xl font-semibold tracking-[-.06em]">{value}</div><div className="mt-2 text-xs text-muted-foreground">{detail}</div></div>;
}

function CommandPanel({ selectedCommand, setSelectedCommand, onExecute, isBusy, lastResult }: { selectedCommand: CommandName; setSelectedCommand: (command: CommandName) => void; onExecute: () => void; isBusy: boolean; lastResult: { message: string; accepted: boolean } | null }) {
  const meta = commandMeta[selectedCommand];
  const Icon = meta.icon;
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Command surface</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Take action</h2></div><Command className="h-5 w-5 text-accent" /></div><div className="mt-7 grid gap-2 sm:grid-cols-4">{(Object.keys(commandMeta) as CommandName[]).map((command) => { const item = commandMeta[command]; const ItemIcon = item.icon; return <button type="button" key={command} data-testid={`button-command-${command}`} onClick={() => setSelectedCommand(command)} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[11px] transition-colors ${selectedCommand === command ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}><ItemIcon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{item.label.replace(' latest', '').replace(' runtime', '').replace(' memory', '')}</span></button>; })}</div><div className="mt-4 flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone === 'blue' ? 'bg-primary/10 text-primary' : meta.tone === 'violet' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><div className="text-sm font-semibold">{meta.label}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.description}</p></div></div><button type="button" data-testid="button-execute-command" disabled={isBusy} onClick={onExecute} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{isBusy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}{isBusy ? 'Sending command…' : `Run ${meta.label.toLowerCase()}`}</button>{lastResult && <div className={`mt-3 border-l-2 px-3 py-2 text-[11px] ${lastResult.accepted ? 'border-accent text-muted-foreground' : 'border-destructive text-destructive'}`} data-testid="command-result">{lastResult.message}</div>}</div>;
}

function ActivityList({ activity }: { activity: Array<{ id: string; timestamp: string; message: string; status: string; service: string }> }) {
  if (!activity.length) return <EmptyState label="Friday has not recorded any activity yet." />;
  return <div className="mt-6 divide-y divide-border">{activity.map((event) => <div key={event.id} data-testid={`row-activity-${event.id}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${event.status === 'success' ? 'bg-accent/10 text-accent' : event.status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>{event.status === 'success' ? <Check className="h-4 w-4" /> : event.status === 'error' ? <X className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="truncate text-sm">{event.message}</div><div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted-foreground"><span>{event.service}</span><span>·</span><span>{formatRelative(event.timestamp)}</span></div></div><span className="hidden rounded-full border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground sm:block">{event.status}</span></div>)}</div>;
}

function AnalyticsView({ analytics }: { analytics: { points: Array<{ label: string; requests: number; successes: number }>; channels: Array<{ name: string; value: number; color: string }> } | undefined }) {
  const max = Math.max(...(analytics?.points?.map((point) => point.requests) ?? [1]));
  return <div className="mt-9 grid gap-3 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl border border-border bg-card p-5 sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Throughput analysis</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Requests and successful outcomes</h2></div><BarChart3 className="h-5 w-5 text-primary" /></div><div className="mt-10 flex h-72 items-end gap-2 border-b border-border sm:gap-4">{analytics?.points?.map((point, index) => <div key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-3"><div className="flex h-full w-full max-w-12 items-end gap-1"><div className="bar-grow w-1/2 rounded-t bg-primary/25" style={{ height: `${(point.requests / max) * 100}%` }} /><div className="bar-grow w-1/2 rounded-t bg-primary" style={{ height: `${(point.successes / max) * 100}%` }} /></div><span className="font-mono text-[9px] text-muted-foreground">{point.label}</span></div>)}</div></div><div className="rounded-2xl border border-border bg-card p-5 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Channel mix</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Distribution</h2><div className="mt-9 flex justify-center"><div className="h-48 w-48 rounded-full" style={{ background: analytics?.channels?.length ? donutGradient(analytics.channels) : 'hsl(var(--muted))' }}><div className="m-5 grid h-[calc(100%-40px)] place-items-center rounded-full bg-card"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">mix</span></div></div></div><div className="mt-8 space-y-4">{analytics?.channels?.map((channel) => <div key={channel.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />{channel.name}</span><span className="font-mono text-xs text-muted-foreground">{channel.value}%</span></div>)}</div></div></div>;
}

function ActivityView({ activity }: { activity: Array<{ id: string; timestamp: string; message: string; status: string; service: string }> | undefined }) {
  return <div className="mt-9 rounded-2xl border border-border bg-card p-5 sm:p-8"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Event stream</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Recent activity</h2></div><Activity className="h-5 w-5 text-accent" /></div><ActivityList activity={activity ?? []} /></div>;
}

function Settings() {
  const [saved, setSaved] = useState(false);
  const [botName, setBotName] = useState('Friday');
  const [mode, setMode] = useState('Balanced');
  const [confidence, setConfidence] = useState('0.82');
  const [memory, setMemory] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2800); };
  return <div className="mx-auto max-w-[980px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent"><Settings2 className="h-3.5 w-3.5" /> Configuration</div><h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Bot settings</h1><p className="mt-3 max-w-[500px] text-sm leading-6 text-muted-foreground">Tune how Friday speaks, remembers, and chooses what to do next.</p></div>{saved && <div className="mt-6 flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-xs text-accent" data-testid="settings-saved-notice"><Check className="h-4 w-4" />Configuration saved locally for this session.</div>}<div className="mt-9 space-y-3"><section className="rounded-2xl border border-border bg-card p-5 sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Identity</p><h2 className="mt-2 font-display text-xl font-semibold tracking-[-.03em]">How your bot appears</h2></div><BrainCircuit className="h-5 w-5 text-primary" /></div><div className="mt-7 grid gap-6 sm:grid-cols-2"><label className="block"><span className="text-xs font-semibold">Bot name</span><input data-testid="input-bot-name" value={botName} onChange={(event) => setBotName(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label><label className="block"><span className="text-xs font-semibold">Response mode</span><select data-testid="select-response-mode" value={mode} onChange={(event) => setMode(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-primary"><option>Balanced</option><option>Precise</option><option>Concise</option></select></label></div></section><section className="rounded-2xl border border-border bg-card p-5 sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Boundaries</p><h2 className="mt-2 font-display text-xl font-semibold tracking-[-.03em]">Guardrails and memory</h2></div><SlidersHorizontal className="h-5 w-5 text-accent" /></div><div className="mt-7 grid gap-8"><label className="block"><div className="flex items-center justify-between"><span className="text-xs font-semibold">Minimum confidence</span><span className="font-mono text-xs text-primary">{confidence}</span></div><input data-testid="input-confidence" type="range" min="0.5" max="0.99" step="0.01" value={confidence} onChange={(event) => setConfidence(event.target.value)} className="mt-4 w-full accent-[hsl(var(--primary))]" /><div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>More autonomous</span><span>More deliberate</span></div></label><ToggleRow id="toggle-memory" title="Use long-term memory" description="Let Friday reference approved context across sessions." value={memory} onChange={setMemory} /><ToggleRow id="toggle-notifications" title="Operator notifications" description="Receive a signal when Friday needs a decision." value={notifications} onChange={setNotifications} /></div></section><section className="rounded-2xl border border-border bg-card p-5 sm:p-8"><div className="flex items-center gap-3"><Cloud className="h-5 w-5 text-primary" /><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Connected environment</p><h2 className="mt-2 font-display text-xl font-semibold tracking-[-.03em]">Production runtime</h2></div></div><div className="mt-7 grid gap-3 sm:grid-cols-3">{[['Runtime', 'friday-core'], ['Region', 'us-east-1'], ['Version', '2.4.1']].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/25 p-4"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-3 text-sm font-semibold">{value}</p></div>)}</div></section></div><div className="mt-7 flex justify-end"><button type="button" data-testid="button-save-settings" onClick={save} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"><Check className="h-4 w-4" />Save configuration</button></div></div>;
}

function ToggleRow({ id, title, description, value, onChange }: { id: string; title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-5 border-t border-border pt-5"><div><div className="text-sm font-semibold">{title}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div></div><button type="button" id={id} data-testid={id} aria-pressed={value} onClick={() => onChange(!value)} className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${value ? 'border-primary bg-primary' : 'border-border bg-muted'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-foreground transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>;
}

function DashboardLoading() {
  return <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10"><div className="skeleton h-3 w-24 rounded" /><div className="skeleton mt-5 h-12 w-80 rounded-lg" /><div className="skeleton mt-3 h-4 w-96 max-w-full rounded" /><div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-36 rounded-2xl" />)}</div><div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_.6fr]"><div className="skeleton h-96 rounded-2xl" /><div className="skeleton h-96 rounded-2xl" /></div></div>;
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return <div className="mx-auto flex min-h-[70vh] max-w-[620px] flex-col items-center justify-center px-5 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive"><Server className="h-6 w-6" /></div><h1 className="mt-6 font-display text-3xl font-semibold tracking-[-.05em]">The command center is quiet.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Friday could not reach the runtime. Your configuration is safe; try reconnecting.</p><button type="button" data-testid="button-retry-dashboard" onClick={onRetry} className="mt-7 flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted"><RefreshCw className="h-3.5 w-3.5" />Try again</button></div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-28 items-center justify-center gap-2 text-xs text-muted-foreground"><Circle className="h-3 w-3" />{label}</div>;
}

function formatNumber(value: number | undefined) {
  return typeof value === 'number' ? new Intl.NumberFormat('en-US', { notation: value > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value) : '—';
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}
function donutGradient(channels: Array<{ value: number; color: string }>) {
  let start = 0;
  const segments = channels.map((channel) => { const end = start + channel.value; const segment = `${channel.color} ${start}% ${end}%`; start = end; return segment; });
  return `conic-gradient(${segments.join(', ')})`;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/dashboard"><AppShell><Dashboard /></AppShell></Route><Route path="/settings"><AppShell><Settings /></AppShell></Route><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;