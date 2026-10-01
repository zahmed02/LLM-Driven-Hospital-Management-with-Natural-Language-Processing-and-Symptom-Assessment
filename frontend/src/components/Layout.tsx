import { NavLink, useLocation, useOutlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationBell from './NotificationBell';
import { useAuth } from '../auth/AuthContext';

const pageVariants = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
interface NavItem { to: string; label: string; icon: string; }

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const navItems: NavItem[] = [];
  if (role === 'patient' || role === 'admin') navItems.push({ to: '/', label: 'Care Assistant', icon: 'smart_toy' });
  navItems.push({ to: '/doctors', label: 'Care team', icon: 'medical_services' });
  navItems.push({ to: '/calendar', label: role === 'doctor' ? 'My schedule' : role === 'admin' ? 'Calendar' : 'Appointments', icon: 'calendar_month' });
  if (role === 'doctor') navItems.push({ to: '/slips', label: 'Visit documents', icon: 'description' });
  if (role === 'admin') navItems.push({ to: '/admin', label: 'Operations', icon: 'admin_panel_settings' });

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-outline-variant bg-surface-bright/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-4 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white"><span className="material-symbols-outlined">health_and_safety</span></div>
            <div><p className="text-sm font-semibold tracking-tight text-on-surface">Stellaris Health</p><p className="hidden text-[10px] uppercase tracking-[.14em] text-on-surface-variant sm:block">Clinical operations portal</p></div>
          </div>
          <div className="flex items-center gap-3">
            {role === 'doctor' && <NotificationBell />}
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-on-surface">{user?.username}</p><p className="eyebrow">{role} access</p></div>
            <button onClick={handleLogout} title="Sign out" className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"><span className="material-symbols-outlined">logout</span></button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 border-r border-outline-variant bg-surface-bright lg:flex lg:flex-col">
        <div className="border-b border-outline-variant px-5 py-5"><p className="eyebrow">Workspace</p><p className="mt-1 text-sm font-semibold text-on-surface">{role === 'admin' ? 'Hospital administration' : role === 'doctor' ? 'Provider workspace' : 'Patient portal'}</p></div>
        <nav className="flex flex-1 flex-col gap-1 p-3">{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}><span className="material-symbols-outlined">{item.icon}</span>{item.label}</NavLink>)}</nav>
        <div className="m-3 rounded-lg bg-surface-container-low p-3"><p className="eyebrow">Need urgent help?</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">For emergencies, call 911.</p><button className="mt-3 w-full rounded-md bg-error px-3 py-2 text-xs font-semibold text-white">Emergency services</button></div>
      </aside>

      <main className="pb-20 pt-20 lg:ml-64 lg:pb-8"><div className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1440px] px-4 md:px-7"><AnimatePresence mode="wait"><motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: .2 }}>{outlet}</motion.div></AnimatePresence></div></main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-outline-variant bg-surface-bright/95 px-2 py-2 backdrop-blur lg:hidden">{navItems.slice(0, 4).map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-1 text-[10px] ${isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined">{item.icon}</span>{item.label}</NavLink>)}</nav>
    </div>
  );
}
