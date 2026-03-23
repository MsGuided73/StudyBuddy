import React from 'react';
import { motion } from 'motion/react';

export const Robot = ({ state }: { state: 'idle' | 'thinking' | 'talking' }) => {
  const isThinking = state === 'thinking';
  const isTalking = state === 'talking';

  return (
    <motion.svg 
      width="160" 
      height="160" 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: isTalking ? [0, -8, 0] : [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: isTalking ? 0.4 : 2, ease: "easeInOut" }}
    >
      {/* Antenna Line */}
      <line x1="100" y1="40" x2="100" y2="20" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
      
      {/* Antenna Bulb */}
      <motion.circle 
        cx="100" 
        cy="16" 
        r="8" 
        fill="#38bdf8"
        animate={isThinking ? { fill: ['#38bdf8', '#fcd34d', '#38bdf8'], scale: [1, 1.3, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1 }}
      />

      {/* Head/Body */}
      <rect x="40" y="40" width="120" height="100" rx="30" fill="#e0f2fe" stroke="#0284c7" strokeWidth="8" />
      
      {/* Screen */}
      <rect x="55" y="55" width="90" height="60" rx="15" fill="#0f172a" />

      {/* Eyes */}
      <motion.g animate={isThinking ? { x: [0, 10, -10, 0], y: [0, -5, -5, 0] } : {}}>
        {/* Left Eye */}
        <motion.circle 
          cx="80" cy="80" r="8" fill="#38bdf8"
          animate={isTalking ? { scaleY: [1, 0.2, 1] } : { scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: isTalking ? 0.3 : 4, times: isTalking ? [0, 0.5, 1] : [0, 0.45, 0.5, 0.55, 1] }}
        />
        {/* Right Eye */}
        <motion.circle 
          cx="120" cy="80" r="8" fill="#38bdf8"
          animate={isTalking ? { scaleY: [1, 0.2, 1] } : { scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: isTalking ? 0.3 : 4, times: isTalking ? [0, 0.5, 1] : [0, 0.45, 0.5, 0.55, 1] }}
        />
      </motion.g>

      {/* Mouth */}
      {isTalking ? (
        <motion.rect 
          x="90" y="95" width="20" height="10" rx="5" fill="#38bdf8"
          animate={{ height: [4, 12, 4], y: [98, 94, 98] }}
          transition={{ repeat: Infinity, duration: 0.2 }}
        />
      ) : (
        <rect x="92" y="100" width="16" height="4" rx="2" fill="#38bdf8" />
      )}

      {/* Arms */}
      <path d="M 36 80 Q 20 90 20 110" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 164 80 Q 180 90 180 110" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" fill="none" />
    </motion.svg>
  );
}
