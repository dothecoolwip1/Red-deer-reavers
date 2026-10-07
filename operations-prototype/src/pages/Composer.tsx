import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Card, PageHeader, Mock, Tabs } from '../components/ui'
import { useColl, useSession, toast } from '../services/store'
import { adapters, platformIds, socialService, validateAll, type SubmitMode } from '../services/social'
import { socialTasks } from '../data/social'
import { PlatformTag, SocialNav } from './social-common'
import type { PlatformId } from '../types'
import type { ComposerDraft } from '../services/social/adapters'

export default function Composer() {
  const [sp] = useSearchParams(); const nav = useNavigate(); const { role } = useSession()
  const media = useColl('mediaAssets'); const accounts = useColl('socialAccounts'); const camps = useColl('socialCampaigns'); const events = useColl('events'); const funds = useColl('fundraisers'); const programs = useColl('programs'); const sponsors = useColl('sponsors')
  const task = socialTasks.find(t => t.id === sp.get('task'))?.composer as any
  const [title, setTitle] = useState(task?.title ?? ''); const [caption, setCaption] = useState(''); const [tags, setTags] = useState(''); const [link, setLink] = useState('')
  const [mediaIds, setMediaIds] = useState<string[]>(task?.mediaIds ?? []); const [plats, setPlats] = useState<PlatformId[]>(['facebook', 'instagram'])
  const [over, setOver] = useState<ComposerDraft['overrides']>({}); const [custom, setCustom] = useState<PlatformId[]>([])
  const [campaignId, setCampaign] = useState(''); const [eventId, setEvent] = useState(task?.eventId ?? ''); const [fundraiserId, setFund] = useState(task?.fundraiserId ?? ''); const [programId, setProg] = useState('')
  const [sponsorIds, setSponsors] = useState<string[]>(task?.sponsorIds ?? []); const [when, setWhen] = useState('2026-10-12T12:00'); const [prev, setPrev] = useState<PlatformId>('facebook'); const [busy, setBusy] = useState(false)
  const draft: ComposerDraft = useMemo(() => ({ title, caption, hashtags: tags.split(/[\s,]+/).filter(Boolean).map(t => t.startsWith('#') ? t : '#' + t), link, mediaIds, media: media.filter(m => mediaIds.includes(m.id)), overrides: over }), [title, caption, tags, link, mediaIds, media, over])
  const warnings = useMemo(() => validateAll(draft, plats), [draft, plats])
  const toggle = <T,>(arr: T[], x: T) => arr.includes(x) ? arr.filter(i => i !== x) : [...arr, x]
  const blocked = plats.some(p => warnings[p].some(w => w.level === 'error')) || !plats.length
  const canPublish = role === 'Administrator'; const canSchedule = ['Administrator', 'Social Media Manager'].includes(role)
  const run = async (mode: SubmitMode) => {
    if (mode === 'publish' || mode === 'schedule') { if (blocked) return toast('Fix the errors (red) first, or save as draft.') }
    setBusy(true)
    const post = await socialService.submit(draft, plats, mode, { campaignId: campaignId || undefined, eventId: eventId || undefined, fundraiserId: fundraiserId || undefined, programId: programId || undefined, sponsorIds, scheduledFor: when.replace('T', ' '), author: role === 'Administrator' ? 'Alex Hartwell' : role })
    setBusy(false); toast(`Post ${mode === 'publish' ? 'published (simulated)' : mode === 'schedule' ? 'scheduled (simulated)' : mode === 'review' ? 'submitted for review' : 'saved as draft'}`); nav(`/social/posts/${post.id}`)
  }
  const cap = (p: PlatformId) => over[p]?.caption ?? caption
  const m0 = media.find(m => m.id === mediaIds[0])
  return (<>
    <PageHeader title="Unified Social Composer" subtitle={task ? `From task: ${socialTasks.find(t => t.id === sp.get('task'))?.title}` : 'One post, many destinations — each platform has its own rules'} />
    <Mock>Nothing is actually posted anywhere. Platform rules come from per-platform adapters (see services/social).</Mock><SocialNav />
    <div className="grid g2"><div>
      <Card title="Post to">{platformIds.map(p => { const a = accounts.find(x => x.platform === p); const c = adapters[p].capabilities; return (
        <div key={p} style={{ marginBottom: '.5rem' }}><label className="row"><input type="checkbox" checked={plats.includes(p)} onChange={() => setPlats(x => toggle(x, p))} /> <PlatformTag p={p} /> {a?.connected ? <Badge tone="good">Connected</Badge> : <Badge tone="bad">Not connected</Badge>}</label>
          {plats.includes(p) && <>{!a?.connected && <div className="warnbox error">X/this account isn't connected — connect it under Social Accounts.</div>}{warnings[p].map((w, i) => <div key={i} className={'warnbox ' + w.level}>{w.level === 'error' ? '⛔ ' : '⚠ '}{w.text}</div>)}<small className="muted">{c.note}</small></>}</div>) })}</Card>
      <Card title="Content">
        <div className="form"><label className="field"><span>Title (YouTube etc.)</span><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="field"><span>Caption / text ({caption.length})</span><textarea className="input" rows={4} value={caption} onChange={e => setCaption(e.target.value)} /></label>
          <label className="field"><span>Hashtags</span><input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="#Buhurt #RedDeer" /></label>
          <label className="field"><span>Link</span><input className="input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://" /></label></div></Card>
      <Card title={`Media (${mediaIds.length} selected, from Media Library)`} actions={<Link to="/media" className="btn sm">Library</Link>}><div className="grid g-auto">{media.map(m => <div key={m.id} className={'media-tile' + (mediaIds.includes(m.id) ? ' sel' : '')} onClick={() => setMediaIds(x => toggle(x, m.id))}><div className="ph" style={{ background: m.color }}>{m.kind}</div><div style={{ padding: '.2rem', fontSize: '.72rem' }}>{m.name}{!m.approved && <Badge tone="bad">not approved</Badge>}</div></div>)}</div></Card>
      <Card title="Links">
        <div className="form"><label className="field"><span>Campaign</span><select className="input" value={campaignId} onChange={e => setCampaign(e.target.value)}><option value="">—</option>{camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field"><span>Related event</span><select className="input" value={eventId} onChange={e => setEvent(e.target.value)}><option value="">—</option>{events.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field"><span>Related fundraiser</span><select className="input" value={fundraiserId} onChange={e => setFund(e.target.value)}><option value="">—</option>{funds.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field"><span>Related program</span><select className="input" value={programId} onChange={e => setProg(e.target.value)}><option value="">—</option>{programs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div><b>Sponsor tags</b><div className="pills">{sponsors.filter(s => ['Active', 'Renewal Due'].includes(s.status)).map(s => <button type="button" key={s.id} className={'pill' + (sponsorIds.includes(s.id) ? ' on' : '')} onClick={() => setSponsors(x => toggle(x, s.id))}>{s.company}</button>)}</div></div></div></Card>
    </div><div>
      <Card title="Per-platform customization">{plats.length ? plats.map(p => <div key={p} style={{ marginBottom: '.6rem' }}><label className="row"><input type="checkbox" checked={custom.includes(p)} onChange={() => { setCustom(x => toggle(x, p)); if (custom.includes(p)) setOver(o => { const n = { ...o }; delete n[p]; return n }) }} /> Customize for <PlatformTag p={p} /></label>
        {custom.includes(p) && <div className="form"><input className="input" placeholder="Platform title" value={over[p]?.title ?? ''} onChange={e => setOver(o => ({ ...o, [p]: { ...o[p], title: e.target.value } }))} /><textarea className="input" rows={3} placeholder="Platform-specific caption" value={over[p]?.caption ?? ''} onChange={e => setOver(o => ({ ...o, [p]: { ...o[p], caption: e.target.value } }))} /></div>}</div>) : <p className="muted">Pick a destination.</p>}</Card>
      <Card title="Preview">{plats.length ? <><Tabs tabs={plats as any} value={(plats.includes(prev) ? prev : plats[0]) as any} onChange={(t: any) => setPrev(t)} />
        {(() => { const p = plats.includes(prev) ? prev : plats[0]; const c = adapters[p].capabilities; return (
          <div className="preview"><div className="row"><span className="plat-dot" style={{ background: c.color }}>{c.icon}</span><b>Red Deer Reavers</b><span className="muted">· {c.label} preview</span></div>
            {(over[p]?.title || title) && <b>{over[p]?.title || title}</b>}
            {m0 && <div className="ph" style={{ background: m0.color, height: p === 'tiktok' ? 260 : 150 }}>{m0.kind}: {m0.name}{mediaIds.length > 1 && ` +${mediaIds.length - 1}`}</div>}
            <p>{cap(p) || <i className="muted">Your caption…</i>}</p><p style={{ color: c.color }}>{draft.hashtags.slice(0, c.hashtagMax).join(' ')}</p>{link && c.supportsLink && <p><u>{link}</u></p>}
            {sponsorIds.length > 0 && <small className="muted">Sponsor tags: {sponsors.filter(s => sponsorIds.includes(s.id)).map(s => '@' + s.company.split(' ')[0]).join(' ')}</small>}</div>) })()}</> : <p className="muted">No destinations selected.</p>}</Card>
      <Card title="Publish">
        <label className="field"><span>Schedule for</span><input className="input" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></label>
        <div className="row wrap" style={{ marginTop: '.5rem' }}>
          <button className="btn" disabled={busy} onClick={() => run('draft')}>Save draft</button>
          <button className="btn" disabled={busy} onClick={() => run('review')}>Submit for review</button>
          <button className="btn" disabled={busy || !canSchedule} title={canSchedule ? '' : 'Needs Social Media Manager / Administrator'} onClick={() => run('schedule')}>Schedule</button>
          <button className="btn primary" disabled={busy || !canPublish} title={canPublish ? '' : 'Needs Administrator'} onClick={() => run('publish')}>Publish now</button></div>
        <p className="muted">Viewing as {role}. {canPublish ? '' : 'Publishing needs Administrator; in the real flow your draft goes to review → approval.'}{blocked && plats.length > 0 ? ' Errors above block publishing/scheduling.' : ''}</p></Card>
    </div></div></>)
}
