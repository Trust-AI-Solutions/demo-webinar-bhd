// Monta la intro animada en la portada (index.html). Se compila a
// public/intro/intro.js con `npm run intro`; el sitio no necesita compilar nada.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Intro from './Intro'

function App() {
  // Cambiar la clave vuelve a montar la escena: así "Ver de nuevo" la repite desde el inicio
  const [vuelta, setVuelta] = useState(0)
  ;(window as unknown as { repetirIntro: () => void }).repetirIntro = () => setVuelta((n) => n + 1)
  return <Intro key={vuelta} />
}

const lugar = document.getElementById('intro-escena')
if (lugar) createRoot(lugar).render(<App />)
