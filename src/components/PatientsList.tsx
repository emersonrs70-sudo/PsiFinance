import React, { useState } from 'react';
import { Patient, SessionEntry } from '../types/finance';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Plus, 
  Trash2,
  User,
  Calendar,
  Wallet
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

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Registro de Pacientes
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cadastro clínico, valores acordados por sessão e histórico individual.
          </p>
        </div>

        <button
          onClick={onOpenNewPatient}
          className="py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* 2. SEARCH & COUNT */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
        <span className="text-xs text-neutral-500 font-mono font-medium">
          {filteredPatients.length} pacientes cadastrados
        </span>
      </div>

      {/* 3. PATIENTS CARDS GRID */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-neutral-400 border border-neutral-200/80 shadow-xs space-y-2">
          <p className="text-sm font-medium">Nenhum paciente encontrado.</p>
          <button
            onClick={onOpenNewPatient}
            className="text-xs font-semibold text-neutral-900 underline underline-offset-4 cursor-pointer"
          >
            Cadastrar primeiro paciente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const patientSessions = sessions.filter((s) => s.patientId === patient.id);
            const receivedSessions = patientSessions.filter((s) => s.status === 'received');
            const totalPaid = receivedSessions.reduce((acc, curr) => acc + curr.fee, 0);
            const pendingSessions = patientSessions.filter((s) => s.status === 'pending');
            const totalPending = pendingSessions.reduce((acc, curr) => acc + curr.fee, 0);

            return (
              <div
                key={patient.id}
                className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Avatar Circle + Name + Standard Fee */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {patient.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-neutral-900 truncate">
                          {patient.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{patient.phone || 'Sem contato'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-neutral-400 block font-medium">
                        Sessão
                      </span>
                      <span className="text-xs font-bold text-neutral-900 font-mono">
                        {formatBRL(patient.defaultFee)}
                      </span>
                    </div>
                  </div>

                  {/* Financial stats per patient */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-neutral-50 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Total Recebido</span>
                      <span className="text-xs font-bold text-neutral-900 font-mono tabular-nums">
                        {formatBRL(totalPaid)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">A Receber</span>
                      <span className={`text-xs font-bold font-mono tabular-nums ${totalPending > 0 ? 'text-amber-700' : 'text-neutral-400'}`}>
                        {formatBRL(totalPending)}
                      </span>
                    </div>
                  </div>

                  {patient.notes && (
                    <p className="text-[11px] text-neutral-500 line-clamp-2 italic mb-3">
                      "{patient.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {patientSessions.length} atendimentos
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenNewSessionForPatient(patient.id)}
                      className="py-1.5 px-2.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="Lançar sessão para este paciente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sessão</span>
                    </button>

                    <button
                      onClick={() => onDeletePatient(patient.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Excluir paciente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
