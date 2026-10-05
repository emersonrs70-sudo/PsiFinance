import React, { useState, useMemo } from 'react';
import { ScheduledAppointment, Patient, AppointmentStatus } from '../types/finance';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  DollarSign,
  Trash2,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';

interface ScheduleCalendarProps {
  appointments: ScheduledAppointment[];
  patients: Patient[];
  onOpenNewAppointment: (preselectedDate?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCompleteAndAddToLedger: (appointment: ScheduledAppointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
}

type ViewMode = 'calendar' | 'list';

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  appointments,
  patients,
  onOpenNewAppointment,
  onUpdateAppointmentStatus,
  onCompleteAndAddToLedger,
  onDeleteAppointment,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 5)); // October 2026
  const [selectedDayString, setSelectedDayString] = useState<string>('2026-10-05');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'scheduled' | 'completed'>('all');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekdayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayString(today.toISOString().split('T')[0]);
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [appointments, statusFilter]);

  // Calendar Days Calculation (Month View)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is index 0 in our grid (0=Seg, 6=Dom)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const mStr = String(curDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${curDate.getFullYear()}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month filler days (fill up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${nextDate.getFullYear()}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Appointments grouped by date string
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, ScheduledAppointment[]>();
    filteredAppointments.forEach((apt) => {
      const list = map.get(apt.date) || [];
      list.push(apt);
      list.sort((a, b) => a.time.localeCompare(b.time));
      map.set(apt.date, list);
    });
    return map;
  }, [filteredAppointments]);

  // Appointments for the selected day in calendar view
  const selectedDayAppointments = useMemo(() => {
    return appointmentsByDate.get(selectedDayString) || [];
  }, [appointmentsByDate, selectedDayString]);

  // Chronological grouped list for List View (Lista Corrida)
  const chronologicalDaysList = useMemo(() => {
    const dates = Array.from(appointmentsByDate.keys()).sort();
    return dates.map((dateStr) => {
      const apts = appointmentsByDate.get(dateStr) || [];
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeekStr = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dateObj.getDay()];
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      return {
        dateStr,
        dayNum: d,
        fullDateLabel: `${dayOfWeekStr}, ${d} de ${monthNames[m - 1]}`,
        isToday,
        appointments: apts,
        totalDayRevenue: apts.reduce((acc, curr) => acc + curr.fee, 0),
      };
    });
  }, [appointmentsByDate, monthNames]);

  // Quick WhatsApp Confirmation Helper
  const handleOpenWhatsApp = (apt: ScheduledAppointment) => {
    const patient = patients.find(p => p.id === apt.patientId);
    const phone = patient?.phone?.replace(/\D/g, '') || '';
    const [y, m, d] = apt.date.split('-');
    const message = encodeURIComponent(
      `Olá ${apt.patientName}, tudo bem? Confirmando nossa sessão de psicoterapia agendada para ${d}/${m} às ${apt.time} (${apt.modality === 'presencial' ? 'Presencial' : 'Online'}). Aguardo você!`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  // KPIs for the month
  const monthAppointments = useMemo(() => {
    const currentPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return appointments.filter(a => a.date.startsWith(currentPrefix));
  }, [appointments, year, month]);

  const totalMonthScheduled = monthAppointments.length;
  const totalMonthConfirmed = monthAppointments.filter(a => a.status === 'confirmed').length;
  const totalMonthCompleted = monthAppointments.filter(a => a.status === 'completed').length;
  const estimatedMonthRevenue = monthAppointments.reduce((a, b) => a + b.fee, 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & VIEW TOGGLE */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Agenda de Atendimentos
            </h1>
            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Sessões Clínicas
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Planejamento de horários, confirmações e integração direta com o financeiro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Segmented Switcher */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-2xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista Corrida</span>
            </button>
          </div>

          {/* New Appointment CTA Button */}
          <button
            onClick={() => onOpenNewAppointment(selectedDayString)}
            className="py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* 2. STATS STRIP (AT A GLANCE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Agendadas no Mês
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {totalMonthScheduled} sessões
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Confirmadas
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {totalMonthConfirmed} confirmadas
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Concluídas
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-700 font-mono tabular-nums mt-1">
            {totalMonthCompleted} atendidas
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Receita Prevista
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatBRL(estimatedMonthRevenue)}
          </div>
        </div>
      </div>

      {/* 3. MONTH CONTROLS & STATUS FILTER */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Month Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-neutral-900 min-w-36 text-center">
            {monthNames[month]} de {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleGoToToday}
            className="ml-2 px-2.5 py-1 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {(['all', 'confirmed', 'scheduled', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {st === 'all' && 'Todos'}
              {st === 'confirmed' && 'Confirmados'}
              {st === 'scheduled' && 'Agendados'}
              {st === 'completed' && 'Concluídos'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. VIEW MODE 1: CALENDÁRIO VISUAL */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Month Grid (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-neutral-400 font-mono">
              {weekdayNames.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day) => {
                const dayApts = appointmentsByDate.get(day.dateStr) || [];
                const isSelected = day.dateStr === selectedDayString;
                const hasApts = dayApts.length > 0;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDayString(day.dateStr)}
                    className={`min-h-[85px] sm:min-h-[96px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                        : day.isCurrentMonth
                        ? 'border-neutral-200/80 bg-white hover:border-neutral-300'
                        : 'border-transparent bg-neutral-50/50 text-neutral-400'
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isSelected
                            ? 'text-neutral-900 font-extrabold'
                            : day.isCurrentMonth
                            ? 'text-neutral-800'
                            : 'text-neutral-300'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      {hasApts && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {/* Session Pills in cell */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : apt.status === 'completed'
                              ? 'bg-neutral-100 text-neutral-600'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          <span className="font-mono font-bold">{apt.time}</span> {apt.patientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <span className="text-[9px] text-neutral-400 block font-mono pl-1">
                          +{dayApts.length - 2} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Day Details Card (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Horários do Dia
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 font-mono">
                    {selectedDayString}
                  </h3>
                </div>
                <button
                  onClick={() => onOpenNewAppointment(selectedDayString)}
                  className="py-1 px-2.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </button>
              </div>

              {/* Sessions of selected day */}
              {selectedDayAppointments.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 space-y-2">
                  <Clock className="w-6 h-6 mx-auto text-neutral-300" />
                  <p className="text-xs">Nenhum atendimento agendado para este dia.</p>
                  <button
                    onClick={() => onOpenNewAppointment(selectedDayString)}
                    className="text-xs font-semibold text-neutral-900 underline underline-offset-4 cursor-pointer"
                  >
                    Agendar primeiro horário
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 font-mono">
                              {apt.time} ({apt.durationMinutes}m)
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              {apt.modality === 'presencial' ? (
                                <MapPin className="w-2.5 h-2.5" />
                              ) : (
                                <Video className="w-2.5 h-2.5" />
                              )}
                              <span>{apt.modality === 'presencial' ? 'Presencial' : 'Online'}</span>
                            </span>
                          </div>
                          <div className="text-xs font-bold text-neutral-900 mt-1">
                            {apt.patientName}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-neutral-900">
                            {formatBRL(apt.fee)}
                          </span>
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-neutral-500 italic">
                          "{apt.notes}"
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between gap-2">
                        {/* WhatsApp Reminder */}
                        <button
                          onClick={() => handleOpenWhatsApp(apt)}
                          className="p-1.5 text-neutral-500 hover:text-emerald-700 hover:bg-white rounded-lg cursor-pointer"
                          title="Enviar lembrete de confirmação via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          {apt.status !== 'completed' ? (
                            <button
                              onClick={() => onCompleteAndAddToLedger(apt)}
                              className="py-1 px-2.5 text-[11px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Marcar como atendida e registrar no financeiro"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Concluir & Faturar</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Concluída
                            </span>
                          )}

                          <button
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Desmarcar / Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>{selectedDayAppointments.length} atendimentos</span>
              <span className="font-mono font-bold text-neutral-900">
                Total: {formatBRL(selectedDayAppointments.reduce((a, b) => a + b.fee, 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW MODE 2: LISTA CORRIDA DOS DIAS */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {chronologicalDaysList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-neutral-400 border border-neutral-200/80 shadow-xs space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-neutral-300" />
              <p className="text-sm font-medium">Nenhum atendimento na lista corrida para os filtros atuais.</p>
              <button
                onClick={() => onOpenNewAppointment()}
                className="text-xs font-semibold text-neutral-900 underline underline-offset-4 cursor-pointer"
              >
                Cadastrar um novo agendamento
              </button>
            </div>
          ) : (
            chronologicalDaysList.map((dayGroup) => (
              <div
                key={dayGroup.dateStr}
                className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden"
              >
                {/* Day Header Banner */}
                <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-neutral-900">
                      {dayGroup.fullDateLabel}
                    </span>
                    {dayGroup.isToday && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase">
                        Hoje
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-neutral-500">
                      {dayGroup.appointments.length} sessões · Total {formatBRL(dayGroup.totalDayRevenue)}
                    </span>
                    <button
                      onClick={() => onOpenNewAppointment(dayGroup.dateStr)}
                      className="p-1 text-neutral-500 hover:text-neutral-900 rounded-lg cursor-pointer"
                      title="Agendar neste dia"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Sessions List */}
                <div className="divide-y divide-neutral-100">
                  {dayGroup.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors"
                    >
                      {/* Left: Time + Modality + Patient */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 shrink-0 text-center font-mono">
                          <div className="text-sm font-bold text-neutral-900">
                            {apt.time}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {apt.durationMinutes} min
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-900 truncate">
                              {apt.patientName}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              {apt.modality === 'presencial' ? (
                                <MapPin className="w-3 h-3" />
                              ) : (
                                <Video className="w-3 h-3" />
                              )}
                              <span>{apt.modality === 'presencial' ? 'Presencial' : 'Online'}</span>
                            </span>
                          </div>
                          {apt.notes && (
                            <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-md">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Fee + Status + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-17 sm:pl-0">
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-neutral-900 tabular-nums">
                            {formatBRL(apt.fee)}
                          </div>
                          <span className={`text-[10px] font-semibold uppercase ${
                            apt.status === 'confirmed' ? 'text-emerald-700' : apt.status === 'completed' ? 'text-neutral-500' : 'text-amber-700'
                          }`}>
                            {apt.status === 'confirmed' && 'Confirmada'}
                            {apt.status === 'scheduled' && 'Agendada'}
                            {apt.status === 'completed' && 'Concluída'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleOpenWhatsApp(apt)}
                            className="p-2 text-neutral-400 hover:text-emerald-700 hover:bg-neutral-100 rounded-xl cursor-pointer"
                            title="Enviar confirmação WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                          </button>

                          {/* Complete & Add to Ledger */}
                          {apt.status !== 'completed' ? (
                            <button
                              onClick={() => onCompleteAndAddToLedger(apt)}
                              className="py-1.5 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title="Marcar como atendida e registrar no financeiro"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">Concluir & Faturar</span>
                              <span className="sm:hidden">Faturar</span>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-neutral-400 font-mono px-2 py-1 bg-neutral-100 rounded-lg">
                              Faturada
                            </span>
                          )}

                          <button
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="p-2 text-neutral-400 hover:text-rose-600 rounded-xl cursor-pointer"
                            title="Desmarcar sessão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
