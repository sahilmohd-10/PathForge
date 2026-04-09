import React from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
}

const PageShell: React.FC<PageShellProps> = ({ 
  title, 
  subtitle, 
  children, 
  actions,
  maxWidth = 'max-w-7xl'
}) => {
  return (
    <div className={`p-6 md:p-8 ${maxWidth} mx-auto transition-all duration-300`}>
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h1>
          {subtitle && <p className="text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
      <div className="pb-10">
        {children}
      </div>
    </div>
  );
};

export default PageShell;
