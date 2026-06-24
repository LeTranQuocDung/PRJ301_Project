import { useState } from 'react'
import LoginPage from './LoginPage.jsx'
import AdminApp from './AdminApp.jsx'
import UserApp from './UserApp.jsx'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lucy_user')) } catch { return null }
  })

  const handleLogin = (u) => {
    localStorage.setItem('lucy_user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('lucy_user')
    setUser(null)
  }

  if (!user) return <LoginPage onLogin={handleLogin} />
  if (user.role === 'admin' || user.role === 'teacher') return <AdminApp user={user} onLogout={handleLogout} />
  return <UserApp user={user} onLogout={handleLogout} />
}
