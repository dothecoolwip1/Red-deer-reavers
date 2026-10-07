import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Card, PageHeader, Mock, Empty } from '../components/ui'
import { useColl, patchItem, toast } from '../services/store'
import { money, fmtDate } from '../utils/format'
import { cx } from '../utils/format'

const STEPS = ['Choose Grant', 'Select Project', 'Pull Org Info', 'Grant-Specific Questions', 'Review', 'Ready to Submit'] as const
export default function GrantBuilder() {
  const [sp] = useSearchParams(); const grants = useColl('grants'); const programs = useColl('programs'); const lib = useColl('library')
  const [step, setStep] = useState(sp.get('grant') ? 1 : 0); const [gid, setGid] = useState(sp.get('grant') ?? ''); const [pid, setPid] = useState('')
  const [pulled, setPulled] = useState<string[]>([]); const [answers, setAnswers] = useState<Record<string, string>>({}); const [done, setDone] = useState(false)
  const g = grants.find(x => x.id === gid); const p = programs.find(x => x.id === (pid || g?.programId))
  const questions = ['Describe the project and its goals.', 'How will this funding be spent?', 'Who will benefit, and how will you measure success?', 'Describe your volunteer/staff capacity.']
  const next = () => setStep(s => Math.min(5, s + 1)); const back = () => setStep(s => Math.max(0, s - 1))
  return (<>
    <PageHeader title="Grant Application Builder" subtitle="Reusable answers library + guided workflow (no AI, no real grant systems)" />
    <Mock />
    <div className="steps">{STEPS.map((s, i) => <span key={s} className={cx('step', i === step && 'on', i < step && 'done')}>{i + 1}. {s}</span>)}</div>
    {step === 0 && <Card title="1. Choose grant"><ul className="list">{grants.filter(x => ['Researching', 'Eligible', 'Planning', 'Drafting', 'Ready'].includes(x.status)).map(x => <li key={x.id}><span><b>{x.name}</b><br /><span className="muted">due {fmtDate(x.deadline)} · max {money(x.max)}</span></span><button className={'btn sm ' + (gid === x.id ? 'primary' : '')} onClick={() => { setGid(x.id); setPid(x.programId ?? '') }}>{gid === x.id ? 'Selected' : 'Select'}</button></li>)}</ul></Card>}
    {step === 1 && <Card title="2. Select project"><div className="row wrap">{programs.map(x => <button key={x.id} className={'btn ' + ((pid || g?.programId) === x.id ? 'primary' : '')} onClick={() => setPid(x.id)}>{x.name}</button>)}</div>{p && <p className="muted">{p.goal} · budget {money(p.budget)}</p>}</Card>}
    {step === 2 && <Card title="3. Pull standard organization information" actions={<button className="btn sm" onClick={() => setPulled(lib.map(l => l.id))}>Pull all</button>}>
      <ul className="list">{lib.map(l => <li key={l.id}><div><b>{l.topic}</b><div className="muted">{l.text}</div></div><label><input type="checkbox" checked={pulled.includes(l.id)} onChange={() => setPulled(x => x.includes(l.id) ? x.filter(y => y !== l.id) : [...x, l.id])} /> use</label></li>)}</ul></Card>}
    {step === 3 && <Card title="4. Grant-specific questions">{questions.map(q => <label key={q} className="field"><span>{q}</span><textarea className="input" rows={3} value={answers[q] ?? ''} onChange={e => setAnswers(a => ({ ...a, [q]: e.target.value }))} /></label>)}</Card>}
    {step === 4 && <Card title="5. Review"><p><b>Grant:</b> {g?.name ?? <Badge tone="bad">none selected</Badge>}</p><p><b>Project:</b> {p?.name ?? '—'}</p><p><b>Standard sections pulled:</b> {pulled.length}/{lib.length}</p><p><b>Questions answered:</b> {Object.values(answers).filter(Boolean).length}/{questions.length}</p>
      {pulled.map(i => { const l = lib.find(x => x.id === i)!; return <p key={i}><b>{l.topic}.</b> {l.text}</p> })}{Object.entries(answers).map(([q, a]) => a && <p key={q}><b>{q}</b><br />{a}</p>)}</Card>}
    {step === 5 && <Card title="6. Ready to submit">{done ? <p><Badge tone="good">Marked ready</Badge> Grant status updated to "Ready" (mock). Nothing was sent anywhere.</p> : <><p>Everything assembled. In the real system you would export the package or submit through the funder portal.</p><button className="btn primary" disabled={!g} onClick={() => { patchItem('grants', g!.id, { status: 'Ready', progress: 90 }); setDone(true); toast('Grant marked Ready (mock)') }}>Mark grant Ready</button></>}</Card>}
    <div className="row" style={{ marginTop: '.6rem' }}><button className="btn" disabled={step === 0} onClick={back}>← Back</button><button className="btn primary" disabled={step === 5 || (step === 0 && !gid)} onClick={next}>Next →</button></div>
    <Card title="Reusable answer library (editable)" className="no-print"><p className="muted">Single source for standard answers. Click to edit.</p>{lib.map(l => <label key={l.id} className="field"><span>{l.topic} <span className="muted">updated {fmtDate(l.updated)}</span></span><textarea className="input" rows={2} defaultValue={l.text} onBlur={e => patchItem('library', l.id, { text: e.target.value, updated: '2026-10-07' })} /></label>)}{!lib.length && <Empty />}</Card>
  </>)
}
