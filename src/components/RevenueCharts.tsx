import React, { useState, useMemo } from 'react';
import { SessionEntry } from '../types/finance';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Layers
} from 'lucide-react';

interface RevenueChartsProps {
  sessions: SessionEntry[];
}

type ChartViewMode = 'evolution' | 'comparison';

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ sessions }) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('evolution');
  const [periodRange, setPeriodRange] = useState<'6_months' | '3_months' | 'year' | 'all'>('6_months');

  // Month names helper in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const mIdx = parseInt(m, 10) - 1;
    return `${monthNames[mIdx]} / ${y}`;
  };

  const formatShortMonth = (ym: string) => {
    const [y, m] = ym.split('-');
    const mIdx = parseInt(m, 10) - 1;
    return `${monthNames[mIdx].substring(0, 3)}/${y.slice(2)}`;
  };

  // Group all sessions by month YYYY-MM
  const monthlyData = useMemo(() => {
    const map = new Map<string, { received: number; pending: number; countReceived: number; countTotal: number }>();

    sessions.forEach((s) => {
      const ym = s.date.substring(0, 7);
      const current = map.get(ym) || { received: 0, pending: 0, countReceived: 0, countTotal: 0 };
      if (s.status === 'received') {
        current.received += s.fee;
        current.countReceived += 1;
      } else {
        current.pending += s.fee;
      }
      current.countTotal += 1;
      map.set(ym, current);
    });

    const sortedKeys = Array.from(map.keys()).sort();

    return sortedKeys.map((ym) => {
      const data = map.get(ym)!;
      return {
        key: ym,
        label: formatMonthLabel(ym),
        shortLabel: formatShortMonth(ym),
        received: data.received,
        pending: data.pending,
        total: data.received + data.pending,
        countReceived: data.countReceived,
        countTotal: data.countTotal,
        averageFee: data.countReceived > 0 ? data.received / data.countReceived : 0,
      };
    });
  }, [sessions]);

  // Sliced data based on period range
  const filteredData = useMemo(() => {
    if (periodRange === '3_months') {
      return monthlyData.slice(-3);
    }
    if (periodRange === '6_months') {
      return monthlyData.slice(-6);
    }
    if (periodRange === 'year') {
      return monthlyData.filter(d => d.key.startsWith('2026'));
    }
    return monthlyData;
  }, [monthlyData, periodRange]);

  // Selected month inspection state (defaults to latest month)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    filteredData[filteredData.length - 1]?.key || '2026-10'
  );

  const inspectedMonth = useMemo(() => {
    return filteredData.find(d => d.key === selectedMonthKey) || filteredData[filteredData.length - 1];
  }, [filteredData, selectedMonthKey]);

  // Two months comparison state
  const availableMonths = monthlyData.map(m => m.key);
  const [compareMonthA, setCompareMonthA] = useState<string>(
    availableMonths[availableMonths.length - 2] || '2026-09'
  );
  const [compareMonthB, setCompareMonthB] = useState<string>(
    availableMonths[availableMonths.length - 1] || '2026-10'
  );

  const monthAData = monthlyData.find(m => m.key === compareMonthA);
  const monthBData = monthlyData.find(m => m.key === compareMonthB);

  // Overall KPIs for the selected filtered period
  const totalPeriodReceived = filteredData.reduce((acc, d) => acc + d.received, 0);
  const totalPeriodSessions = filteredData.reduce((acc, d) => acc + d.countReceived, 0);
  const avgMonthlyReceived = filteredData.length > 0 ? totalPeriodReceived / filteredData.length : 0;
  const avgTicket = totalPeriodSessions > 0 ? totalPeriodReceived / totalPeriodSessions : 0;

  // Max value for SVG scale
  const maxRevenue = Math.max(...filteredData.map(d => d.received), 1000);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
            Comparativo de Receitas
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Evolução das receitas de psicoterapia
          </p>
        </div>

        {/* View Mode Switcher: full-width on mobile */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          <button
            onClick={() => setViewMode('evolution')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[38px] ${
              viewMode === 'evolution'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Evolução</span>
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[38px] ${
              viewMode === 'comparison'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Comparar 2 Meses</span>
          </button>
        </div>
      </div>

      {viewMode === 'evolution' && (
        <>
          {/* Period Range Buttons (Adaptive grid for mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-500">
              Período Analisado:
            </span>
            <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
              {[
                { id: '3_months', label: '3 Meses' },
                { id: '6_months', label: '6 Meses' },
                { id: 'year', label: 'Ano 2026' },
                { id: 'all', label: 'Histórico' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPeriodRange(p.id as any);
                    setSelectedMonthKey(filteredData[filteredData.length - 1]?.key || '2026-10');
                  }}
                  className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center min-h-[36px] ${
                    periodRange === p.id
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric KPIs (2-col grid on mobile, 4-col on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">Total Recebido</div>
              <div className="mt-1 text-base sm:text-2xl font-bold text-emerald-800 font-mono tabular-nums leading-tight">
                {totalPeriodReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">
                {filteredData.length} meses
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">Média Mensal</div>
              <div className="mt-1 text-base sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums leading-tight">
                {avgMonthlyReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">
                Por mês
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">Sessões Realizadas</div>
              <div className="mt-1 text-base sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums leading-tight">
                {totalPeriodSessions}
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">
                {(totalPeriodSessions / Math.max(1, filteredData.length)).toFixed(1)}/mês
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">Ticket Médio</div>
              <div className="mt-1 text-base sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums leading-tight">
                {avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">
                Por atendimento
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="p-4 sm:p-6 bg-white border border-neutral-200 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Evolução das Receitas Recebidas
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Toque na barra para inspecionar o detalhamento do mês
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
                  Recebido
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 border-t border-dashed border-neutral-400 inline-block" />
                  Média ({avgMonthlyReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})
                </span>
              </div>
            </div>

            {/* SVG Graph Arena with 100% mobile-safe scaling */}
            <div className="pt-3 pb-1">
              <div className="h-52 sm:h-64 flex items-end justify-between gap-1.5 sm:gap-4 border-b border-neutral-200 px-1 sm:px-4 relative">
                {/* Horizontal Average Guide */}
                {maxRevenue > 0 && (
                  <div 
                    className="absolute left-0 right-0 border-b border-dashed border-neutral-300 pointer-events-none z-0"
                    style={{ bottom: `${(avgMonthlyReceived / maxRevenue) * 100}%` }}
                  />
                )}

                {filteredData.map((d) => {
                  const heightPercent = Math.max(10, Math.round((d.received / maxRevenue) * 100));
                  const isSelected = (inspectedMonth?.key === d.key);

                  return (
                    <div
                      key={d.key}
                      onClick={() => setSelectedMonthKey(d.key)}
                      className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer relative z-10 touch-manipulation group"
                    >
                      {/* Bar Value on top: compact on mobile */}
                      <div className={`text-[9px] sm:text-xs font-mono font-semibold mb-1 tabular-nums transition-colors ${
                        isSelected ? 'text-emerald-800 font-bold' : 'text-neutral-500 group-hover:text-neutral-900'
                      }`}>
                        <span className="hidden sm:inline">
                          {d.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </span>
                        <span className="sm:hidden">
                          {Math.round(d.received / 1000)}k
                        </span>
                      </div>

                      {/* Bar Visual Pillar */}
                      <div
                        className={`w-full max-w-[48px] rounded-t-md transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-800 ring-2 ring-emerald-500 ring-offset-1'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Month Label below axis */}
                      <div className={`mt-2 text-[10px] sm:text-xs text-center truncate ${
                        isSelected ? 'font-bold text-neutral-900' : 'text-neutral-500'
                      }`}>
                        {d.shortLabel.split('/')[0]}
                      </div>

                      {/* Sessions count */}
                      <div className="text-[9px] text-neutral-400 font-mono hidden sm:block">
                        {d.countReceived}s
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dedicated Mobile Inspection Card (Ensures ZERO tooltips clip or overlap) */}
            {inspectedMonth && (
              <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    {inspectedMonth.label}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {inspectedMonth.countReceived} atendimentos realizados · Média: {inspectedMonth.averageFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/sessão
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-bold font-mono text-emerald-800 tabular-nums">
                    {inspectedMonth.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  {inspectedMonth.pending > 0 && (
                    <div className="text-[10px] font-mono text-amber-700">
                      +{inspectedMonth.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a receber
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Comparison Table (Responsive: Cards on Mobile, Table on Desktop) */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                Resumo Mês a Mês
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {filteredData.length} meses
              </span>
            </div>

            {/* MOBILE LIST (No horizontal scroll!) */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {filteredData.map((d, index) => {
                const prevMonth = filteredData[index - 1];
                const diffPercent = prevMonth && prevMonth.received > 0
                  ? ((d.received - prevMonth.received) / prevMonth.received) * 100
                  : null;

                return (
                  <div key={d.key} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-neutral-900 text-xs">
                        {d.label}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {d.countReceived} sessões · Média: {d.averageFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-800 text-xs tabular-nums">
                        {d.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-[10px] font-mono mt-0.5">
                        {diffPercent !== null ? (
                          <span className={diffPercent >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                            {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-neutral-400">Base</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/60 text-neutral-700 border-b border-neutral-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Mês de Competência</th>
                    <th className="py-2.5 px-4 text-right">Receita Recebida</th>
                    <th className="py-2.5 px-4 text-center">Sessões</th>
                    <th className="py-2.5 px-4 text-right">Média / Sessão</th>
                    <th className="py-2.5 px-4 text-right">Variação Mensal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/80">
                  {filteredData.map((d, index) => {
                    const prevMonth = filteredData[index - 1];
                    const diffPercent = prevMonth && prevMonth.received > 0
                      ? ((d.received - prevMonth.received) / prevMonth.received) * 100
                      : null;

                    return (
                      <tr key={d.key} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {d.label}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap tabular-nums">
                          {d.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-neutral-800">
                          {d.countReceived}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-700 tabular-nums">
                          {d.averageFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                          {diffPercent !== null ? (
                            <span className={`inline-flex items-center gap-1 font-semibold ${
                              diffPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-neutral-400">Primeiro mês</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mode 2: Direct Comparison between 2 Specific Months */}
      {viewMode === 'comparison' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Selectors stacked cleanly on mobile */}
          <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Primeiro Mês (Base):
              </label>
              <select
                value={compareMonthA}
                onChange={(e) => setCompareMonthA(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[38px]"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Segundo Mês (Comparativo):
              </label>
              <select
                value={compareMonthB}
                onChange={(e) => setCompareMonthB(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[38px]"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {monthAData && monthBData && (
            <>
              {(() => {
                const diffRevenue = monthBData.received - monthAData.received;
                const percentRevenue = monthAData.received > 0
                  ? (diffRevenue / monthAData.received) * 100
                  : 0;
                const diffSessions = monthBData.countReceived - monthAData.countReceived;

                return (
                  <div className="p-4 sm:p-5 bg-white border border-neutral-200 rounded-xl space-y-4 shadow-xs">
                    {/* Header with Delta Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                      <div>
                        <div className="text-[11px] text-neutral-500">Resultado da Comparação</div>
                        <div className="text-sm sm:text-base font-bold text-neutral-900">
                          {monthAData.label} vs. {monthBData.label}
                        </div>
                      </div>

                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono self-start sm:self-auto ${
                        diffRevenue >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {diffRevenue >= 0 ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
                        <span>
                          {diffRevenue >= 0 ? '+' : ''}{diffRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({percentRevenue >= 0 ? '+' : ''}{percentRevenue.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Side-by-side cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Card A */}
                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                        <div className="text-xs font-bold text-neutral-700">{monthAData.label}</div>
                        <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
                          {monthAData.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="mt-1.5 text-xs text-neutral-600 space-y-0.5">
                          <div>Sessões: <strong>{monthAData.countReceived}</strong></div>
                          <div>Média: <strong>{monthAData.averageFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                        </div>
                      </div>

                      {/* Card B */}
                      <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70">
                        <div className="text-xs font-bold text-emerald-900">{monthBData.label}</div>
                        <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                          {monthBData.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="mt-1.5 text-xs text-emerald-800 space-y-0.5">
                          <div>Sessões: <strong>{monthBData.countReceived}</strong> ({diffSessions >= 0 ? `+${diffSessions}` : diffSessions})</div>
                          <div>Média: <strong>{monthBData.averageFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Proportional bars */}
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-neutral-700 mb-2">
                        Proporção de Faturamento:
                      </div>
                      {(() => {
                        const maxVal = Math.max(monthAData.received, monthBData.received, 1);
                        const pctA = Math.round((monthAData.received / maxVal) * 100);
                        const pctB = Math.round((monthBData.received / maxVal) * 100);

                        return (
                          <div className="space-y-2.5">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-neutral-700 truncate">{monthAData.shortLabel}</span>
                                <span className="font-mono font-bold text-neutral-900 tabular-nums">
                                  {monthAData.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                              <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-neutral-600 h-2.5 rounded-full" style={{ width: `${pctA}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-emerald-800 truncate">{monthBData.shortLabel}</span>
                                <span className="font-mono font-bold text-emerald-800 tabular-nums">
                                  {monthBData.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                              <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${pctB}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
};
