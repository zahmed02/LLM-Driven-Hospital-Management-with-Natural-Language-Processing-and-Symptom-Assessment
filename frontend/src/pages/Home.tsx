import { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import { useAuth } from '../auth/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [adminTargetPatientId, setAdminTargetPatientId] = useState<number | undefined>();
  const effectivePatientId = user?.role === 'admin' ? adminTargetPatientId : user?.patientId ?? undefined;
  return <div className="mx-auto max-w-5xl">
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="eyebrow">Patient access · AI-assisted</p><h1 className="page-title mt-1">Care assistant</h1><p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Ask about appointments, departments, preparation instructions, or finding the right specialist.</p></div>
      {user?.role === 'admin' && <label className="medical-card flex items-center gap-3 px-3 py-2 text-xs font-medium text-on-surface-variant">Acting for patient ID<input type="number" value={adminTargetPatientId ?? ''} onChange={(e) => setAdminTargetPatientId(e.target.value ? Number(e.target.value) : undefined)} className="w-20 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1.5 text-on-surface" placeholder="—" /></label>}
    </div>
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="medical-card flex items-center gap-3 p-4"><span className="material-symbols-outlined text-primary">verified_user</span><div><p className="text-xs font-semibold">Secure portal</p><p className="text-[11px] text-on-surface-variant">Your session is protected</p></div></div><div className="medical-card flex items-center gap-3 p-4"><span className="material-symbols-outlined text-secondary">schedule</span><div><p className="text-xs font-semibold">Always available</p><p className="text-[11px] text-on-surface-variant">Get help any time</p></div></div><div className="medical-card flex items-center gap-3 p-4"><span className="material-symbols-outlined text-tertiary">support_agent</span><div><p className="text-xs font-semibold">Care navigation</p><p className="text-[11px] text-on-surface-variant">Guidance, not diagnosis</p></div></div></div>
    <ChatInterface patientId={effectivePatientId} />
  </div>;
}
