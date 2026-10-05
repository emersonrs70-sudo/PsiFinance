import React, { useState, useMemo } from 'react';
import { SessionEntry, Patient } from '../types/finance';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Layers, 
  DollarSign, 
  Printer, 
  Download, 
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Activity,
  Sparkles,
  Users,
  Compass,
  Sliders,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface RevenueChartsProps {
  sessions: SessionEntry[];
  patients?: Patient[];
}

type ReportSubTab = 'historico' | 'previsibilidade' | 'metas' | 'honorarios';

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ sessions, patients = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('historico');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Custom monthly goal (defaults to R$ 16.000,00, adjustable by user)
  const [monthlyGoal, setMonthlyGoal] = useState<number>(16000);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [tempGoalInput, setTempGoalInput] = useState<string>('16000');

  // Month names helper in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthAbbrs = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Group all sessions chronologically by month
  const monthlyTimeline = useMemo(() => {
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

    let cumulativeReceived = 0;
    return sortedKeys.map((ym, index) => {
      const data = map.get(ym)!;
      const [year, monthStr] = ym.split('-');
      const mIdx = parseInt(monthStr, 10) - 1;
      const total = data.received + data.pending;
      cumulativeReceived += data.received;

      // Month-over-month variation
      let momGrowth = 0;
      if (index > 0) {
        const prevKey = sortedKeys[index - 1];
        const prevData = map.get(prevKey)!;
        if (prevData.received > 0) {
          momGrowth = Math.round(((data.received - prevData.received) / prevData.received) * 100);
        }
      }

      return {
        key: ym,
        year,
        monthName: monthNames[mIdx],
        shortLabel: `${monthAbbrs[mIdx]}/${year.slice(2)}`,
        fullLabel: `${monthNames[mIdx]} de ${year}`,
        received: data.received,
        pending: data.pending,
        total,
        countReceived: data.countReceived,
        countTotal: data.countTotal,
        averageFee: data.countReceived > 0 ? Math.round(data.received / data.countReceived) : 0,
        cumulativeReceived,
        adherenceRate: total > 0 ? Math.round((data.received / total) * 100) : 100,
        momGrowth,
      };
    });
  }, [sessions]);

  // Distinct available years
  const availableYears = useMemo(() => {
    return Array.from(new Set(monthlyTimeline.map(m => m.year))).sort().reverse();
  }, [monthlyTimeline]);

  // Filtered timeline based on selected year
  const filteredTimeline = useMemo(() => {
    if (selectedYear === 'all') return monthlyTimeline;
    return monthlyTimeline.filter(m => m.year === selectedYear);
  }, [monthlyTimeline, selectedYear]);

  // Macro KPI Calculations
  const macroKPIs = useMemo(() => {
    const totalReceived = filteredTimeline.reduce((acc, curr) => acc + curr.received, 0);
    const totalPending = filteredTimeline.reduce((acc, curr) => acc + curr.pending, 0);
    const totalSessions = filteredTimeline.reduce((acc, curr) => acc + curr.countTotal, 0);
    const totalPaidSessions = filteredTimeline.reduce((acc, curr) => acc + curr.countReceived, 0);
    const overallAdherence = totalSessions > 0 ? Math.round((totalPaidSessions / totalSessions) * 100) : 100;
    const averageFee = totalPaidSessions > 0 ? Math.round(totalReceived / totalPaidSessions) : 0;
    const peakMonth = [...filteredTimeline].sort((a, b) => b.received - a.received)[0];

    return {
      totalReceived,
      totalPending,
      totalSessions,
      totalPaidSessions,
      overallAdherence,
      averageFee,
      peakMonth,
    };
  }, [filteredTimeline]);

  // Current Month Data for Metas
  const currentMonthData = useMemo(() => {
    return monthlyTimeline.find(m => m.key === currentYM) || monthlyTimeline[monthlyTimeline.length - 1];
  }, [monthlyTimeline, currentYM]);

  const currentMonthAchieved = currentMonthData ? currentMonthData.received : 0;
  const goalPercentage = Math.min(100, Math.round((currentMonthAchieved / (monthlyGoal || 1)) * 100));
  const remainingToGoal = Math.max(0, monthlyGoal - currentMonthAchieved);
  const sessionsNeededForGoal = macroKPIs.averageFee > 0 ? Math.ceil(remainingToGoal / macroKPIs.averageFee) : 0;

  // 2. OPÇÃO 1: PREVISIBILIDADE & PROJEÇÃO DE CAIXA FUTURO (FORECAST)
  const forecastData = useMemo(() => {
    // Determine active patient base and weekly potential
    const activePatientCount = patients.length || 7;
    const totalWeeklyValue = patients.reduce((acc, p) => acc + p.defaultFee, 0) || (activePatientCount * 210);
    const averageFeePerActive = Math.round(totalWeeklyValue / activePatientCount);

    // 4 weeks per month standard
    const potential30Days100 = totalWeeklyValue * 4;
    const potential30Days90 = Math.round(potential30Days100 * 0.90); // Realistic with minor absences
    const potential30Days80 = Math.round(potential30Days100 * 0.80); // Conservative

    // 60 days
    const potential60Days100 = totalWeeklyValue * 8;
    const potential60Days90 = Math.round(potential60Days100 * 0.90);
    const potential60Days80 = Math.round(potential60Days100 * 0.80);

    return {
      activePatientCount,
      weeklyCapacity: activePatientCount,
      monthlyCapacitySessions: activePatientCount * 4,
      totalWeeklyValue,
      averageFeePerActive,
      potential30Days100,
      potential30Days90,
      potential30Days80,
      potential60Days100,
      potential60Days90,
      potential60Days80,
    };
  }, [patients]);

  // 3. OPÇÃO 4: PIRÂMIDE DE HONORÁRIOS & DISTRIBUIÇÃO DE VAGAS
  const honorariosBreakdown = useMemo(() => {
    const list = patients.length > 0 
      ? patients.map(p => ({ name: p.name, fee: p.defaultFee }))
      : sessions.slice(0, 15).map(s => ({ name: s.patientName, fee: s.fee }));

    // Tiers:
    // Social / Reduzido: <= R$ 150
    // Intermediário / Padrão: R$ 160 a R$ 220
    // Pleno / Especialista: >= R$ 230
    const social = list.filter(p => p.fee <= 150);
    const standard = list.filter(p => p.fee > 150 && p.fee <= 220);
    const premium = list.filter(p => p.fee > 220);

    const totalCount = list.length || 1;

    return {
      totalPatients: list.length,
      social: {
        count: social.length,
        pct: Math.round((social.length / totalCount) * 100),
        estimatedMonthly: social.reduce((a, b) => a + b.fee * 4, 0),
      },
      standard: {
        count: standard.length,
        pct: Math.round((standard.length / totalCount) * 100),
        estimatedMonthly: standard.reduce((a, b) => a + b.fee * 4, 0),
      },
      premium: {
        count: premium.length,
        pct: Math.round((premium.length / totalCount) * 100),
        estimatedMonthly: premium.reduce((a, b) => a + b.fee * 4, 0),
      },
    };
  }, [patients, sessions]);

  // SVG Coordinates for Cumulative Growth Wave
  const svgWidth = 600;
  const svgHeight = 200;
  const padX = 40;
  const padY = 30;

  const maxCumulative = Math.max(...filteredTimeline.map(m => m.cumulativeReceived), 10000);
  const cumulativePoints = useMemo(() => {
    if (filteredTimeline.length === 0) return [];
    const step = (svgWidth - padX * 2) / Math.max(1, filteredTimeline.length - 1);
    return filteredTimeline.map((m, idx) => {
      const x = padX + idx * step;
      const y = svgHeight - padY - (m.cumulativeReceived / maxCumulative) * (svgHeight - padY * 2);
      return { x, y, ...m };
    });
  }, [filteredTimeline, svgWidth, svgHeight, padX, padY, maxCumulative]);

  const cumulativePath = useMemo(() => {
    if (cumulativePoints.length === 0) return '';
    if (cumulativePoints.length === 1) return `M ${cumulativePoints[0].x} ${cumulativePoints[0].y}`;
    let d = `M ${cumulativePoints[0].x} ${cumulativePoints[0].y}`;
    for (let i = 0; i < cumulativePoints.length - 1; i++) {
      const p0 = i > 0 ? cumulativePoints[i - 1] : cumulativePoints[i];
      const p1 = cumulativePoints[i];
      const p2 = cumulativePoints[i + 1];
      const p3 = i !== cumulativePoints.length - 2 ? cumulativePoints[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [cumulativePoints]);

  const cumulativeAreaPath = useMemo(() => {
    if (!cumulativePath || cumulativePoints.length === 0) return '';
    const lastX = cumulativePoints[cumulativePoints.length - 1].x;
    const firstX = cumulativePoints[0].x;
    const bottomY = svgHeight - padY;
    return `${cumulativePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [cumulativePath, cumulativePoints, svgHeight, padY]);

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = ['Mês/Ano', 'Recebido (R$)', 'Pendente (R$)', 'Total (R$)', 'Atendimentos', 'Ticket Médio (R$)', 'Adimplência (%)'];
    const rows = filteredTimeline.map(m => [
      m.fullLabel,
      m.received,
      m.pending,
      m.total,
      m.countTotal,
      m.averageFee,
      `${m.adherenceRate}%`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_clinica_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempGoalInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyGoal(val);
      setIsEditingGoal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP EXECUTIVE HEADER */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Painel de Inteligência Clínica & Histórico
            </h1>
            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Dashboard Financeiro
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Histórico consolidado, projeção de caixa futuro, termômetro de metas e pirâmide de honorários.
          </p>
        </div>

        {/* Global Controls & Year Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-neutral-800"
          >
            <option value="all">Todo o Histórico</option>
            {availableYears.map(y => (
              <option key={y} value={y}>Ano {y}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="Exportar dados para Excel ou Contador"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-VIEWS NAVIGATION (FOCUSED ON USER CHOICES: 1, 3, 4 + HISTÓRICO GERAL) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-200/60 rounded-2xl overflow-x-auto select-none">
        <button
          onClick={() => setActiveSubTab('historico')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'historico'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Histórico Geral & Linha do Tempo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('previsibilidade')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'previsibilidade'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Previsibilidade & Projeção Futura</span>
        </button>

        <button
          onClick={() => setActiveSubTab('metas')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'metas'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Metas & Termômetro</span>
        </button>

        <button
          onClick={() => setActiveSubTab('honorarios')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'honorarios'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pirâmide de Honorários</span>
        </button>
      </div>

      {/* 3. MACRO 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {selectedYear === 'all' ? 'Histórico Total' : `Recebido em ${selectedYear}`}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono tabular-nums">
              {formatBRL(macroKPIs.totalReceived)}
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              {macroKPIs.totalPaidSessions} sessões quitadas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Taxa de Adimplência
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono tabular-nums">
              {macroKPIs.overallAdherence}%
            </div>
            <span className="text-[11px] text-amber-700 mt-0.5 block font-mono">
              {formatBRL(macroKPIs.totalPending)} a receber
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Valor Médio / Sessão
            </span>
            <Activity className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono tabular-nums">
              {formatBRL(macroKPIs.averageFee)}
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Ticket médio por atendimento
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Mês Recorde
            </span>
            <TrendingUp className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono tabular-nums truncate">
              {macroKPIs.peakMonth ? formatBRL(macroKPIs.peakMonth.received) : 'R$ 0,00'}
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block truncate">
              {macroKPIs.peakMonth?.fullLabel || 'Sem dados'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE SUB-VIEW CONTENT */}

      {/* SUB-TAB 1: HISTÓRICO GERAL & LINHA DO TEMPO */}
      {activeSubTab === 'historico' && (
        <div className="space-y-6">
          {/* Cumulative Trajectory Curve */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Curva de Crescimento Acumulado
                </h2>
                <span className="text-xs text-neutral-500">
                  Evolução cumulativa do faturamento ao longo do tempo (visão macro da clínica)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase block">
                  Patrimônio Arrecadado
                </span>
                <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                  {formatBRL(macroKPIs.totalReceived)}
                </span>
              </div>
            </div>

            {/* SVG Cumulative Smooth Wave */}
            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-56 select-none">
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#171717" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#525252" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = svgHeight - padY - pct * (svgHeight - padY * 2);
                  return (
                    <line
                      key={pct}
                      x1={padX}
                      y1={y}
                      x2={svgWidth - padX}
                      y2={y}
                      stroke="#f0f0f0"
                      strokeDasharray="2 3"
                      strokeWidth="1"
                    />
                  );
                })}

                <path d={cumulativeAreaPath} fill="url(#cumGrad)" />
                <path
                  d={cumulativePath}
                  fill="none"
                  stroke="#171717"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {cumulativePoints.map((p) => (
                  <g key={p.key} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#ffffff"
                      stroke="#171717"
                      strokeWidth="2"
                      className="transition-transform group-hover:scale-125"
                    />
                    <text
                      x={p.x}
                      y={svgHeight - 10}
                      fontSize="10"
                      fontWeight="600"
                      fill="#737373"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {p.shortLabel}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Full Monthly Breakdown Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Detalhamento Mês a Mês
                </h2>
                <span className="text-xs text-neutral-500">
                  Performance detalhada de receitas, oscilação MoM e taxas de liquidação
                </span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {filteredTimeline.length} períodos registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-semibold">
                    <th className="py-3 px-4 sm:px-6">Período</th>
                    <th className="py-3 px-3">Atendimentos</th>
                    <th className="py-3 px-3 text-right">Recebido</th>
                    <th className="py-3 px-3 text-right">A Receber</th>
                    <th className="py-3 px-3 text-right">Total Faturado</th>
                    <th className="py-3 px-3 text-right">Ticket Médio</th>
                    <th className="py-3 px-3 text-right">Variação MoM</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Adimplência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredTimeline.map((m) => (
                    <tr key={m.key} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-neutral-900 whitespace-nowrap">
                        {m.fullLabel}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-600 font-mono">
                        {m.countTotal} sessões
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-neutral-900 font-mono tabular-nums whitespace-nowrap">
                        {formatBRL(m.received)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-amber-700 font-mono tabular-nums whitespace-nowrap">
                        {m.pending > 0 ? formatBRL(m.pending) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-neutral-800 font-mono tabular-nums whitespace-nowrap">
                        {formatBRL(m.total)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-neutral-600 font-mono tabular-nums whitespace-nowrap">
                        {formatBRL(m.averageFee)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {m.momGrowth > 0 ? (
                          <span className="text-emerald-700 flex items-center justify-end gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            +{m.momGrowth}%
                          </span>
                        ) : m.momGrowth < 0 ? (
                          <span className="text-rose-600 flex items-center justify-end gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />
                            {m.momGrowth}%
                          </span>
                        ) : (
                          <span className="text-neutral-400">0%</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-mono tabular-nums font-semibold text-neutral-900">
                        {m.adherenceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OPÇÃO 1 - PREVISIBILIDADE & PROJEÇÃO DE CAIXA FUTURO */}
      {activeSubTab === 'previsibilidade' && (
        <div className="space-y-6">
          {/* Capacity and Overview Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Previsibilidade de Faturamento (Próximos 30 e 60 Dias)
                </h2>
                <p className="text-xs text-neutral-500">
                  Cálculo preditivo baseado na sua base de {forecastData.activePatientCount} pacientes ativos e no valor acordado por sessão.
                </p>
              </div>
            </div>

            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 30 Days Forecast */}
              <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-200/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                      Projeção Próximos 30 Dias
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Capacidade de ~{forecastData.monthlyCapacitySessions} atendimentos no mês
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-xl">
                    4 Semanas
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-200/60">
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">Cenário Pleno (100%)</span>
                      <span className="text-[10px] text-neutral-400">Presença total de todos os pacientes</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                      {formatBRL(forecastData.potential30Days100)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/60">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Cenário Realista (90%)</span>
                      <span className="text-[10px] text-emerald-700">Margem saudável com pequenas faltas/feriados</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-900 font-mono tabular-nums">
                      {formatBRL(forecastData.potential30Days90)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-200/60">
                    <div>
                      <span className="text-xs font-bold text-neutral-700 block">Cenário Conservador (80%)</span>
                      <span className="text-[10px] text-neutral-400">Em caso de desmarcações acumuladas</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-700 font-mono tabular-nums">
                      {formatBRL(forecastData.potential30Days80)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 60 Days Forecast */}
              <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-200/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                      Projeção Próximos 60 Dias
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Horizonte bimestral da clínica
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-xl">
                    8 Semanas
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-200/60">
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">Cenário Pleno (100%)</span>
                      <span className="text-[10px] text-neutral-400">Presença total contínua</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                      {formatBRL(forecastData.potential60Days100)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/60">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Cenário Realista (90%)</span>
                      <span className="text-[10px] text-emerald-700">Faturamento esperado mais provável</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-900 font-mono tabular-nums">
                      {formatBRL(forecastData.potential60Days90)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-200/60">
                    <div>
                      <span className="text-xs font-bold text-neutral-700 block">Cenário Conservador (80%)</span>
                      <span className="text-[10px] text-neutral-400">Margem mínima de segurança</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-700 font-mono tabular-nums">
                      {formatBRL(forecastData.potential60Days80)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Insight Box */}
            <div className="mt-5 p-4 bg-white rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">
                  Potencial de Expansão de Horários
                </span>
                <span className="text-[11px] text-neutral-500">
                  Cada novo paciente semanal adicionado na sua base atual incrementa em média <strong>+{formatBRL(forecastData.averageFeePerActive * 4)}/mês</strong> no seu caixa.
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-neutral-900 font-mono">
                  Ticket Base: {formatBRL(forecastData.averageFeePerActive)}/sessão
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: OPÇÃO 3 - PAINEL DE METAS & TERMÔMETRO FINANCEIRO */}
      {activeSubTab === 'metas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs">
            {/* Header + Goal Editor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Termômetro de Metas Financeiras
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Acompanhamento do objetivo mensal de faturamento e ritmo de atendimentos.
                  </p>
                </div>
              </div>

              {/* Editable Goal Trigger */}
              {isEditingGoal ? (
                <form onSubmit={handleSaveGoal} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempGoalInput}
                    onChange={(e) => setTempGoalInput(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl w-32 font-mono font-bold"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="py-1.5 px-3 text-xs font-semibold text-white bg-neutral-900 rounded-xl cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-800"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Meta Definida</span>
                    <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                      {formatBRL(monthlyGoal)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTempGoalInput(String(monthlyGoal));
                      setIsEditingGoal(true);
                    }}
                    className="py-1.5 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Ajustar Meta
                  </button>
                </div>
              )}
            </div>

            {/* Giant Thermometer Card */}
            <div className="p-6 sm:p-8 bg-neutral-950 text-white rounded-3xl relative overflow-hidden">
              <div className="relative z-10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase block">
                      Desempenho no Mês Atual ({currentMonthData?.monthName || 'Mês Atual'})
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white mt-1">
                      {formatBRL(currentMonthAchieved)}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                      {goalPercentage}%
                    </span>
                    <span className="text-xs text-neutral-400 block">da meta atingida</span>
                  </div>
                </div>

                {/* The Sleek Thermometer Bar */}
                <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700/80">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>

                {/* Bottom Diagnosis */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-300 gap-2 border-t border-neutral-800">
                  {remainingToGoal > 0 ? (
                    <span>
                      🎯 Faltam <strong>{formatBRL(remainingToGoal)}</strong> (aprox. <strong>{sessionsNeededForGoal} atendimentos</strong>) para bater o objetivo deste mês.
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Parabéns! Meta do mês batida com sucesso!
                    </span>
                  )}
                  <span className="text-neutral-400 font-mono">
                    Meta: {formatBRL(monthlyGoal)}
                  </span>
                </div>
              </div>
            </div>

            {/* History of Past Goals */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">
                Histórico de Cumprimento de Metas nos Meses Anteriores
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {monthlyTimeline.map(m => {
                  const pct = Math.min(100, Math.round((m.received / monthlyGoal) * 100));
                  const isMet = m.received >= monthlyGoal;
                  return (
                    <div
                      key={m.key}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                        isMet 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                          : 'bg-neutral-50 border-neutral-200/80 text-neutral-900'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{m.shortLabel}</span>
                        <span className="text-[11px] font-mono tabular-nums block mt-0.5">
                          {formatBRL(m.received)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold">{pct}%</span>
                        {isMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-neutral-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OPÇÃO 4 - PIRÂMIDE DE HONORÁRIOS & DISTRIBUIÇÃO DE VAGAS */}
      {activeSubTab === 'honorarios' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Pirâmide de Honorários & Estrutura de Vagas
                </h2>
                <p className="text-xs text-neutral-500">
                  Distribuição dos valores cobrados por sessão clínica para equilíbrio financeiro e acolhimento social.
                </p>
              </div>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Social Slot Tier */}
              <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Vaga Social / Acolhimento
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                      Até R$ 150
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 font-mono mt-3">
                    {honorariosBreakdown.social.count} pacientes
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {honorariosBreakdown.social.pct}% da sua base ativa
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/60">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Receita Mensal Estimada</span>
                  <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                    {formatBRL(honorariosBreakdown.social.estimatedMonthly)}/mês
                  </span>
                </div>
              </div>

              {/* Standard Slot Tier */}
              <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Honorário Intermediário
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                      R$ 160 – R$ 220
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 font-mono mt-3">
                    {honorariosBreakdown.standard.count} pacientes
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {honorariosBreakdown.standard.pct}% da sua base ativa (Núcleo principal)
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/60">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Receita Mensal Estimada</span>
                  <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                    {formatBRL(honorariosBreakdown.standard.estimatedMonthly)}/mês
                  </span>
                </div>
              </div>

              {/* Premium Slot Tier */}
              <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Honorário Pleno / Especialista
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                      R$ 230+
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 font-mono mt-3">
                    {honorariosBreakdown.premium.count} pacientes
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {honorariosBreakdown.premium.pct}% da sua base ativa
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/60">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Receita Mensal Estimada</span>
                  <span className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                    {formatBRL(honorariosBreakdown.premium.estimatedMonthly)}/mês
                  </span>
                </div>
              </div>
            </div>

            {/* Fee Optimization Simulator Box */}
            <div className="mt-6 p-5 bg-white rounded-3xl border border-neutral-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Simulador de Reajuste Anual de Honorários
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Se você aplicar um reajuste inflacionário moderado de <strong>+R$ 20,00</strong> por sessão em toda a sua base de pacientes ativos, o faturamento da sua clínica terá um incremento automático de aproximadamente <strong>+{formatBRL((honorariosBreakdown.totalPatients || 1) * 20 * 4)} por mês</strong> (ou <strong>+{formatBRL((honorariosBreakdown.totalPatients || 1) * 20 * 4 * 12)} ao ano</strong>), sem necessidade de aumentar a sua carga horária de atendimentos semanais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
