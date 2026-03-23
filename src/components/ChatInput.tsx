import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Send, Image as ImageIcon, X, Calculator } from 'lucide-react';

const MATH_SYMBOLS = [
  // Basic Operators
  { label: '+', value: '+' },
  { label: '-', value: '-' },
  { label: '×', value: '×' },
  { label: '÷', value: '÷' },
  { label: '=', value: '=' },
  { label: '≠', value: '≠' },
  { label: '≈', value: '≈' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
  { label: '±', value: '±' },
  
  // Constants & Variables
  { label: 'π', value: 'π' },
  { label: 'e', value: 'e' },
  { label: 'i', value: 'i' },
  { label: 'θ', value: 'θ' },
  { label: 'μ', value: 'μ' },
  { label: 'σ', value: 'σ' },
  { label: 'x̄', value: 'x̄' },
  { label: 'p̂', value: 'p̂' },

  // Algebra & Functions
  { label: '√', value: '√' },
  { label: 'x²', value: '²' },
  { label: 'x³', value: '³' },
  { label: 'xⁿ', value: '^' },
  { label: 'sin', value: 'sin()' },
  { label: 'cos', value: 'cos()' },
  { label: 'tan', value: 'tan()' },
  { label: 'ln', value: 'ln()' },
  { label: 'log', value: 'log()' },
  
  // Calculus
  { label: '∫', value: '∫' },
  { label: '∮', value: '∮' },
  { label: '∑', value: '∑' },
  { label: '∏', value: '∏' },
  { label: '∂', value: '∂' },
  { label: '∇', value: '∇' },
  { label: 'lim', value: 'lim ' },
  { label: '→', value: '→' },
  { label: '∞', value: '∞' },

  // Complex & Matrices
  { label: 'Re', value: 'Re()' },
  { label: 'Im', value: 'Im()' },
  { label: 'arg', value: 'arg()' },
  { label: 'conj', value: 'conj()' },
  { label: 'det', value: 'det()' },
  { label: 'tr', value: 'tr()' },
  { label: 'inv', value: 'inv()' },
  { label: 'Aᵀ', value: 'ᵀ' },

  // Statistics
  { label: 'P', value: 'P()' },
  { label: 'E', value: 'E()' },
  { label: 'Var', value: 'Var()' },
  { label: 'Cov', value: 'Cov()' },

  // Brackets
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: '[', value: '[' },
  { label: ']', value: ']' },
  { label: '{', value: '{' },
  { label: '}', value: '}' },
  { label: '|x|', value: '||' },
];

interface ChatInputProps {
  onSendMessage: (text: string, imageFile?: File) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(undefined);
    setImagePreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if ((text.trim() || imageFile) && !disabled) {
      onSendMessage(text, imageFile);
      setText('');
      handleRemoveImage();
    }
  };

  const insertSymbol = (symbol: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.substring(0, start) + symbol + text.substring(end);
      setText(newText);
      
      setTimeout(() => {
        let newCursorPos = start + symbol.length;
        if (symbol.endsWith('()') || symbol === '||') {
          newCursorPos -= 1;
        }
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        textarea.focus();
      }, 0);
    } else {
      setText(text + symbol);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 w-full">
      <div className="max-w-3xl mx-auto relative flex flex-col gap-3">
        {imagePreview && (
          <div className="relative inline-block w-max">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-24 w-auto rounded-lg border border-slate-200 object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-700 transition-colors"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {showMathKeyboard && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-1.5">
            {MATH_SYMBOLS.map((sym, i) => (
              <button
                key={i}
                onClick={() => insertSymbol(sym.value)}
                className="bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 rounded-lg py-1.5 text-sm font-medium transition-colors"
                type="button"
              >
                {sym.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-sky-500/50 focus-within:border-sky-500 transition-all">
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors shrink-0"
              disabled={disabled}
              aria-label="Upload image"
            >
              <ImageIcon size={22} />
            </button>
            <button
              type="button"
              onClick={() => setShowMathKeyboard(!showMathKeyboard)}
              className={`p-3 rounded-xl transition-colors shrink-0 ${showMathKeyboard ? 'text-sky-600 bg-sky-100' : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'}`}
              disabled={disabled}
              aria-label="Toggle math keyboard"
            >
              <Calculator size={22} />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or upload a problem..."
            className="flex-1 max-h-48 min-h-[52px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-slate-700 placeholder:text-slate-400"
            disabled={disabled}
            rows={1}
            style={{ height: 'auto' }}
          />
          
          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !imageFile)}
            className="p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:opacity-50 disabled:hover:bg-sky-500 transition-colors shrink-0 flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
