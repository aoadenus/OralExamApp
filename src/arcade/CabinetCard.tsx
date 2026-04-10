import { motion } from 'framer-motion';

export function CabinetCard({
  title,
  description,
  difficulty,
  icon,
  accentColor = 'cyan',
  onClick,
}: {
  title: string;
  description: string;
  difficulty: string;
  icon: string;
  accentColor?: 'cyan' | 'fuchsia' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}) {
  const gradientMap = {
    cyan: 'from-cyan-400 via-blue-500 to-indigo-500',
    fuchsia: 'from-fuchsia-400 via-purple-500 to-indigo-500',
    emerald: 'from-emerald-400 via-teal-500 to-cyan-500',
    amber: 'from-amber-400 via-orange-500 to-rose-500',
    rose: 'from-rose-400 via-pink-500 to-fuchsia-500',
  };
  const borderMap = {
    cyan: 'border-cyan-400/20 hover:border-cyan-400/50',
    fuchsia: 'border-fuchsia-400/20 hover:border-fuchsia-400/50',
    emerald: 'border-emerald-400/20 hover:border-emerald-400/50',
    amber: 'border-amber-400/20 hover:border-amber-400/50',
    rose: 'border-rose-400/20 hover:border-rose-400/50',
  };

  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[20px] border ${borderMap[accentColor]} bg-[#101826] p-5 text-left shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)]`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradientMap[accentColor]} opacity-80`} />
      <div className="mb-3 text-3xl">{icon}</div>
      <div className="mb-3 inline-flex rounded-full border border-cyan-300/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300">
        {difficulty}
      </div>
      <h3 className="font-['Orbitron'] text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </motion.button>
  );
}
