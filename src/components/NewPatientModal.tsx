import React, { useState } from 'react';
import { Patient } from '../types/finance';
import { X, UserPlus } from 'lucide-react';

interface NewPatientModalProps {
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultFee, setDefaultFee] = useState<number>(200);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '(11) 99999-9999',
      defaultFee: Number(defaultFee) || 200,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-neutral-900" />
            <h2 className="text-sm font-bold text-neutral-900">
              Cadastrar Novo Paciente
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
              Nome do Paciente *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carolina Mendes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Valor Padrão da Sessão (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={defaultFee}
                onChange={(e) => setDefaultFee(Number(e.target.value))}
                className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs min-h-[42px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Anotações / Horário de Preferência
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Atendimentos às sextas 14h"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm sm:text-xs"
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-black rounded-lg transition-colors cursor-pointer min-h-[42px]"
            >
              Salvar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
