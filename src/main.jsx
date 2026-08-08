import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

function revealFontWhenReady(className, descriptor, sample) {
  if (!document.fonts) {
    document.documentElement.classList.add(className)
    return
  }

  document.fonts.load(descriptor, sample).then((loadedFaces) => {
    const ready = loadedFaces.length > 0 && document.fonts.check(descriptor, sample)
    document.documentElement.classList.toggle(className, ready)
  }).catch(() => {
    document.documentElement.classList.remove(className)
  })
}

revealFontWhenReady('scudo-ahsing-ready', '400 126px "Scudo Ahsing"', 'scudo')
revealFontWhenReady('scudo-display-ready', '900 104px "Scudo Recoleta"', 'Armour everyday')

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
