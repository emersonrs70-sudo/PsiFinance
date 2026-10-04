import React, { useState } from 'react';
import { Patient, SessionEntry } from '../types/finance';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Plus, 
  Trash2
} from 'lucide-react';

interface PatientsListProps {
  patients: Patient[];
  sessions: SessionEntry[];
  onOpenNewPatient: () => void;
  onOpenNewSessionForPatient: (patientId: string) => void;
  onDeletePatient: (patientId: string) => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({
  patients,
  sessions,
  onOpenNewPatient,
  onOpenNewSessionForPatient,
  onDeletePatient,
}) => {
  const [search, setSearch] = useState('');

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
            Registro de Pacientes
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Valor padrão e histórico de atendimentos
          </p>
        </div>

        <button
          onClick={onOpenNewPatient}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-black rounded-lg transition-colors cursor-pointer shrink-0 min-h-[38px]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Novo Paciente</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 border border-neutral-200 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[38px]"
          />
        </div>
        <span className="text-[11px] font-mono text-neutral-500 shrink-0">
          {filteredPatients.length} ativos
        </span>
      </div>

      {/* Patients Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredPatients.map((patient) => {
          const patientSessions = sessions.filter((s) => s.patientId === patient.id);
          const receivedSessions = patientSessions.filter((s) => s.status === 'received');
          const totalPaid = receivedSessions.reduce((acc, curr) => acc + curr.fee, 0);
          const pendingSessions = patientSessions.filter((s) => s.status === 'pending');
          const totalPending = pendingSessions.reduce((acc, curr) => acc + curr.fee, 0);

          return (
            <div
              key={patient.id}
              className="bg-white border border-neutral-200 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-xs"
            >
              <div>
                {/* Name & Standard Fee */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-100">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-neutral-900 truncate">
                      {patient.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{patient.phone || 'Sem telefone'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
                    {patient.defaultFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {patient.notes && (
                  <p className="text-xs text-neutral-600 mt-2 line-clamp-2">
                    {patient.notes}
                  </p>
                )}

                {/* Financial stats for this patient */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60">
                  <div>
                    <div className="text-[10px] sm:text-[11px] text-neutral-500">Sessões Realizadas</div>
                    <div className="font-mono font-semibold text-neutral-900 mt-0.5">
                      {patientSessions.length} sessões
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-[11px] text-neutral-500">Total Pago</div>
                    <div className="font-mono font-bold text-emerald-800 mt-0.5">
                      {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {totalPending > 0 && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200/60 flex items-center justify-between font-mono">
                    <span>A receber:</span>
                    <strong>{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons: 40px touch targets */}
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenNewSessionForPatient(patient.id)}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lançar Sessão</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePatient(patient.id)}
                  className="p-2 text-neutral-400 hover:text-rose-600 active:bg-rose-50 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Excluir paciente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
