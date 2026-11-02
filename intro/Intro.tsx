import { Bar, Bubble, Collapse, Count, Field, Fly, Phone, Roll, Stage, Stamp, Stream, Text, Thread, Window, type Act, type Rect } from './kit'
import './lp.css'

// Intro de la demo de Ferretería Los Pinos (empresa ficticia), en el mundo
// "Carta de colores". Una historia de sistema con un cursor al final:
// el cliente pide por WhatsApp en el teléfono, el pedido viaja como una
// muestra al panel del negocio (la fila nueva abre y "Pedidos abiertos" sube
// de 10 a 11), y el dueño le pregunta al panel qué reponer; la respuesta sale
// de sus cifras. Se reproduce una vez y se queda en el resultado.
// Palabras reales: la conversación, el pedido, "Pedidos abiertos", la
// pregunta y la respuesta. Lo demás son barras.

const MSGS = [
  { from: 'me' as const, text: 'Buenas, ¿tienen cemento gris?' },
  { from: 'them' as const, text: 'Sí: cemento gris Portland a RD$640 el saco, más ITBIS.' },
  { from: 'me' as const, text: 'Mándeme 25 sacos a Villa Mella.' },
  { from: 'them' as const, text: 'Listo, su pedido quedó registrado:' },
]
const ORDER = 'P-1501 · RD$22,833'
const Q = '¿Qué tengo que reponer esta semana?'
const A = 'El cemento gris en Herrera: quedan 12 sacos y se venden unos 10 por día. Alcanza para 1 día.'
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
  // la lista mientras la muestra viaja; al llegar, el contador sube.
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
            <path d="M12 2 6.5 9h3L5 15h4.5L6 20h12l-3.5-5H19l-4.5-6h3z" fill="#fff" />
            <path d="M11 20h2v2h-2z" fill="#e0a526" />
          </svg>
        </span>
        <span className="lp-wa-name">
          Ferretería Los Pinos
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
        <span className="lp-swatch" data-chip="turquesa" />
        <Text className="lp-card__title">Pedidos nuevos</Text>
      </div>
      <div className="lp-list" data-target="list">
        <Collapse open={s.open} reveal="clip">
          <div className="lp-row lp-row--new" data-target="row-new" data-landed={s.landed || undefined}>
            <span className="lp-band" />
            <span className="lp-row__name">Carlos Gómez</span>
            <span className="lp-tag">WhatsApp</span>
            <span className="lp-pill" data-target="pill-new">
              {ORDER}
            </span>
          </div>
        </Collapse>
        {OLD.map((r, i) => (
          <div key={i} className="lp-row">
            <Bar w={12} h={12} r={2} tone={2} />
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
        <aside className="lp-carta">
          <span className="lp-marca">Ferretería Los Pinos</span>
          {[
            { chip: 'pino', w: 40, on: true },
            { chip: 'ozama', w: 48 },
            { chip: 'cemento', w: 58 },
            { chip: 'terracota', w: 66 },
            { chip: 'turquesa', w: 50 },
            { chip: 'oxido', w: 44 },
          ].map((n, i) => (
            <div key={i} className="lp-tira" data-chip={n.chip} data-on={n.on || undefined}>
              {n.on ? <span className="lp-tira__txt">Inicio</span> : (
                <>
                  <span className="lp-swatch" />
                  <Bar w={n.w} h={6} tone={2} />
                </>
              )}
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
                <div className="lp-answer__band">Respuesta con sus cifras</div>
                <div className="lp-answer__body">
                  <Collapse open={s.phase === 'thinking'}>
                    <span className="lp-thinking">Revisando el inventario…</span>
                  </Collapse>
                  <Collapse open={s.phase === 'answer'}>
                    <Stream className="lp-stream" text={A} count={s.words} />
                  </Collapse>
                </div>
              </div>
            </Collapse>
          </div>
          <div className="lp-kpis">
            <div className="lp-kpi" data-chip="pino">
              <div className="lp-kpi__campo"><span className="lp-kpi__ph" style={{ width: 74 }} /></div>
              <div className="lp-kpi__etiqueta"><Bar w={56} h={6} tone={3} /></div>
            </div>
            <div className="lp-kpi" data-chip="turquesa">
              <div className="lp-kpi__campo">
                <Count className="lp-kpi__valor" value={s.pedidos} duration={800} />
              </div>
              <div className="lp-kpi__etiqueta"><span className="lp-kpi__nombre">Pedidos abiertos</span></div>
            </div>
            <div className="lp-kpi" data-chip="terracota">
              <div className="lp-kpi__campo"><span className="lp-kpi__ph" style={{ width: 82 }} /></div>
              <div className="lp-kpi__etiqueta"><Bar w={48} h={6} tone={3} /></div>
            </div>
          </div>
          <Pedidos s={s} />
        </main>
      </div>
    </Window>
  )
}

export default function LosPinosIntro() {
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
