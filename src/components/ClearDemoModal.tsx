import React from 'react';
import { ShieldCheck, AlertTriangle, Trash2, X, Check } from 'lucide-react';

interface ClearDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  demoPatientCount: number;
}

export const ClearDemoModal: React.FC<ClearDemoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  demoPatientCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-neutral-200/80">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Limpar Dados de Demonstração?
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Prepare seu sistema para uso clínico real.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-2 space-y-3">
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs text-neutral-700 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-neutral-900">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>O que será removido:</span>
            </div>
            <p className="text-[11px] text-neutral-600 pl-6 leading-relaxed">
              Os <strong>{demoPatientCount} pacientes fictícios de teste</strong> (Carolina, Lucas, Mariana...) e o histórico simulado de sessões e agendamentos.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Proteção dos seus dados:</span>
            </div>
            <p className="text-[11px] text-emerald-800 pl-6 leading-relaxed">
              Todos os pacientes, sessões e agendamentos que <strong>você mesmo adicionou</strong> serão 100% mantidos. Este botão <strong>desaparecerá para sempre</strong> após a limpeza.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-5 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-2.5 px-5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirmar e Limpar Exemplos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
