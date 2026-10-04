import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans text-neutral-900">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-neutral-200 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-neutral-900">
                PsiFinanças
              </h1>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Houve uma instabilidade momentânea no carregamento. Os seus dados permanecem seguros na nuvem e no dispositivo.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-2.5 bg-neutral-100 rounded-lg text-[11px] font-mono text-neutral-600 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recarregar Aplicativo</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
