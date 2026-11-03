import { Bar, Bubble, Collapse, Count, Field, Fly, Phone, Roll, Stage, Stamp, Stream, Text, Thread, Window, type Act, type Rect } from './kit'
import './lp.css'

// Intro de la demo de Panadería El Trigal (empresa ficticia), con el mismo
// diseño sobrio del panel. Una historia de sistema con un cursor al final:
// una clienta encarga un bizcocho por WhatsApp, el encargo viaja como una
// pastilla al panel del negocio (la fila nueva abre y "Pedidos abiertos" sube
// de 10 a 11), y el dueño le pregunta al panel qué insumos comprar; la
// respuesta sale de sus cifras. Se reproduce una vez y se queda en el resultado.
// Palabras reales: la conversación, el pedido, "Pedidos abiertos", la
// pregunta y la respuesta. Lo demás son barras.

const MSGS = [
  { from: 'me' as const, text: 'Buenas, ¿a cómo está el bizcocho de 3 libras?' },
  { from: 'them' as const, text: 'Bizcocho dominicano de 3 libras: RD$1,850, más ITBIS. Se encarga con 24 horas.' },
  { from: 'me' as const, text: 'Apártenmelo para el sábado a las 3, que diga "Feliz cumpleaños, Ana".' },
  { from: 'them' as const, text: 'Listo, su encargo quedó registrado:' },
]
const ORDER = 'P-1501 · RD$2,183'
const Q = '¿Qué insumos tengo que comprar esta semana?'
const A = 'Mantequilla para Gazcue: quedan 2 cajas y se usan 1.5 por día. Alcanza para poco más de un día.'
const WORDS = A.split(' ').length

type S = {
  msgs: number
  typing: boolean
  open: boolean
  landed: boolean
  pedidos: number
  fly: null | { from: Rect; to: Rect; go: boolean }
  draft: string
  focused: boolean
  asked: boolean
  phase: 'idle' | 'thinking' | 'answer'
  words: number
}

const initial: S = { msgs: 0, typing: false, open: false, landed: false, pedidos: 10, fly: null, draft: '', focused: false, asked: false, phase: 'idle', words: 0 }
const poster: S = { ...initial, msgs: 4, open: true, landed: true, pedidos: 11, asked: true, draft: Q, phase: 'answer', words: WORDS }

async function reply(a: Act<S>, n: number, think: number) {
  await a.set({ typing: true, msgs: n - 1 })
  await a.wait(think)
  await a.set({ typing: false, msgs: n })
}

async function script(a: Act<S>) {
  await a.wait(700)
  a.mark('pide')
  await a.set({ msgs: 1 })
  await a.wait(500)
  await reply(a, 2, 1200)
  await a.wait(1300)
  await a.set({ msgs: 3 })
  await a.wait(500)
  await reply(a, 4, 1100)
  await a.wait(500)

  // El pedido sale del mensaje y viaja al panel: la fila nueva abre arriba de
  // la lista mientras la pastilla viaja; al llegar, el contador sube.
  a.mark('pedido')
  const list = a.rect('list', { layout: true })
  const row = a.rect('row-new', { layout: true })
  const pill = a.rect('pill-new', { layout: true })
  const src = a.rect('order', { layout: true })
  const to = { ...pill, y: list.y + pill.y - row.y }
  const from = { x: src.x + src.width / 2 - pill.width / 2, y: src.y + src.height / 2 - pill.height / 2, width: pill.width, height: pill.height }
  await a.set({ fly: { from, to, go: false } })
  await a.wait(250)
  await a.set((s) => ({ open: true, fly: { ...s.fly!, go: true } }))
  await a.wait(1000)
  await a.set({ fly: null, landed: true })
  await a.wait(250)
  await a.set({ pedidos: 11 })
  await a.wait(1200)

  if (a.layout === 'compact') {
    await a.wait(2400)
    return
  }

  // El dueño le pregunta al panel
  a.mark('pregunta')
  await a.click({ at: 'ask', x: 0.9, y: 0.5 })
  await a.set({ focused: true })
  await a.type('draft', Q, { interval: 40 })
  await a.wait(350)
  await a.key('Enter')
  await a.set({ asked: true, phase: 'thinking' })
  await a.wait(1100)
  a.mark('respuesta')
  await a.set({ phase: 'answer' })
  for (let i = 1; i <= WORDS; i++) {
    a.put({ words: i })
    await a.wait(55)
  }
  await a.wait(3000)
}

function WhatsApp({ s, width }: { s: S; width: number }) {
  return (
    <Phone width={width} frame="pro" dark wallpaper="linear-gradient(#075e54 0 128px, #efeae2 128px)" className="lp-phone">
      <div className="lp-wa-head">
        <span className="lp-wa-foto" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M12 22V6.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
            <g fill="#fff">
              <ellipse cx="12" cy="4.3" rx="1.7" ry="2.7" />
              <ellipse cx="9.2" cy="8.6" rx="1.5" ry="2.6" transform="rotate(-38 9.2 8.6)" />
              <ellipse cx="14.8" cy="8.6" rx="1.5" ry="2.6" transform="rotate(38 14.8 8.6)" />
              <ellipse cx="9.2" cy="12.8" rx="1.5" ry="2.6" transform="rotate(-38 9.2 12.8)" />
              <ellipse cx="14.8" cy="12.8" rx="1.5" ry="2.6" transform="rotate(38 14.8 12.8)" />
            </g>
            <g fill="#ebbb4c">
              <ellipse cx="9.2" cy="17" rx="1.5" ry="2.6" transform="rotate(-38 9.2 17)" />
              <ellipse cx="14.8" cy="17" rx="1.5" ry="2.6" transform="rotate(38 14.8 17)" />
            </g>
          </svg>
        </span>
        <span className="lp-wa-name">
          Panadería El Trigal
          <small><Roll variant="fade">{s.typing ? 'escribiendo…' : 'en línea'}</Roll></small>
        </span>
      </div>
      <Thread className="lp-thread">
        <Stamp>Hoy</Stamp>
        {MSGS.map((m, i) => {
          const shown = s.msgs > i
          const typingHere = s.typing && i === s.msgs && m.from === 'them'
          if (!shown && !typingHere) return null
          return (
            <Bubble key={i} from={m.from} typing={typingHere}>
              {i === 3 ? (
                <>
                  {m.text}{' '}
                  <b className="lp-order" data-target="order" data-gone={s.fly?.go || undefined}>
                    {ORDER}
                  </b>
                </>
              ) : (
                m.text
              )}
            </Bubble>
          )
        })}
      </Thread>
    </Phone>
  )
}

const OLD = [
  { a: 64, b: 46 },
  { a: 82, b: 40 },
  { a: 58, b: 44 },
]

function Pedidos({ s }: { s: S }) {
  return (
    <section className="lp-card lp-pedidos">
      <div className="lp-card__head">
        <Text className="lp-card__title">Pedidos nuevos</Text>
      </div>
      <div className="lp-list" data-target="list">
        <Collapse open={s.open} reveal="clip">
          <div className="lp-row lp-row--new" data-target="row-new" data-landed={s.landed || undefined}>
            <span className="lp-row__name">Ana Pérez</span>
            <span className="lp-tag">WhatsApp</span>
            <span className="lp-pill" data-target="pill-new">
              {ORDER}
            </span>
          </div>
        </Collapse>
        {OLD.map((r, i) => (
          <div key={i} className="lp-row">
            <Bar w={r.a} h={6} tone={3} />
            <Bar w={r.b} h={6} tone={2} style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </section>
  )
}

function Panel({ s }: { s: S }) {
  return (
    <Window title="Panel del negocio" className="lp-window">
      <div className="lp-body">
        <aside className="lp-nav">
          <span className="lp-marca">Panadería El Trigal</span>
          <div className="lp-item" data-on>Inicio</div>
          {[48, 58, 66, 50, 44].map((w, i) => (
            <div key={i} className="lp-item">
              <Bar w={w} h={6} tone={2} />
            </div>
          ))}
        </aside>
        <main className="lp-main">
          <div className="lp-ask">
            <Field
              className="lp-field"
              value={s.draft}
              placeholder="Pregúntele a su negocio"
              focused={s.focused && !s.asked}
              box={{ 'data-target': 'ask', 'data-cursor': 'ibeam' }}
            />
            {/* La respuesta abre en su lugar y empuja lo de abajo, sin taparlo */}
            <Collapse open={s.asked} reveal="drop">
              <div className="lp-answer">
                <div className="lp-answer__body">
                  <Collapse open={s.phase === 'thinking'}>
                    <span className="lp-thinking">Revisando los insumos…</span>
                  </Collapse>
                  <Collapse open={s.phase === 'answer'}>
                    <Stream className="lp-stream" text={A} count={s.words} />
                  </Collapse>
                </div>
              </div>
            </Collapse>
          </div>
          <div className="lp-kpis">
            <div className="lp-kpi">
              <Bar w={56} h={6} tone={2} />
              <span className="lp-kpi__ph" style={{ width: 74 }} />
            </div>
            <div className="lp-kpi">
              <span className="lp-kpi__nombre">Pedidos abiertos</span>
              <Count className="lp-kpi__valor" value={s.pedidos} duration={800} />
            </div>
            <div className="lp-kpi">
              <Bar w={48} h={6} tone={2} />
              <span className="lp-kpi__ph" style={{ width: 82 }} />
            </div>
          </div>
          <Pedidos s={s} />
        </main>
      </div>
    </Window>
  )
}

export default function ElTrigalIntro() {
  return (
    <Stage<S>
      width={1000}
      height={540}
      fill
      compact={{ below: 720, width: 358, height: 620 }}
      initial={initial}
      poster={poster}
      script={script}
      play="once"
      cursor={{ at: { wide: { x: 360, y: 470 }, compact: { x: 330, y: 600 } }, style: 'real' }}
      keys="bottom-left"
      className="lp"
    >
      {(s, _rect, layout) => (
        <>
          {layout === 'wide' ? <Panel s={s} /> : <div className="lp-mini"><Pedidos s={s} /></div>}
          <WhatsApp s={s} width={layout === 'wide' ? 340 : 300} />
          {s.fly && (
            <Fly from={s.fly.from} to={s.fly.to} go={s.fly.go} held duration={1000}>
              <span className="lp-pill lp-pill--chip">{ORDER}</span>
            </Fly>
          )}
        </>
      )}
    </Stage>
  )
}
