import './globals.css'
import { ApiOrderProvider } from '../context/ApiOrderContext'

export const metadata = {
  title: 'Gerichte – Client & Admin',
  description: 'Food ordering application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <ApiOrderProvider>
          {children}
        </ApiOrderProvider>
      </body>
    </html>
  )
}