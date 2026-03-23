import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Robot } from './Robot';

export const Onboarding = ({ onComplete }: { onComplete: (name: string) => void }) => {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center"
      >
        <div className="h-48 flex items-center justify-center mb-6">
          <Robot state="idle" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Hey there!</h1>
        <p className="text-slate-600 mb-8">I'm Study Buddy, your new AI math tutor. What should I call you?</p>
        
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onComplete(name.trim()); }}>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all text-lg text-center mb-6"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            Let's Study!
          </button>
        </form>
      </motion.div>
    </div>
  );
}
