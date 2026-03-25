import { Outlet } from 'react-router-dom'

export function MainLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500">{subtitle}</p>}
      </header>

      <main>
        <Outlet />
        {children}
      </main>
    </div>
  );
}