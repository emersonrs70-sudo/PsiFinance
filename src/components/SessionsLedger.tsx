import React, { useState } from 'react';
import { SessionEntry, Patient, PaymentStatus } from '../types/finance';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Trash2, 
  ChevronDown,
  Filter,
  FileText,
  Printer,
  X
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
  const [selectedReceiptSession, setSelectedReceiptSession] = useState<SessionEntry | null>(null);

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

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & METRIC SUMMARY CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Transações & Lançamentos
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Controle detalhado de sessões clínicas, formas de pagamento e recibos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickForm(!showQuickForm)}
              className="py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançamento Rápido</span>
            </button>

            <button
              onClick={onOpenNewSession}
              className="py-2 px-3.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Entrada</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <span className="text-[11px] text-neutral-500 font-medium">Recebidos no Período</span>
            <div className="text-base font-bold text-neutral-900 tabular-nums">
              {formatBRL(totalReceived)}
            </div>
          </div>
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <span className="text-[11px] text-neutral-500 font-medium">A Receber (Pendentes)</span>
            <div className="text-base font-bold text-amber-700 tabular-nums">
              {formatBRL(totalPending)}
            </div>
          </div>
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <span className="text-[11px] text-neutral-500 font-medium">Faturamento Estimado</span>
            <div className="text-base font-bold text-neutral-900 tabular-nums">
              {formatBRL(totalAll)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. INLINE FAST ENTRY FORM (COLLAPSIBLE) */}
      {showQuickForm && (
        <form
          onSubmit={handleQuickSubmit}
          className="bg-white rounded-3xl p-5 border border-neutral-900/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Lançamento Rápido de Atendimento
            </span>
            <button
              type="button"
              onClick={() => setShowQuickForm(false)}
              className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Paciente
              </label>
              <select
                value={quickPatientId}
                onChange={(e) => handlePatientSelectChange(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatBRL(p.defaultFee)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                value={quickFee}
                onChange={(e) => setQuickFee(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono font-bold"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer min-h-[38px]"
              >
                Salvar Sessão
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        {/* Status Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Todas ({sessions.length})
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'received'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Recebidas
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            A Receber
          </button>
        </div>

        {/* Month Selector */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none font-medium text-neutral-800"
        >
          <option value="all">Todos os Meses</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* 4. SESSIONS LIST (MINIMALIST & HIGH CONTRAST) */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 space-y-2">
            <p className="text-sm font-medium">Nenhum lançamento encontrado para os filtros selecionados.</p>
            <button
              onClick={onOpenNewSession}
              className="text-xs font-semibold text-neutral-900 underline underline-offset-4 cursor-pointer"
            >
              Registrar uma sessão agora
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredSessions.map((session) => {
              const isReceived = session.status === 'received';
              return (
                <div
                  key={session.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors"
                >
                  {/* Left: Icon + Patient Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => onToggleStatus(session.id)}
                      title={isReceived ? 'Marcar como A Receber' : 'Marcar como Recebido'}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95 ${
                        isReceived
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-300'
                      }`}
                    >
                      {isReceived ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900 truncate">
                          {session.patientName}
                        </span>
                        {session.paymentMethod && (
                          <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {session.paymentMethod}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5 font-mono">
                        <span>{session.date}</span>
                        {session.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans truncate text-neutral-400 max-w-xs">{session.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Value + Status Toggle + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-13 sm:pl-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-neutral-900 tabular-nums">
                        {formatBRL(session.fee)}
                      </div>
                      <button
                        onClick={() => onToggleStatus(session.id)}
                        className={`text-[11px] font-semibold cursor-pointer underline underline-offset-2 ${
                          isReceived ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isReceived ? 'Recebido' : 'A Receber'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Receipt generator */}
                      <button
                        onClick={() => setSelectedReceiptSession(session)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                        title="Emitir Recibo para Convênio / Carnê-Leão"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir lançamento"
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

      {/* RECEIPT MODAL (EMISSÃO DE RECIBO CLINICO) */}
      {selectedReceiptSession && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-neutral-200 shadow-2xl relative">
            <button
              onClick={() => setSelectedReceiptSession(null)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Comprovante de Atendimento Psicológico
                </span>
                <h3 className="text-lg font-bold text-neutral-900 mt-1">
                  Recibo de Pagamento de Psicoterapia
                </h3>
              </div>

              <div className="p-4 bg-neutral-50 rounded-2xl space-y-2 text-xs text-neutral-700 leading-relaxed">
                <p>
                  Recebi de <strong>{selectedReceiptSession.patientName}</strong> a importância de{' '}
                  <strong className="text-neutral-900 font-mono">
                    {formatBRL(selectedReceiptSession.fee)}
                  </strong>{' '}
                  referente à sessão de psicoterapia individual realizada em{' '}
                  <strong className="font-mono">{selectedReceiptSession.date}</strong>.
                </p>
                <p className="text-[11px] text-neutral-500">
                  Forma de Pagamento: {selectedReceiptSession.paymentMethod || 'PIX'} · Status:{' '}
                  {selectedReceiptSession.status === 'received' ? 'Quitado' : 'Aguardando Pagamento'}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 font-mono">
                  ID: {selectedReceiptSession.id}
                </span>

                <button
                  onClick={() => window.print()}
                  className="py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
