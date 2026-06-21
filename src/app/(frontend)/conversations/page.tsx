import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

interface Props {
  searchParams: Promise<{ email?: string }>
}

export const metadata: Metadata = {
  title: 'Your Conversations – PenPal4ever',
}

export default async function AllYourConversationsPage({ searchParams }: Props) {
  const { email } = await searchParams

  if (!email) notFound()

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'correspondences',
    where: {
      or: [
        { yourEmail:   { equals: email.toLowerCase() } },
        { penpalEmail: { equals: email.toLowerCase() } },
      ],
    },
    limit: 100,
    sort: '-createdAt',
  })

  return (
    <div className="conversations-page">
      <div className="conversations-left">

        <header className="conversations-header">
          <h1 className="conversations-title">
            HERE ARE ALL CONVERSATIONS WITH EMAIL
          </h1>
          <div className="conversations-email-pill">
            <span>{email.toUpperCase()}</span>
          </div>
        </header>

        {docs.length === 0 ? (
          <p className="conversations-empty">No conversations found for this email.</p>
        ) : (
          <ul className="conversations-list">
            {docs.map((c, i) => {
              const you    = c.yourFirstName   ?? '?'
              const penpal = c.penpalFirstName ?? '?'
              const youInitial    = you.charAt(0).toUpperCase()
              const penpalInitial = penpal.charAt(0).toUpperCase()
              const displayName   = `${you.toUpperCase()} & ${penpal.toUpperCase()}`

              const started = new Date(c.createdAt).toISOString().slice(0, 10)
              const themesDone = c.currentThemeIndex ?? 0

              // Determine which token to use based on whose email matches
              const isCreator = c.yourEmail?.toLowerCase() === email.toLowerCase()
              const token     = isCreator ? c.leftToken : c.rightToken

              return (
                <li
                  key={c.id}
                  className={`conversations-row${i % 2 === 1 ? ' conversations-row--alt' : ''}`}
                >
                  <Link
                    href={`/correspondence/${c.slug}?token=${token ?? ''}`}
                    className="conversations-row-link"
                  >
                    <div className="conversations-avatars">
                      <div className="conversations-avatar conversations-avatar--you">
                        {youInitial}
                      </div>
                      <div className="conversations-avatar conversations-avatar--penpal">
                        {penpalInitial}
                      </div>
                    </div>
                    <div className="conversations-info">
                      <p className="conversations-names">{displayName}</p>
                      <p className="conversations-meta">
                        STARTED {started} &nbsp;·&nbsp; {themesDone} THEMES DONE
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        <Link href="/" className="conversations-back">← BACK</Link>
      </div>
    </div>
  )
}
