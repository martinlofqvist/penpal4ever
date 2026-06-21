import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

const COOKIE_NAME = 'p4e_admin'
const COOKIE_VALUE = 'granted'

// ─── Server actions (password never reaches the client) ───

async function login(formData: FormData) {
  'use server'
  const entered = (formData.get('password') as string ?? '').trim()
  const correct = process.env.ADMIN_PASSWORD ?? ''

  if (!correct) throw new Error('ADMIN_PASSWORD env var is not set')

  // Constant-time compare to prevent timing attacks
  const enc = new TextEncoder()
  const a = enc.encode(entered.padEnd(64))
  const b = enc.encode(correct.padEnd(64))
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  const match = diff === 0 && entered.length === correct.length

  if (!match) redirect('/admin/all-conversations?error=1')

  const jar = await cookies()
  jar.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/admin/all-conversations',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  redirect('/admin/all-conversations')
}

async function logout() {
  'use server'
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
  redirect('/admin/all-conversations')
}

// ─── Page ─────────────────────────────────────────────────

export default async function AdminAllConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const jar = await cookies()
  const authed = jar.get(COOKIE_NAME)?.value === COOKIE_VALUE
  const { error } = await searchParams

  // ── Login wall ──────────────────────────────────────────
  if (!authed) {
    return (
      <div className="conversations-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '26rem', padding: '0 1.5rem' }}>
          <h1 className="conversations-title" style={{ marginBottom: '2rem' }}>ADMIN</h1>
          <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-pw">Password</label>
              <input
                id="admin-pw"
                name="password"
                type="password"
                className="form-input"
                autoFocus
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="form-error" style={{ display: 'block' }}>Wrong password.</p>
            )}
            <button type="submit" className="start-submit">ENTER →</button>
          </form>
        </div>
      </div>
    )
  }

  // ── Fetch all conversations ─────────────────────────────
  const payload = await getPayload({ config })
  const { docs, totalDocs } = await payload.find({
    collection: 'correspondences',
    limit: 500,
    sort: '-createdAt',
  })

  return (
    <div className="conversations-page">
      <div className="conversations-left">

        <header className="conversations-header" style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="conversations-title">ALL CONVERSATIONS</h1>
            <p className="conversations-meta" style={{ marginTop: '0.5rem' }}>{totalDocs} TOTAL</p>
          </div>
          <form action={logout}>
            <button type="submit" className="conversations-back" style={{ marginTop: 0 }}>
              LOG OUT
            </button>
          </form>
        </header>

        {docs.length === 0 ? (
          <p className="conversations-empty">No conversations yet.</p>
        ) : (
          <ul className="conversations-list">
            {docs.map((c, i) => {
              const you    = c.yourFirstName   ?? '?'
              const penpal = c.penpalFirstName || '…'
              const youInitial    = you.charAt(0).toUpperCase()
              const penpalInitial = penpal.charAt(0).toUpperCase()
              const displayName   = `${you.toUpperCase()} & ${penpal.toUpperCase()}`
              const started       = new Date(c.createdAt).toISOString().slice(0, 10)
              const themesDone    = c.currentThemeIndex ?? 0

              return (
                <li
                  key={c.id}
                  className={`conversations-row${i % 2 === 1 ? ' conversations-row--alt' : ''}`}
                >
                  <Link
                    href={`/correspondence/${c.slug}?token=${c.leftToken ?? ''}`}
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
                        STARTED {started}
                        {c.yourEmail ? ` · ${c.yourEmail}` : ''}
                        {` · ${themesDone} THEMES DONE`}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

      </div>
    </div>
  )
}
