import React, { useState } from 'react';
import { Patient, SessionEntry, PaymentStatus } from '../types/finance';
import { X, ArrowDownLeft } from 'lucide-react';

interface NewSessionModalProps {
  patients: Patient[];
  preselectedPatientId?: string;
  onClose: () => void;
  onSave: (session: SessionEntry) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  patients,
  preselectedPatientId,
  onClose,
  onSave,
}) => {
  const initialPatient = patients.find(p => p.id === preselectedPatientId) || patients[0];
  const [patientId, setPatientId] = useState(initialPatient?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fee, setFee] = useState<number>(initialPatient?.defaultFee || 200);
  const [status, setStatus] = useState<PaymentStatus>('received');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');

  const handlePatientChange = (id: string) => {
    setPatientId(id);
    const p = patients.find(pat => pat.id === id);
    if (p) {
      setFee(p.defaultFee);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find(pat => pat.id === patientId);
    if (!p) return;

    const newSession: SessionEntry = {
      id: `s-${Date.now()}`,
      patientId: p.id,
      patientName: p.name,
      date,
      fee: Number(fee) || p.defaultFee,
      status,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    onSave(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-neutral-900">
              Registrar Entrada de Sessão
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-xs overflow-y-auto flex-1">
          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Paciente *
            </label>
            <select
              value={patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.defaultFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Data da Sessão *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Valor Recebido / Acordado (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Status do Pagamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
              >
                <option value="received">Recebido</option>
                <option value="pending">A Receber</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
              >
                <option value="PIX">PIX</option>
                <option value="Transferência">Transferência</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Observação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Sessão quinzenal, acerto antecipado"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 pb-safe flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer min-h-[42px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors cursor-pointer min-h-[42px]"
            >
              Salvar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
