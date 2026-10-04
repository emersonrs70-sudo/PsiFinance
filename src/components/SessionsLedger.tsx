import React, { useState } from 'react';
import { SessionEntry, Patient, PaymentStatus } from '../types/finance';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Trash2, 
  ChevronDown
} from 'lucide-react';

interface SessionsLedgerProps {
  sessions: SessionEntry[];
  patients: Patient[];
  onToggleStatus: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenNewSession: () => void;
  onAddQuickSession: (session: Omit<SessionEntry, 'id'>) => void;
}

export const SessionsLedger: React.FC<SessionsLedgerProps> = ({
  sessions,
  patients,
  onToggleStatus,
  onDeleteSession,
  onOpenNewSession,
  onAddQuickSession,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'pending'>('all');
  const [searchPatient, setSearchPatient] = useState('');
  const [showQuickForm, setShowQuickForm] = useState(false);

  // Inline fast entry state
  const [quickPatientId, setQuickPatientId] = useState(patients[0]?.id || '');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickFee, setQuickFee] = useState<number>(patients[0]?.defaultFee || 200);
  const [quickStatus, setQuickStatus] = useState<PaymentStatus>('received');
  const [quickMethod, setQuickMethod] = useState('PIX');

  const handlePatientSelectChange = (id: string) => {
    setQuickPatientId(id);
    const p = patients.find(pat => pat.id === id);
    if (p) setQuickFee(p.defaultFee);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find(pat => pat.id === quickPatientId);
    if (!p) return;

    onAddQuickSession({
      patientId: p.id,
      patientName: p.name,
      date: quickDate,
      fee: Number(quickFee) || p.defaultFee,
      status: quickStatus,
      paymentMethod: quickMethod,
    });
    setShowQuickForm(false);
  };

  // Distinct months available in data
  const availableMonths = Array.from(
    new Set(sessions.map((s) => s.date.substring(0, 7)))
  ).sort().reverse();

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (selectedMonth !== 'all' && !s.date.startsWith(selectedMonth)) {
      return false;
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }
    if (
      searchPatient.trim() &&
      !s.patientName.toLowerCase().includes(searchPatient.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // KPI calculations for selected view
  const totalReceived = filteredSessions
    .filter((s) => s.status === 'received')
    .reduce((acc, curr) => acc + curr.fee, 0);

  const totalPending = filteredSessions
    .filter((s) => s.status === 'pending')
    .reduce((acc, curr) => acc + curr.fee, 0);

  const totalAll = totalReceived + totalPending;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Title & Period Switcher (Responsive, No clipping) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
            Entradas de Sessões
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registro de atendimentos e receitas
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <label className="text-xs text-neutral-500 font-medium shrink-0">Mês:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto text-xs font-mono py-1.5 px-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[38px]"
          >
            <option value="all">Todas as Datas</option>
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-');
              const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ];
              const label = `${monthNames[parseInt(mo, 10) - 1]} / ${y}`;
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Financial Summary Cards (Grid adapts gracefully to mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Recebido */}
        <div className="p-3 sm:p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Recebido</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums leading-tight">
            {totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-emerald-700 font-medium truncate">
            {filteredSessions.filter((s) => s.status === 'received').length} sessões pagas
          </div>
        </div>

        {/* A Receber */}
        <div className="p-3 sm:p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>A Receber</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums leading-tight">
            {totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-amber-700 font-medium truncate">
            {filteredSessions.filter((s) => s.status === 'pending').length} pendentes
          </div>
        </div>

        {/* Total Geral (Span 2 on mobile, single on desktop) */}
        <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 bg-neutral-900 text-white rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
            <span>Total das Sessões</span>
            <span className="font-mono text-[10px] text-neutral-400">
              {filteredSessions.length} atendimentos
            </span>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-bold text-white font-mono tabular-nums leading-tight">
            {totalAll.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-neutral-400 truncate">
            Média:{' '}
            {(totalAll / Math.max(1, filteredSessions.length)).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}{' '}
            / sessão
          </div>
        </div>
      </div>

      {/* Quick Entry Box (Mobile Collapsible / Desktop Grid) */}
      <div className="p-3.5 sm:p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowQuickForm(!showQuickForm)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 cursor-pointer sm:pointer-events-none"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>Lançamento Rápido de Sessão</span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform sm:hidden ${showQuickForm ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={onOpenNewSession}
            className="text-[11px] font-medium text-emerald-800 hover:underline cursor-pointer"
          >
            Formulário Completo
          </button>
        </div>

        {/* Form body: always visible on desktop, toggleable on mobile */}
        <form 
          onSubmit={handleQuickSubmit} 
          className={`mt-3 space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-6 sm:gap-2.5 ${showQuickForm ? 'block' : 'hidden sm:grid'}`}
        >
          {/* Patient */}
          <div className="sm:col-span-2">
            <label className="block sm:hidden text-[10px] font-medium text-neutral-500 mb-0.5">Paciente</label>
            <select
              value={quickPatientId}
              onChange={(e) => handlePatientSelectChange(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[40px]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Fee in 2 cols on mobile */}
          <div className="grid grid-cols-2 sm:contents gap-2">
            <div>
              <label className="block sm:hidden text-[10px] font-medium text-neutral-500 mb-0.5">Data</label>
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[40px]"
              />
            </div>

            <div>
              <label className="block sm:hidden text-[10px] font-medium text-neutral-500 mb-0.5">Valor (R$)</label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="R$ Valor"
                value={quickFee}
                onChange={(e) => setQuickFee(Number(e.target.value))}
                className="w-full text-xs p-2 border border-neutral-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[40px]"
              />
            </div>
          </div>

          {/* Status & Action */}
          <div className="grid grid-cols-2 sm:contents gap-2">
            <div>
              <label className="block sm:hidden text-[10px] font-medium text-neutral-500 mb-0.5">Status</label>
              <select
                value={quickStatus}
                onChange={(e) => setQuickStatus(e.target.value as PaymentStatus)}
                className="w-full text-xs p-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[40px]"
              >
                <option value="received">Recebido</option>
                <option value="pending">A Receber</option>
              </select>
            </div>

            <div>
              <label className="block sm:hidden text-[10px] font-medium text-neutral-500 mb-0.5 invisible">Ação</label>
              <button
                type="submit"
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[38px]"
          />
        </div>

        {/* Segmented Filter Buttons (Full touch target, no overflow) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center truncate ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todas ({filteredSessions.length})
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center truncate ${
              statusFilter === 'received'
                ? 'bg-white text-emerald-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Recebidas
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center truncate ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            A Receber
          </button>
        </div>
      </div>

      {/* MOBILE VIEW (< sm): Clean, responsive touch cards (ZERO HORIZONTAL SCROLL) */}
      <div className="sm:hidden space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-xl">
            Nenhuma sessão encontrada para este período.
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className="p-3.5 bg-white border border-neutral-200 rounded-xl shadow-xs space-y-2.5"
            >
              {/* Top row: Name, Date & Fee */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-neutral-900 text-sm truncate">
                    {session.patientName}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                    {session.date.split('-').reverse().join('/')} · {session.paymentMethod || 'PIX'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold font-mono text-neutral-900 tabular-nums">
                    {session.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>

              {session.notes && (
                <div className="text-[11px] text-neutral-500 bg-neutral-50 p-1.5 rounded">
                  {session.notes}
                </div>
              )}

              {/* Bottom row: Touch Status Toggle + Delete */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => onToggleStatus(session.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all min-h-[38px] ${
                    session.status === 'received'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 active:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border border-amber-200/80 active:bg-amber-100'
                  }`}
                >
                  {session.status === 'received' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Recebido</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>A Receber</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteSession(session.id)}
                  className="p-2 text-neutral-400 hover:text-rose-600 active:bg-rose-50 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW (>= sm): Traditional Clean Data Table */}
      <div className="hidden sm:block bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-600 border-b border-neutral-200 font-medium">
              <tr>
                <th className="py-3 px-4 font-mono">Data</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4 text-right">Valor da Sessão</th>
                <th className="py-3 px-4">Forma</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    Nenhuma sessão encontrada para este período.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-neutral-700 whitespace-nowrap">
                      {session.date.split('-').reverse().join('/')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{session.patientName}</div>
                      {session.notes && (
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                          {session.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 whitespace-nowrap tabular-nums">
                      {session.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>

                    <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                      {session.paymentMethod || 'PIX'}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onToggleStatus(session.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                          session.status === 'received'
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70'
                        }`}
                        title="Clique para alternar status"
                      >
                        {session.status === 'received' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Recebido</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>A Receber</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
