import type { Metadata } from 'next'
import { sections, publications, talks, blogPosts, areas } from '@/lib/content'
import Breadcrumb from '@/components/Breadcrumb'
import EditPageButton from '@/components/EditPageButton'
import { PageEditHistoryByline } from '@/components/EditHistoryByline'
import MarkdownContent from '@/components/MarkdownContent'
import InsightsExplorer, { type InsightSection, type AreaDef } from '@/components/InsightsExplorer'
import { fetchPage, getSection } from '@/lib/indexer'

export const metadata: Metadata = { title: 'Insights' }

const FALLBACK_HERO_TITLE = 'Insights'
const FALLBACK_HERO_SUBTITLE =
  'Exploring the frontiers of computing, networking, and knowledge systems to build infrastructure that empowers humanity.'
const FALLBACK_CARDS = {
  'card-publications': { title: 'Publications' },
  'card-talks': { title: 'Talks & Podcasts' },
  'card-blog': { title: 'Blog' },
}

export default async function InsightsPage() {
  const page = await fetchPage('insights')
  const hero = getSection(page, 'hero')
  const heroTitle = hero?.title || FALLBACK_HERO_TITLE
  const heroSubtitle = hero?.subtitle || FALLBACK_HERO_SUBTITLE

  const cardPublications = getSection(page, 'card-publications')
  const cardTalks = getSection(page, 'card-talks')
  const cardBlog = getSection(page, 'card-blog')

  // Focus-area chips, ordered to match the site nav.
  const AREA_ORDER = ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech']
  const areaDefs: AreaDef[] = AREA_ORDER.map((slug) => areas.find((a) => a.slug === slug))
    .filter((a): a is (typeof areas)[number] => Boolean(a))
    .map((a) => ({ slug: a.slug, title: a.title }))

  const insightSections: InsightSection[] = [
    {
      key: 'blog',
      label: cardBlog?.title || FALLBACK_CARDS['card-blog'].title,
      heading: 'From the Blog',
      allHref: '/blog/',
      allLabel: 'All posts →',
      items: blogPosts.map((post) => {
        const isExternal = !!post.external_url
        const dateLabel =
          post.date && new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        return {
          key: post.slug,
          href: post.external_url || `/blog/${post.slug}/`,
          external: isExternal,
          eyebrow: [dateLabel, isExternal && 'protocol.ai'].filter(Boolean).join(' · '),
          title: post.title,
          description: post.summary,
          areas: post.areas ?? [],
        }
      }),
    },
    {
      key: 'publications',
      label: cardPublications?.title || FALLBACK_CARDS['card-publications'].title,
      heading: 'Recent Publications',
      allHref: '/publications/',
      allLabel: 'All publications →',
      items: publications.map((p) => ({
        key: p.slug,
        href: `/publications/${p.slug}/`,
        eyebrow: [p.venue, p.date && new Date(p.date).getFullYear()].filter(Boolean).join(' · '),
        title: p.title,
        areas: p.areas ?? [],
      })),
    },
    {
      key: 'talks',
      label: cardTalks?.title || FALLBACK_CARDS['card-talks'].title,
      heading: 'Recent Talks & Podcasts',
      allHref: '/talks/',
      allLabel: 'All talks →',
      items: talks.map((t) => ({
        key: t.slug,
        href: `/talks/${t.slug}/`,
        eyebrow: [t.venue, t.venue_location, t.date && new Date(t.date).getFullYear()].filter(Boolean).join(' · '),
        title: t.title,
        description: t.abstract,
        areas: t.areas ?? [],
      })),
    },
  ].filter((s) => s.items.length > 0)

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Insights' }]} />
      <div className="mt-4 empty:hidden">
        <PageEditHistoryByline rkey="insights" />
      </div>
      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        <PageGeo />
        <h1 className="relative z-10 text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5 max-w-xl">
          {heroTitle}
        </h1>
        <MarkdownContent content={heroSubtitle} className="relative z-10 text-lg text-gray-600 leading-relaxed max-w-2xl" />
      </div>

      {/* Section content if any */}
      {sections.research?.html && (
        <div className="mb-12 pb-12 border-b border-gray-100">
          <div className="page-content text-base text-gray-700 leading-relaxed max-w-3xl" dangerouslySetInnerHTML={{ __html: sections.research.html }} />
        </div>
      )}

      <InsightsExplorer sections={insightSections} areas={areaDefs} />

      <EditPageButton rkey="insights" />
    </div>
  )
}

function PageGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
      <polygon points="480,80 580,250 380,250" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="520,180 620,350 420,350" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="450,260 550,430 350,430" stroke="#C3E1FF" strokeWidth="0.75" />
      <line x1="480" y1="80" x2="520" y2="180" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="580" y1="250" x2="620" y2="350" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="420" y1="350" x2="450" y2="260" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="480" cy="80" r="3" fill="#C3E1FF" />
      <circle cx="520" cy="180" r="3" fill="#C3E1FF" />
      <circle cx="450" cy="260" r="3" fill="#C3E1FF" />
      <circle cx="580" cy="250" r="3" fill="#C3E1FF" />
      <circle cx="620" cy="350" r="3" fill="#C3E1FF" />
    </svg>
  )
}
