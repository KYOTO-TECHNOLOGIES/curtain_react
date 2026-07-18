import React from 'react';

export interface ErrorStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({ icon, title, description, actionButton }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f7f9] p-8 text-center">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-8deg); }
          30% { transform: rotate(8deg); }
          45% { transform: rotate(-4deg); }
          60% { transform: rotate(4deg); }
          75% { transform: rotate(-2deg); }
          90% { transform: rotate(2deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .error-icon-wrapper {
          animation: float 3s ease-in-out infinite;
        }
        .error-ring {
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
        .error-content {
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }
        .error-button {
          animation: fadeInUp 0.6s ease-out 0.5s both;
        }
      `}</style>
      
      <div className="error-icon-wrapper mb-8">
        <div className="relative">
          <div className="error-ring absolute inset-[-20px] rounded-full bg-gradient-to-br from-blue-100 to-slate-100"></div>
          <div className="relative z-10">
            {icon}
          </div>
        </div>
      </div>
      
      <div className="error-content">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b] mb-3 tracking-tight">
          {title}
        </h2>
        <p className="text-slate-500 mb-8 max-w-md text-[15px] md:text-[16px] leading-relaxed">
          {description}
        </p>
      </div>
      
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="error-button px-8 py-3.5 bg-[#2b5c8f] text-white rounded-2xl font-semibold hover:bg-[#1f456e] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
