import React, { useMemo, useState } from 'react';
import { SessionEntry, Patient } from '../types/finance';
import { 
  Banknote, 
  CreditCard, 
  Target, 
  ArrowDownLeft, 
  Clock, 
  Plus, 
  ArrowRight,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface DashboardOverviewProps {
  sessions: SessionEntry[];
  patients: Patient[];
  onOpenNewSession: () => void;
  onNavigateToTab: (tab: 'entradas' | 'graficos' | 'pacientes') => void;
  onToggleStatus: (sessionId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  sessions,
  patients,
  onOpenNewSession,
  onNavigateToTab,
  onToggleStatus,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; value: number } | null>(null);

  // Month names abbreviation
  const monthAbbrs = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Current year & month metrics
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Calculate All-time and Month Totals
  const totalReceivedAll = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'received')
      .reduce((acc, curr) => acc + curr.fee, 0);
  }, [sessions]);

  const currentMonthReceived = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'received' && s.date.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.fee, 0);
  }, [sessions, currentMonthStr]);

  const currentMonthPending = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'pending' && s.date.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.fee, 0);
  }, [sessions, currentMonthStr]);

  // Goal calculation: default monthly target or 120% of current received
  const monthlyGoal = 18000;
  const goalPercentage = Math.min(100, Math.round(((currentMonthReceived || 1) / monthlyGoal) * 100));

  // 2. Generate smooth 6-month data for Cash Flow curve
  const chartMonths = useMemo(() => {
    const list: { key: string; label: string; value: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = monthAbbrs[d.getMonth()];
      
      const monthReceived = sessions
        .filter((s) => s.status === 'received' && s.date.startsWith(ym))
        .reduce((acc, curr) => acc + curr.fee, 0);

      const count = sessions.filter((s) => s.date.startsWith(ym)).length;

      list.push({ key: ym, label, value: monthReceived, count });
    }
    return list;
  }, [sessions, currentYear, now]);

  // SVG dimensions for smooth curve
  const chartWidth = 540;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxValue = useMemo(() => {
    const max = Math.max(...chartMonths.map((m) => m.value), 5000);
    return Math.ceil(max / 1000) * 1000;
  }, [chartMonths]);

  // Compute smooth curve coordinates
  const points = useMemo(() => {
    const step = (chartWidth - paddingX * 2) / (chartMonths.length - 1);
    return chartMonths.map((m, idx) => {
      const x = paddingX + idx * step;
      const y = chartHeight - paddingY - (m.value / (maxValue || 1)) * (chartHeight - paddingY * 2);
      return { x, y, ...m };
    });
  }, [chartMonths, chartWidth, chartHeight, paddingX, paddingY, maxValue]);

  // Generate SVG path with smooth cubic Bezier curves
  const svgPath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  const svgAreaPath = useMemo(() => {
    if (!svgPath || points.length === 0) return '';
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = chartHeight - paddingY;
    return `${svgPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [svgPath, points, chartHeight, paddingY]);

  // 3. Recent 5 Transactions
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [sessions]);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateShort = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d} ${monthAbbrs[parseInt(m, 10) - 1]}`;
  };

  return (
    <div className="w-full">
      {/* 1. TOP DARK HERO CANOPY */}
      <section className="bg-neutral-950 text-white pt-8 pb-20 sm:pb-24 px-4 sm:px-8 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[11px] sm:text-xs font-semibold tracking-widest text-neutral-400 uppercase block mb-2">
            SALDO TOTAL EM CAIXA
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-sans tabular-nums text-white">
              {formatBRL(totalReceivedAll)}
            </h1>

            <span className="text-xs sm:text-sm font-medium text-emerald-400 bg-neutral-900/80 border border-neutral-800 px-2.5 py-1 rounded-full whitespace-nowrap">
              +12,4% este mês
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE 3 FLOATING CARDS (Straddling dark canopy and light body) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 -mt-10 sm:-mt-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Receitas */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-800">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-neutral-500 font-medium">Receitas (Mês)</div>
              <div className="text-base sm:text-lg font-bold text-neutral-900 tabular-nums truncate">
                {formatBRL(currentMonthReceived)}
              </div>
            </div>
          </div>

          {/* Card 2: A Receber (Pendentes) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-800">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-neutral-500 font-medium">A Receber (Pendentes)</div>
              <div className="text-base sm:text-lg font-bold text-neutral-900 tabular-nums truncate">
                {formatBRL(currentMonthPending)}
              </div>
            </div>
          </div>

          {/* Card 3: Meta do Mês */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-neutral-600 font-medium">Meta do Mês</span>
              </div>
              <span className="text-[11px] font-semibold text-neutral-900 tabular-nums">
                ({goalPercentage}% atingido)
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mt-3 border border-neutral-200/60">
              <div 
                className="h-full bg-neutral-900 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: 2 BIG WIDGETS (FLUXO DE CAIXA + ÚLTIMAS TRANSAÇÕES) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* LEFT WIDGET: FLUXO DE CAIXA (Smooth Wave Chart) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-neutral-900 uppercase">
                  FLUXO DE CAIXA
                </h2>
                <span className="text-[11px] text-neutral-500">
                  Evolução de recebimentos (Últimos 6 meses)
                </span>
              </div>

              {hoveredPoint && (
                <div className="text-right animate-in fade-in duration-150">
                  <div className="text-[10px] text-neutral-400 font-medium">{hoveredPoint.month}</div>
                  <div className="text-xs font-bold text-neutral-900 tabular-nums">
                    {formatBRL(hoveredPoint.value)}
                  </div>
                </div>
              )}
            </div>

            {/* SVG Area Chart matching the user's reference image */}
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto max-h-56 select-none"
              >
                <defs>
                  {/* Subtle charcoal / monochrome gradient fill under curve */}
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#171717" stopOpacity="0.45" />
                    <stop offset="70%" stopColor="#525252" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#a3a3a3" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                {[0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
                  return (
                    <g key={pct}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#e5e5e5"
                        strokeDasharray="2 3"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3}
                        fontSize="9"
                        fill="#a3a3a3"
                        textAnchor="end"
                        className="font-mono"
                      >
                        {Math.round((maxValue * pct) / 1000)}k
                      </text>
                    </g>
                  );
                })}

                {/* Gradient area */}
                <path d={svgAreaPath} fill="url(#curveGradient)" />

                {/* Clean dark curve stroke */}
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#171717"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Point nodes and labels */}
                {points.map((p, idx) => (
                  <g
                    key={p.key}
                    onMouseEnter={() => setHoveredPoint({ month: p.label, value: p.value })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer group"
                  >
                    {/* Circle Node */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#ffffff"
                      stroke="#171717"
                      strokeWidth="2"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Month Label on X axis */}
                    <text
                      x={p.x}
                      y={chartHeight - 8}
                      fontSize="10"
                      fontWeight="600"
                      fill="#525252"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Média de {formatBRL(Math.round(totalReceivedAll / Math.max(1, chartMonths.length)))}/mês
              </span>
              <button
                onClick={() => onNavigateToTab('graficos')}
                className="text-xs font-semibold text-neutral-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver comparativo completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT WIDGET: ÚLTIMAS TRANSAÇÕES */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-neutral-900">
                  Últimas Transações
                </h2>
                <button
                  onClick={() => onNavigateToTab('entradas')}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Ver todas
                </button>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {recentSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    Nenhuma transação recente encontrada.
                  </div>
                ) : (
                  recentSessions.map((session) => {
                    const isReceived = session.status === 'received';
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60"
                      >
                        {/* Left: Icon in dark circle */}
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => onToggleStatus(session.id)}
                            title={isReceived ? 'Marcar como pendente' : 'Marcar como recebido'}
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95 ${
                              isReceived
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                            }`}
                          >
                            {isReceived ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-neutral-900 truncate">
                              {session.patientName}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">
                              {session.paymentMethod || 'PIX'} · {formatDateShort(session.date)}
                            </div>
                          </div>
                        </div>

                        {/* Right: Value */}
                        <div className="text-right shrink-0">
                          <div
                            className={`text-xs font-bold tabular-nums ${
                              isReceived ? 'text-neutral-900' : 'text-amber-700'
                            }`}
                          >
                            {isReceived ? `+ ${formatBRL(session.fee)}` : formatBRL(session.fee)}
                          </div>
                          <div className="text-[9px] text-neutral-400">
                            {isReceived ? 'Recebido' : 'A receber'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Quick Action */}
            <div className="mt-5 pt-3 border-t border-neutral-100">
              <button
                onClick={onOpenNewSession}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nova Entrada</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
