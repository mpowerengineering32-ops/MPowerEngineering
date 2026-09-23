import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900/90 border border-rose-850 rounded-2xl p-6 my-4 shadow-xl text-slate-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">
                {this.props.fallbackTitle || 'พบข้อผิดพลาดในการแสดงผลหน้าจอนี้'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                เกิดข้อผิดพลาดชั่วคราวในการประมวลผลข้อมูล ระบบได้ป้องกันไม่ให้เกิดผลกระทบต่อส่วนอื่นๆ ของแอปพลิเคชัน
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-rose-300 break-all">
                  {this.state.error.toString()}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ลองโหลดหน้านี้ใหม่อีกครั้ง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    this.handleReset();
                    window.location.hash = 'dashboard';
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
