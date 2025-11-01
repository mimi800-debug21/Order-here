import './globals.css'
import { NeonOrderProvider } from '../context/NeonOrderContext'
import InitDB from './init-db'

export const metadata = {
  title: 'Gerichte – Client & Admin',
  description: 'Food ordering application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <InitDB />
        <NeonOrderProvider>
          {children}
        </NeonOrderProvider>
      </body>
    </html>
  )
}