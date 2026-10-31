import { useEffect, useState } from 'react'
import { FORMAT_LABEL, LANGS } from '../state/model'
import { sel, useStore } from '../state/store'
import { Banner, Btn, Dialog, Icon, IconBtn, Player, Waveform, inr, mmss, useTimer } from '../ui/kit'

/* Leaving a session with local recordings: save for later or discard (with confirmation). */
export function LeaveFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, a } = useStore()
  const [confirm, setConfirm] = useState(false)
  if (!open || !s.session) return null
  const n = s.session.clips.filter((c) => c.state !== 'ready').length
  if (confirm)
    return (
      <Dialog
        title={`Discard ${n} recorded ${n === 1 ? 'clip' : 'clips'}?`}
        actions={
          <>
            <Btn v="danger" full onClick={a.discard}>
              Discard permanently
            </Btn>
            <Btn v="text" full onClick={() => setConfirm(false)}>
              Keep them
            </Btn>
          </>
        }
      >
        These clips exist only on this phone and were never submitted. Discarding deletes them now and can't be undone. No payout is attached to them.
      </Dialog>
    )
  return (
    <Dialog
      title="Leave the studio?"
      actions={
        <>
          <Btn full onClick={() => (onClose(), a.leaveSession())}>
            Save on device · resume within {s.session.resumeLeft}
          </Btn>
          <Btn v="outlined" full onClick={() => (n ? setConfirm(true) : a.discard())}>
            Discard session
          </Btn>
          <Btn v="text" full onClick={onClose}>
            Stay
          </Btn>
        </>
      }
    >
      {n > 0 ? `${n} ${n === 1 ? 'clip is' : 'clips are'} recorded on this device but not submitted.` : 'Nothing recorded yet.'} Your payout of {inr(s.session.locked.total)} stays locked while you can resume.
    </Dialog>
  )
}

export default function Studio() {
  const { s } = useStore()
  const sess = s.session
  const [leave, setLeave] = useState(false)
  if (!sess) return null
  const j = sel.job(s, sess.jobId)
  const room = j.format === 'ROOM'
  const done = sess.clips.filter((c) => c.state !== 'ready').length
  return (
    <div className="relative flex flex-1 flex-col">
      <header className="flex h-14 items-center gap-1 px-2">
        <IconBtn n="close" label="Leave studio" onClick={() => setLeave(true)} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{sess.repairOf ? `Repair · ${j.title}` : j.title}</div>
          <div className="text-[12px] text-ink-2">
            {FORMAT_LABEL[j.format]} · {LANGS[j.lang].native} · {inr(sess.locked.total)} locked
          </div>
        </div>
        <span className="num mr-3 inline-flex h-8 items-center rounded-full bg-surface px-3 text-[13px] font-semibold">
          {done}/{sess.clips.length}
        </span>
      </header>
      <div className="flex gap-1.5 px-5">
        {sess.clips.map((c, i) => (
          <span key={c.id} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${c.state !== 'ready' ? 'bg-ultra' : i === sess.index ? 'bg-peri' : 'bg-surface-variant'}`} />
        ))}
      </div>
      {room ? (
        <div className="flex flex-1 flex-col">{!sess.roomConsented ? <RoomConsent /> : <RoomCapture />}</div>
      ) : !sess.calibrated ? (
        <Calibrate />
      ) : (
        <Capture key={sess.index} />
      )}
      <LeaveFlow open={leave} onClose={() => setLeave(false)} />
    </div>
  )
}

type OrbState = 'speaking' | 'listening' | 'thinking' | 'idle' | 'alert'

/* The AI voice. Speaking: ripples out. Listening: swells with your level. Thinking: contracts. */
export function Orb({ state, level = 0, size = 184 }: { state: OrbState; level?: number; size?: number }) {
  const scale = state === 'listening' ? 1 + Math.min(0.14, level * 0.18) : 1
  return (
    <div className={`relative grid place-items-center ${state === 'speaking' ? 'orb-speaking' : ''}`} style={{ width: size, height: size }} aria-hidden>
      {state === 'speaking' && [0, 0.6, 1.2].map((d) => <span key={d} className="orb-ripple absolute inset-0 rounded-full border-2 border-ultra/40" style={{ animationDelay: `${d}s` }} />)}
      {state === 'listening' && <span className="absolute inset-[-14px] rounded-full bg-ultra/10 transition-transform duration-150 ease-out" style={{ transform: `scale(${scale})` }} />}
      {state === 'alert' && <span className="absolute inset-[-10px] rounded-full ring-2 ring-signal/50" />}
      <div className={`orb relative h-full w-full overflow-hidden rounded-full transition-[transform,filter] duration-300 ease-out ${state === 'thinking' ? 'orb-think' : state === 'idle' ? 'orb-idle' : ''}`} style={{ transform: state === 'listening' ? `scale(${scale})` : state === 'alert' ? 'scale(0.9)' : undefined, filter: state === 'alert' ? 'saturate(0.35) brightness(1.05)' : undefined }}>
        <span className="orb-sheen absolute inset-0 rounded-full" />
      </div>
    </div>
  )
}

function useLevel(on: boolean, base = 0.55) {
  const [l, setL] = useState(0)
  useEffect(() => {
    if (!on) return setL(0)
    const t = setInterval(() => setL(base + (Math.random() - 0.5) * 0.35), 120)
    return () => clearInterval(t)
  }, [on, base])
  return l
}

/* Types an AI line out word by word while the orb is speaking. */
function useSpeak(text: string, on: boolean, onDone: () => void) {
  const words = text.split(' ')
  const [n, setN] = useState(on ? 0 : words.length)
  useEffect(() => {
    if (!on) return setN(words.length)
    setN(0)
    let i = 0
    const t = setInterval(() => {
      i++
      setN(i)
      if (i >= words.length) (clearInterval(t), setTimeout(onDone, 350))
    }, 140)
    return () => clearInterval(t)
  }, [text, on])
  return words.slice(0, n).join(' ')
}

function Calibrate() {
  const { a } = useStore()
  const [step, setStep] = useState(0)
  const [rec, setRec] = useState(false)
  const level = useLevel(rec)
  const phrases = ['“Ek, do, teen, char, paanch.”', '“Aaj mausam accha hai.”']
  useEffect(() => {
    if (!rec) return
    const t = setTimeout(() => {
      setRec(false)
      if (step === 1) a.calibrated()
      else setStep(1)
    }, 2200)
    return () => clearTimeout(t)
  }, [rec, step])
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-8 pb-8 text-center">
      <span className="inline-flex h-7 items-center rounded-full bg-surface px-3 text-[12px] font-semibold text-ink-2">Level check · {step + 1} of 2</span>
      <div className="mt-8">
        <Orb state={rec ? 'listening' : 'idle'} level={level} size={148} />
      </div>
      <h2 className="mt-8 max-w-[26ch] text-[22px] leading-tight font-semibold text-balance">Hold the phone about 15 cm from your mouth and say</h2>
      <p className="mt-3 text-[24px] leading-snug font-medium text-ultra">{phrases[step]}</p>
      <p className="mt-4 h-5 text-[14px] text-ink-2">{rec ? (level > 0.3 ? 'Good level. Keep going.' : 'A little louder.') : 'This check is not submitted or paid.'}</p>
      <div className="mt-auto pt-8">
        <RecordButton on={rec} onClick={() => setRec(true)} />
      </div>
    </div>
  )
}

function RecordButton({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={on ? 'Stop recording' : 'Start recording'} className={`grid h-[76px] w-[76px] place-items-center rounded-full transition-[background-color,box-shadow,scale] duration-200 ease-out active:scale-95 disabled:opacity-35 ${on ? 'bg-ink shadow-[0_0_0_8px_rgba(14,15,20,.08)]' : 'bg-ultra shadow-[0_14px_30px_-10px_rgba(43,59,255,.7)]'}`}>
      {on ? <span className="h-6 w-6 rounded-[7px] bg-white" /> : <Icon n="mic" s={28} className="text-white" />}
    </button>
  )
}

type Phase = 'ai' | 'idle' | 'recording' | 'paused' | 'noise' | 'silence' | 'thinking' | 'recorded' | 'miclost' | 'loadfail' | 'loading'

function Capture() {
  const { s, a } = useStore()
  const sess = s.session!
  const j = sel.job(s, sess.jobId)
  const clip = sess.clips[sess.index]
  const aiLine = clip.prompt.stem ?? j.situation
  const [phase, setPhase] = useState<Phase>(clip.state === 'recorded_local' ? 'recorded' : 'ai')
  const [t, setT] = useTimer(phase === 'recording')
  const [noiseShown, setNoiseShown] = useState(false)
  const level = useLevel(phase === 'recording')
  const said = useSpeak(aiLine, phase === 'ai', () => setPhase('idle'))

  // Prototype hooks from the Simulate panel
  useEffect(() => {
    const on = (e: Event) => {
      const k = (e as CustomEvent).detail
      if (k === 'mic-lost') setPhase('miclost')
      if (k === 'prompt-fail') setPhase('loadfail')
    }
    window.addEventListener('feul:sim', on)
    return () => window.removeEventListener('feul:sim', on)
  }, [])
  const retryLine = () => {
    setPhase('loading')
    setTimeout(() => setPhase('ai'), 1100)
  }

  // Deterministic noise event on the second clip, first attempt: shows the noise-pause state.
  useEffect(() => {
    if (phase === 'recording' && sess.index === 1 && !noiseShown && !sess.repairOf && t >= 3) {
      setNoiseShown(true)
      setPhase('noise')
    }
  }, [t, phase])

  const stop = () => {
    if (t < 2) return setPhase('silence')
    a.setClip(sess.index, { state: 'recorded_local', secs: t })
    setPhase('thinking')
    setTimeout(() => setPhase('recorded'), 900)
  }
  const next = () => {
    const nxt = sess.clips.findIndex((c, i) => i > sess.index && c.state === 'ready')
    const any = sess.clips.findIndex((c, i) => i !== sess.index && c.state === 'ready')
    if (nxt >= 0) a.goClip(nxt)
    else if (any >= 0) a.goClip(any)
    else a.toReview()
  }
  const allDone = sess.clips.every((c, i) => c.state !== 'ready' || (i === sess.index && (phase === 'recorded' || phase === 'thinking')))
  const orb: OrbState = phase === 'ai' ? 'speaking' : phase === 'recording' ? 'listening' : phase === 'thinking' || phase === 'loading' ? 'thinking' : phase === 'noise' || phase === 'miclost' || phase === 'loadfail' ? 'alert' : 'idle'
  // When something goes wrong, the AI says so in its own voice instead of a system banner.
  const aiAside: Partial<Record<Phase, string>> = {
    noise: `I lost you for a second, a loud sound came through. Your ${t}s so far is saved. Move somewhere quieter and carry on?`,
    silence: 'I only caught a couple of seconds. Say a little more, like you would to them.',
    miclost: `Your microphone stopped, maybe another app took it. Your ${t}s so far is saved on this phone.`,
    loadfail: "I couldn't load my next line. Check your connection and I'll try again.",
    loading: 'One moment…',
  }
  const aside = aiAside[phase]
  const who = j.format === 'INTERVIEW' ? 'Interviewer' : sess.index === 0 && !clip.prompt.stem ? 'Feul' : 'The other person'
  const status =
    phase === 'noise' ? 'Paused · too noisy' : phase === 'miclost' ? 'Microphone disconnected' : phase === 'loadfail' ? 'Offline' : phase === 'loading' ? 'Reconnecting…' : phase === 'silence' ? 'Too short to save' : phase === 'ai' ? 'Speaking…' : phase === 'recording' ? (level < 0.3 ? 'Listening · a little louder' : 'Listening') : phase === 'paused' ? 'Paused · your take so far is kept' : phase === 'thinking' ? 'Thinking of a follow-up…' : phase === 'recorded' ? 'Got it · saved on this device' : 'Your turn'

  return (
    <div className="flex flex-1 flex-col px-5 pt-6 pb-7">
      <div className="flex flex-col items-center">
        <Orb state={orb} level={level} />
        <div className="mt-5 flex h-6 items-center gap-2 text-[13px] font-medium text-ink-2">
          {phase === 'recording' && <span className="h-2 w-2 animate-pulse rounded-full bg-ultra motion-reduce:animate-none" />}
          {status}
          {(phase === 'recording' || phase === 'paused') && <span className="num text-ink">{mmss(t)}</span>}
        </div>
      </div>

      {/* What the AI said */}
      <div className="mt-5 rounded-[24px] bg-surface p-4 shadow-[0_1px_2px_rgba(14,15,20,.04)]">
        <div className="flex items-center justify-between">
          <span className={`text-[12px] font-semibold ${aside ? 'text-[#c2410c]' : 'text-ultra'}`}>{aside ? 'Feul' : who}</span>
          {!aside && phase !== 'ai' && (
            <button onClick={() => setPhase('ai')} disabled={phase === 'recording'} className="-m-2 inline-flex items-center gap-1 p-2 text-[12px] font-medium text-ink-2 disabled:opacity-40">
              <Icon n="retry" s={13} /> Hear again
            </button>
          )}
        </div>
        <p className="mt-1.5 min-h-[48px] text-[18px] leading-snug font-medium text-pretty">
          {aside ?? said}
          {phase === 'ai' && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-ultra" />}
        </p>
      </div>

      {/* Hint for your answer */}
      <div className={`mt-3 flex gap-3 rounded-[24px] bg-primary-soft p-4 transition-opacity duration-300 ${phase === 'ai' || aside ? 'opacity-40' : ''}`}>
        <Icon n="mic" s={18} className="mt-0.5 shrink-0 text-ultra" />
        <div>
          <div className="text-[12px] font-semibold text-on-primary-soft">Your reply · {sess.index + 1} of {sess.clips.length}</div>
          <p className="mt-0.5 text-[15px] leading-snug text-ink">{clip.prompt.text}</p>
        </div>
      </div>

      <div className="mt-auto pt-6">
        {phase === 'noise' || phase === 'miclost' ? (
          <div className="flex gap-2">
            <Btn full size="lg" onClick={() => setPhase('recording')}>{phase === 'miclost' ? 'Reconnect and continue' : 'Continue'}</Btn>
            <Btn size="lg" v="outlined" onClick={() => (setT(0), setPhase('idle'))}>Retake</Btn>
          </div>
        ) : phase === 'silence' ? (
          <Btn full size="lg" icon="mic" onClick={() => (setT(0), setPhase('idle'))}>Try again</Btn>
        ) : phase === 'loadfail' || phase === 'loading' ? (
          <Btn full size="lg" icon="retry" disabled={phase === 'loading'} onClick={retryLine}>{phase === 'loading' ? 'Trying again…' : 'Try again'}</Btn>
        ) : (
          <div className="grid grid-cols-3 items-center">
            <div>
              {phase === 'recording' && (
                <button onClick={() => setPhase('paused')} className="flex items-center gap-2 text-[14px] font-medium text-ink-2">
                  <Icon n="pause" s={16} /> Pause
                </button>
              )}
              {phase === 'paused' && (
                <button onClick={() => setPhase('recording')} className="text-[14px] font-semibold text-ultra">
                  Continue
                </button>
              )}
              {phase === 'recorded' && (
                <button onClick={() => (a.setClip(sess.index, { state: 'ready', secs: 0 }), setT(0), setPhase('idle'))} className="flex items-center gap-2 text-[14px] font-medium text-ink-2">
                  <Icon n="retry" s={16} /> Retake
                </button>
              )}
            </div>
            <div className="flex justify-center">
              {phase === 'recorded' ? (
                <button onClick={next} className="grid h-[76px] w-[76px] place-items-center rounded-full bg-ink text-white transition-transform active:scale-95" aria-label={allDone ? 'Check your takes' : 'Next turn'}>
                  <Icon n={allDone ? 'check' : 'chev'} s={28} />
                </button>
              ) : (
                <RecordButton on={phase === 'recording' || phase === 'paused'} disabled={phase === 'ai' || phase === 'thinking'} onClick={() => (phase === 'idle' ? setPhase('recording') : stop())} />
              )}
            </div>
            <div className="text-right text-[13px] font-medium text-ink-2">{phase === 'recorded' ? (allDone ? 'Check takes' : 'Next turn') : phase === 'idle' ? 'Tap to reply' : ''}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomConsent() {
  const { s, a } = useStore()
  const j = sel.job(s, s.session!.jobId)
  const [ok, setOk] = useState<boolean[]>([true, false, false])
  const [minor, setMinor] = useState<number | null>(null)
  return (
    <div className="flex flex-1 flex-col px-6 pt-6 pb-8">
      <div className="text-[13px] font-medium text-ink-2">Room · everyone consents first</div>
      <h2 className="mt-3 text-[24px] leading-tight font-semibold">Each person hears the consent in {LANGS[j.lang].name} and confirms they are 18+.</h2>
      <p className="mt-2 text-[14px] text-ink-2">The microphone stays off until all {j.participants} people have consented.</p>
      <ul className="mt-6 space-y-2">
        {ok.map((v, i) => (
          <li key={i} className="rounded-[24px] bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${v ? 'bg-ultra text-white' : 'bg-primary-soft text-on-primary-soft num text-[14px] font-semibold'}`}>{v ? <Icon n="check" s={16} /> : i + 1}</span>
              <div className="flex-1">
                <div className="font-semibold">{i === 0 ? 'You' : `Participant ${i + 1}`}</div>
                <div className="text-[13px] text-ink-2">{v ? 'Consented · 18+' : minor === i ? 'Under 18 · cannot take part' : 'Not yet'}</div>
              </div>
              {!v && minor !== i && (
                <div className="flex gap-1.5">
                  <Btn size="sm" v="filled" onClick={() => setOk(ok.map((x, k) => (k === i ? true : x)))}>
                    Consents
                  </Btn>
                  <Btn size="sm" v="text" className="text-ink-2" onClick={() => setMinor(i)}>
                    Under 18
                  </Btn>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {minor != null && (
        <p className="mt-3 rounded-[24px] bg-signal-soft p-4 text-[14px] text-[#c2410c]">Feul is for adults only right now. Invite another adult to join, or save this session and come back within 24h.</p>
      )}
      {minor != null && (
        <button onClick={() => (setMinor(null), setOk(ok.map((x, k) => (k === minor ? false : x))))} className="mt-2 self-start text-[14px] text-primary">
          Another adult will join instead
        </button>
      )}
      <div className="mt-auto pt-8">
        <Btn full size="lg" v="filled" disabled={!ok.every(Boolean)} onClick={a.roomConsented}>
          {ok.every(Boolean) ? 'Everyone consented · continue' : `Waiting for ${ok.filter((x) => !x).length} more`}
        </Btn>
      </div>
    </div>
  )
}

function RoomCapture() {
  const { s, a } = useStore()
  const sess = s.session!
  const [rec, setRec] = useState(false)
  const [spk, setSpk] = useState(0)
  const [t] = useTimer(rec)
  const level = useLevel(rec, 0.5)
  const end = () => {
    sess.clips.forEach((_, i) => a.setClip(i, { state: 'recorded_local', secs: Math.max(20, Math.round(t / sess.clips.length)) }))
    setRec(false)
    a.toReview()
  }
  return (
    <div className="flex flex-1 flex-col px-6 pt-6 pb-8">
      <div className="text-[13px] font-medium text-ink-2">One continuous take</div>
      <h2 className="mt-3 text-[22px] leading-snug font-medium">Talk about your weekend plans. Move on when the conversation does, there's no fixed timer.</h2>
      <ul className="mt-6 space-y-2">
        {sess.clips.map((c, i) => (
          <li key={c.id} className={`flex items-center gap-3 rounded-[24px] p-3.5 transition-[background-color,box-shadow,opacity] duration-200 ${i === spk && rec ? 'bg-surface shadow-[0_0_0_2px_var(--color-ultra)]' : 'bg-surface'} ${i < spk ? 'opacity-60' : ''}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${i === spk && rec ? 'bg-ultra animate-pulse motion-reduce:animate-none' : i < spk ? 'bg-ink-3' : 'bg-surface ring-1 ring-line-strong'}`} />
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{c.prompt.speaker}</div>
              <div className="text-[13px] text-ink-2">{c.prompt.text}</div>
            </div>
            <span className="text-[12px] text-ink-2">{i === spk && rec ? 'Speaking' : i < spk ? 'Spoke' : 'Up next'}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <div className="flex justify-center"><Orb state={rec ? 'listening' : 'idle'} level={level} size={120} /></div>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex-1">
            <Meter level={level} />
          </div>
          <span className="num text-[14px] font-medium">{mmss(t)}</span>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button disabled={!rec} onClick={() => setSpk((x) => (x + 1) % sess.clips.length)} className="text-[14px] font-medium text-primary disabled:text-ink-3">
            Next speaker →
          </button>
          <RecordButton on={rec} onClick={() => (rec ? end() : setRec(true))} />
          <span className="w-24 text-right text-[13px] text-ink-2">{rec ? 'Tap to end take' : 'Start take'}</span>
        </div>
      </div>
    </div>
  )
}
function Meter({ level }: { level: number }) {
  return (
    <div className="flex h-2 gap-[3px]" aria-label="Microphone level">
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={`flex-1 rounded-sm ${i / 20 < level ? (i > 16 ? 'bg-err' : i > 12 ? 'bg-[#f0b43c]' : 'bg-ultra') : 'bg-surface-variant'}`} />
      ))}
    </div>
  )
}
