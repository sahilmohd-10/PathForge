import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`p-6 md:p-10 ${maxWidth} mx-auto transition-all duration-300 min-h-screen`}
    >
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-12">
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-slate-500 dark:text-slate-400 font-semibold max-w-2xl leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {actions && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            {actions}
          </motion.div>
        )}
      </div>
      <div className="pb-20">
        {children}
      </div>
    </motion.div>
  );
};

export default PageShell;