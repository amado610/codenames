import { League_Gothic, Courier_Prime } from 'next/font/google'
import './globals.css'

// League Gothic: 60s film-poster display, very legible from the couch. Courier Prime: the typewriter on the dossier.
const display = League_Gothic({ subsets: ['latin'], variable: '--font-display' })
const typewriter = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-type' })

export const metadata = { title: 'Codenames' }
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#101a16' }

export default function RootLayout({ children }) {
  return (
    <html lang="pt-PT" className={`${display.variable} ${typewriter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
