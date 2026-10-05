import React, { useState } from 'react';
import { Patient, ScheduledAppointment, AppointmentModality, AppointmentStatus } from '../types/finance';
import { X, Calendar, Clock, MapPin, Video, CheckCircle2, UserPlus } from 'lucide-react';

interface NewAppointmentModalProps {
  patients: Patient[];
  preselectedDate?: string;
  onClose: () => void;
  onSave: (appointment: ScheduledAppointment) => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  patients,
  preselectedDate,
  onClose,
  onSave,
}) => {
  const initialPatient = patients[0];
  const [patientId, setPatientId] = useState(initialPatient?.id || '');
  const [date, setDate] = useState(preselectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [modality, setModality] = useState<AppointmentModality>('presencial');
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [fee, setFee] = useState<number>(initialPatient?.defaultFee || 200);
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

    const newAppointment: ScheduledAppointment = {
      id: `apt-${Date.now()}`,
      patientId: p.id,
      patientName: p.name,
      date,
      time,
      durationMinutes,
      modality,
      status,
      fee: Number(fee) || p.defaultFee,
      notes: notes.trim() || undefined,
    };

    onSave(newAppointment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200 border border-neutral-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Novo Agendamento de Sessão
              </h2>
              <span className="text-[10px] text-neutral-400">
                Reserva de horário na agenda clínica
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Paciente
            </label>
            <select
              value={patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Modality (Presencial / Online) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Modalidade de Atendimento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModality('presencial')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modality === 'presencial'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Presencial</span>
              </button>
              <button
                type="button"
                onClick={() => setModality('online')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modality === 'online'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Online / Vídeo</span>
              </button>
            </div>
          </div>

          {/* Fee & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Valor da Sessão (R$)
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                min="0"
                step="5"
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
              >
                <option value="confirmed">Confirmada</option>
                <option value="scheduled">Agendada</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Observações / Local da Sala (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Sala 02, Link enviado via WhatsApp..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Confirmar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
