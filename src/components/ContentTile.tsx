import Link from 'next/link'
import type { ReactNode } from 'react'

export type ContentTileData = {
  href: string
  eyebrow?: string
  title: string
  description?: string
  external?: boolean
  /** Optional content-type tag shown at the top of the card (e.g. in the unified Insights feed). */
  badge?: string
}

/**
 * Shared listing/insights card. Single source of truth for the tile look used
 * on the Insights explorer and the /publications, /talks, /blog, /tutorials
 * listing pages so the tile view persists across "All …" links.
 */
export function ContentTile({ href, eyebrow, title, description, external, badge }: ContentTileData) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group flex flex-col h-full border border-gray-200 rounded-lg p-5 hover:border-blue hover:shadow-sm transition-all"
    >
      {badge && (
        <span className="self-start text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 mb-2">
          {badge}
        </span>
      )}
      {eyebrow && <div className="text-xs text-gray-400 mb-2">{eyebrow}</div>}
      <h3 className="text-base font-medium text-black leading-snug group-hover:text-blue transition-colors">
        {title}
        {external && <span className="text-gray-400 text-xs ml-1.5">↗</span>}
      </h3>
      {description && <p className="text-sm text-gray-500 mt-2 line-clamp-3">{description}</p>}
    </Link>
  )
}

/** Responsive 1/2/3-column grid wrapper matching the Insights tile layout. */
export function ContentTileGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
}
