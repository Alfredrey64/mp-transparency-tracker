import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import { startAnalytics } from './lib/analytics.js'
import { installChunkReload } from './lib/chunkReload.js'
import { registerOffline } from './lib/offline.js'
import { startBalancingBoxes } from './lib/balanceBoxes.js'
import { installRouting } from './lib/route.js'
import { start as startDisplay } from './lib/display.js'
import { installDetailsMotion } from './lib/detailsMotion.js'

// The footer waits until the first page has settled (see AfterSettle in App.jsx); if that never happens it comes back anyway.
document.documentElement.dataset.settling = '1'
setTimeout(() => { delete document.documentElement.dataset.settling }, 10000)

installRouting()
startDisplay()
startAnalytics()
installChunkReload()
registerOffline()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// Every fold-out opens and closes with a short height movement (lib/detailsMotion.js).
installDetailsMotion()

// Rows of boxes are tidied after they are drawn (see lib/balanceBoxes.js).
startBalancingBoxes()

// Printing or saving as PDF: open every fold-out first, so the page prints in full.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details').forEach((d) => { d.open = true })
})
