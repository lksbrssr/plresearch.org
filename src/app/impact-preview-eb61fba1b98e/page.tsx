import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import ImpactDashboardV2, { type LiveMetric, type LiveOutputs } from '@/components/ImpactDashboardV2'
import MeasuringQuestionsV2 from '@/components/MeasuringQuestionsV2'
import { HypercertsShowcase } from '@/components/hypercerts/HypercertsShowcase'
import { fetchResearchRetreatHypercerts } from '@/lib/hypercerts'
import { fetchSimocracyStats } from '@/lib/simocracy'
import { fetchGainforestStats } from '@/lib/gainforest'
import { fetchGlowStats } from '@/lib/glow'
import { resolveAllSignals } from '@/lib/market-signals'
import { FOCUS_AREAS, type FocusAreaKey } from '@/lib/inflection-points'
import { instrumentsForArea, withOpenAlex, withPatentVintage, type InstrumentRecord } from '@/lib/velocity-instruments'
import { loadAllOpenAlex } from '@/lib/velocity-openalex'
import { loadAllLatency, withLatency } from '@/lib/velocity-latency'

// The impact page reads field velocity: the interventions we run, the five
// instruments we read a field's rate of change with, and the inflection points
// we track, each with its live signal.
export const revalidate = 60

async function fetchLiveOutputs(): Promise<LiveOutputs> {
  const compact = (n: number) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const out: LiveOutputs = {}

  const [sim, gf, glow] = await Promise.allSettled([
    fetchSimocracyStats(),
    fetchGainforestStats(),
    fetchGlowStats(),
  ])

  // A binding decision at scale — Simocracy (a PL-supported deliberation mechanism).
  if (sim.status === 'fulfilled' && !sim.value.degraded) {
    const t = sim.value.totals
    const metrics: LiveMetric[] = [
      { n: t.uniqueHumans, label: 'participants' },
      { n: t.totalSims, label: 'simulations' },
      { n: t.totalGatherings, label: 'gatherings' },
    ]
      .filter((m) => m.n > 0)
      .map((m) => ({ value: compact(m.n), label: m.label }))
    if (metrics.length) out['A binding decision at scale'] = metrics
  }

  // Capital that pays on verified outcomes — GainForest + Glow (PL-backed MRV teams).
  const verified: LiveMetric[] = []
  if (gf.status === 'fulfilled' && !gf.value.degraded) {
    const g = gf.value
    if (g.observations > 0) verified.push({ value: compact(g.observations), label: 'species observations' })
    if (g.certifiedOrgs > 0) verified.push({ value: compact(g.certifiedOrgs), label: 'certified orgs' })
  }
  if (glow.status === 'fulfilled' && !glow.value.degraded) {
    const gl = glow.value
    if (gl.activeFarms > 0) verified.push({ value: compact(gl.activeFarms), label: 'active solar farms' })
    if (gl.carbon > 0) verified.push({ value: compact(gl.carbon), label: 'tCO₂ / wk' })
  }
  if (verified.length) out['Capital that pays on verified outcomes'] = verified

  return out
}

export const metadata: Metadata = {
  title: 'Impact',
  description:
    'How we judge PL R&D: whether the fields we back are speeding up. We name the interventions we run, then read field velocity through five instruments and the inflection points we track.',
  // Unlisted preview: reachable only via the exact cryptic URL. Keep it out of
  // search indexes and previews. (Not in nav, not in sitemap.xml, and
  // deliberately not listed in robots.txt so the path isn't published there.)
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default async function ImpactPage() {
  const [liveOutputs, marketSignals, certs] = await Promise.all([
    fetchLiveOutputs(),
    resolveAllSignals(),
    fetchResearchRetreatHypercerts(),
  ])

  // Merge any OpenAlex CSV readings (idea vintage + talent entry) into the static
  // instrument records, per focus area. Parsed at build time; absent CSVs are a
  // no-op, leaving the documented `unwired` records in place.
  const openAlex = loadAllOpenAlex()
  const latency = loadAllLatency()
  const recordsByArea = Object.fromEntries(
    FOCUS_AREAS.map((fa) => [fa.key, withLatency(withOpenAlex(withPatentVintage(instrumentsForArea(fa.key), fa.key), openAlex[fa.key]), latency[fa.key])]),
  ) as Partial<Record<FocusAreaKey, InstrumentRecord[]>>

  // Example idea-vintage series per field, for the methodology modal that explains
  // the instrument (shown as small multiples).
  const ideaVintageExamples = FOCUS_AREAS.map((fa) => {
    const rec = (recordsByArea[fa.key] ?? []).find(
      (r) => r.instrument === 'idea_vintage' && r.state === 'reading' && r.series && r.series.length > 1,
    )
    return rec ? { label: fa.label, series: rec.series!, scale: rec.seriesScale ?? 'linear' } : null
  }).filter((x): x is { label: string; series: NonNullable<InstrumentRecord['series']>; scale: 'linear' | 'log' } => !!x)
  return (
    <div>
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Breadcrumb items={[{ label: 'Impact' }]} />
        <div className="pt-8 pb-10">
          <h1 className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5 max-w-3xl">
            Field velocity and PL R&amp;D interventions
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-none">
            We back fields we think are ready to move, then check whether they do.{' '}
            <strong className="font-semibold text-black">Field velocity</strong> is that rate of change:
            how fast talent enters, capital forms, tool costs fall, and output ships.{' '}
            <strong className="font-semibold text-black">Inflection points</strong> are one of the markers
            we read: dated, falsifiable shifts an accelerating field should produce.
          </p>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-none">
            We measure velocity the same way we do the work: as a research program. Whether field
            acceleration works is itself the open question, tested across all four focus areas.
          </p>
          <a
            href="#methodology"
            className="mt-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-[15px]"
          >
            Learn more about our methodology
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Field velocity — grey full-bleed section to set it apart from the rest of the site */}
      <section className="border-y border-gray-200 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 lg:py-16">
          <h2 className="text-xl lg:text-2xl font-semibold tracking-tight mb-2">Field velocity</h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Pick a focus area. The summary above reads that field&rsquo;s velocity across the instruments
            that apply to it; the inflection points below are the specific markers we track, each with its
            live signal. <span className="text-gray-500">Tip: click, hold and drag across any spark line to
            measure the change between two points.</span>
          </p>
          <ImpactDashboardV2
            liveOutputs={liveOutputs}
            marketSignals={marketSignals}
            recordsByArea={recordsByArea}
            ideaVintageExamples={ideaVintageExamples}
          />
        </div>
      </section>

      {/* Methodology */}
      <div id="methodology" className="max-w-6xl mx-auto px-6 py-14 lg:py-16 scroll-mt-24">
        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight mb-2">Our methodology</h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          The method is the meta-research design of how we do field acceleration. We name the
          interventions we run, then read field velocity as the result. Same design, every focus area.
        </p>
        <MeasuringQuestionsV2
          ideaVintageExamples={ideaVintageExamples}
          interlude={
            certs.length > 0 ? (
              /* Hypercerts — the impact claims themselves, as a cover carousel.
                 Sits between the interventions and observed-velocity blocks: the
                 published hypercerts mirror the interventions above. The
                 toned-down card view of intervention examples lives in the
                 methodology modals; here we surface only the real, published
                 hypercerts. */
              /* Full-bleed grey band: break out of the centered max-w-6xl
                 methodology container to span the whole viewport width, then
                 re-center the content in an inner max-w-6xl wrapper. Use
                 negative margins (not a transform) for the break-out — a
                 transformed ancestor would become the containing block for the
                 detail modal's `position: fixed`, trapping it inside this band. */
              <section className="my-12 w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] border-y border-gray-200 bg-gray-50">
                <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
                <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--impact-hand)' }}>
                      Our hand, as verifiable claims
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-black">Verified Impact</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      A{' '}
                      <a
                        href="https://hypercerts.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue hover:underline"
                      >
                        hypercert
                      </a>{' '}
                      is a verifiable, evolving record of impactful work &mdash; what was done, by whom, and where.
                      Each Research Retreat edition is published as one on open infrastructure PL R&amp;D helped
                      originate. Open a card to walk its evidence timeline.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <a
                      href="/areas/economies-governance/impact/hypercerts/"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-blue/40 hover:text-blue hover:shadow-sm"
                    >
                      See all impact claims
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
                <HypercertsShowcase certs={certs} />
                </div>
              </section>
            ) : null
          }
        />
      </div>
    </div>
  )
}
