import './globals.css'
import { ApiOrderProvider } from '../context/ApiOrderContext'
import DbInitializer from '../components/DbInitializer'

export const metadata = {
  title: 'Gerichte – Client & Admin',
  description: 'Food ordering application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <DbInitializer />
        <ApiOrderProvider>
          {children}
        </ApiOrderProvider>
      </body>
    </html>
  )
}