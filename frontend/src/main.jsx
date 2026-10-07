import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// Printing or saving as PDF: open every fold-out first, so the page prints in full.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details').forEach((d) => { d.open = true })
})
