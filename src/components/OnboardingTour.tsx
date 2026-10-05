import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  HelpCircle,
  LayoutDashboard,
  Calendar,
  ArrowDownLeft,
  BarChart3,
  Users,
  ShieldCheck
} from 'lucide-react';
import { AppTab } from './Navbar';

export interface TourStep {
  targetId: string;
  tabToOpen?: AppTab;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AppTab) => void;
  hasDemoData: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  hasDemoData,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      targetId: 'tour-brand',
      tabToOpen: 'dashboard',
      title: 'Bem-vindo ao PsiFinance!',
      description: 'Seu sistema definitivo de gestão financeira e agendamento clínico para psicólogos. Vamos fazer um tour guiado de 1 minuto para você conhecer cada ferramenta?',
      icon: Sparkles,
    },
    {
      targetId: 'tour-nav-dashboard',
      tabToOpen: 'dashboard',
      title: 'Dashboard & Indicadores Clínicos',
      description: 'Visão executiva em tempo real: faturamento do mês atual, valores pendentes a receber, taxa de adimplência e lançamentos recentes.',
      icon: LayoutDashboard,
    },
    {
      targetId: 'tour-nav-agenda',
      tabToOpen: 'agenda',
      title: 'Agenda de Sessões (Calendário & Lista)',
      description: 'Controle de horários em formato de calendário mensal ou lista corrida. Use o botão "Concluir & Faturar" para lançar atendimentos no financeiro com 1 clique!',
      icon: Calendar,
    },
    {
      targetId: 'tour-nav-entradas',
      tabToOpen: 'entradas',
      title: 'Transações & Lançamentos',
      description: 'Histórico completo de atendimentos com filtros por período. Alterne status entre "Recebido" e "A Receber" e envie recibos formatados no WhatsApp do paciente.',
      icon: ArrowDownLeft,
    },
    {
      targetId: 'tour-nav-graficos',
      tabToOpen: 'graficos',
      title: 'Relatórios, Previsibilidade & Metas',
      description: 'Acompanhe a curva de crescimento acumulado, projeção de caixa futuro para 30/60 dias, termômetro da sua meta financeira mensal e a pirâmide de honorários.',
      icon: BarChart3,
    },
    {
      targetId: 'tour-nav-pacientes',
      tabToOpen: 'pacientes',
      title: 'Gestão de Pacientes & Honorários',
      description: 'Cadastre sua base ativa com valor acordado por atendimento, contatos e visualize o extrato financeiro individual de cada paciente.',
      icon: Users,
    },
    ...(hasDemoData ? [{
      targetId: 'tour-demo-cleanup',
      tabToOpen: 'dashboard' as AppTab,
      title: 'Dados de Exemplo vs. Consultório Real',
      description: 'Os pacientes e sessões atuais são fictícios para você explorar o sistema. Quando estiver pronto para atender, use o botão "Limpar Dados de Exemplo" para zerar a base com segurança!',
      icon: ShieldCheck,
    }] : []),
  ];

  const currentStep = steps[currentStepIndex];

  // Update target rect whenever step changes or window resizes
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep.tabToOpen) {
      onNavigateTab(currentStep.tabToOpen);
    }

    const updateRect = () => {
      // Small timeout to allow tab render transition
      setTimeout(() => {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          // Scroll element into view smoothly if not visible
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          // Fallback to center
          setTargetRect(null);
        }
      }, 100);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [isOpen, currentStepIndex, currentStep, onNavigateTab]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('psifinance_tour_completed', 'true');
    onClose();
  };

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* 1. Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-neutral-950/65 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={handleFinish}
      />

      {/* 2. Spotlight Highlight Ring over target element */}
      {targetRect && (
        <div
          className="absolute border-2 border-white rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none transition-all duration-300 ease-out z-50 animate-pulse"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* 3. Floating Informative Tour Card (Balão Informativo) */}
      <div 
        className="fixed z-50 max-w-sm sm:max-w-md w-[calc(100vw-32px)] transition-all duration-300 ease-out"
        style={{
          // Smart positioning: if target is in upper half of viewport, place card below; otherwise above
          top: targetRect 
            ? targetRect.bottom + 220 < window.innerHeight
              ? `${Math.min(window.innerHeight - 280, targetRect.bottom + 16)}px`
              : `${Math.max(20, targetRect.top - 240)}px`
            : '50%',
          left: targetRect
            ? `${Math.min(window.innerWidth - 380, Math.max(20, targetRect.left))}px`
            : '50%',
          transform: !targetRect ? 'translate(-50%, -50%)' : 'none',
        }}
      >
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200/90 text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                <StepIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 font-mono">
                Passo {currentStepIndex + 1} de {steps.length}
              </span>
            </div>
            <button
              onClick={handleFinish}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl cursor-pointer"
              title="Pular Tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-neutral-900">
              {currentStep.title}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Step Progress Dots & Buttons */}
          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-6 bg-neutral-900'
                      : 'w-1.5 bg-neutral-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 cursor-pointer"
                  title="Voltar passo"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleNext}
                className="py-2 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}</span>
                {currentStepIndex === steps.length - 1 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
