import React from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
  userName: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, userName }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`mb-8 ${isModel ? '' : 'border-b-2 border-slate-100 pb-6'}`}>
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isModel ? 'text-sky-500' : 'text-slate-400'}`}>
        {isModel ? 'Study Buddy' : userName}
      </h3>
      
      {message.imageUrl && (
        <img 
          src={message.imageUrl} 
          alt="Uploaded math problem" 
          className="max-w-full sm:max-w-md rounded-xl mb-4 object-contain border border-slate-200 shadow-sm"
          referrerPolicy="no-referrer"
        />
      )}
      
      {message.text && (
        <div className={`markdown-body prose prose-sm sm:prose-base max-w-none ${isModel ? 'prose-slate' : 'text-lg font-medium text-slate-800'}`}>
          {isModel ? (
            <Markdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.text}
            </Markdown>
          ) : (
            <p>{message.text}</p>
          )}
        </div>
      )}
      
      {message.isThinking && (
        <div className="flex items-center gap-2 text-sky-400 mt-4">
          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};
