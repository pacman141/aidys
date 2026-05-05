import { HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';

export function LogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <HeartHandshake className="w-full h-full text-white" strokeWidth={2.5} />
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }} 
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute -top-1 -right-1 w-2 h-2 bg-rose-400 rounded-full"
      />
    </div>
  );
}
