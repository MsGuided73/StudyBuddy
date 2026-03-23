import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Whiteboard, WhiteboardRef } from './components/Whiteboard';
import { Robot } from './components/Robot';
import { Onboarding } from './components/Onboarding';
import { Message, sendMessage } from './services/geminiService';
import { useLiveAPI } from './hooks/useLiveAPI';
import { Mic, MicOff, Loader2, MessageSquare, PenTool, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [mode, setMode] = useState<'chat' | 'live'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const whiteboardRef = useRef<WhiteboardRef>(null);
  const getCanvas = useCallback(() => whiteboardRef.current?.getCanvas() || null, []);
  const { isConnected, isConnecting, error: liveError, connect, disconnect } = useLiveAPI(getCanvas, userName);

  useEffect(() => {
    if (isNameSet && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hey ${userName}! 👋 I'm Study Buddy.\n\nUpload a photo of a problem you're stuck on, or type it out, and we'll figure it out together!`
        }
      ]);
    }
  }, [isNameSet, userName, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (mode === 'chat') {
      scrollToBottom();
    }
  }, [messages, mode]);

  const handleSendMessage = async (text: string, imageFile?: File) => {
    const newMessageId = Date.now().toString();
    
    const userMessage: Message = {
      id: newMessageId,
      role: 'user',
      text,
    };

    if (imageFile) {
      userMessage.imageUrl = URL.createObjectURL(imageFile);
    }

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { id: modelMessageId, role: 'model', text: '', isThinking: true }
    ]);

    try {
      const { stream, base64, mimeType } = await sendMessage(messages, text, userName, imageFile);
      
      if (base64 && mimeType) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessageId 
              ? { ...msg, imageBase64: base64, imageMimeType: mimeType } 
              : msg
          )
        );
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, isThinking: false } : msg
        )
      );

      const reader = stream.getReader();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        fullText += value;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: fullText } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === modelMessageId 
            ? { ...msg, text: "Oops, I ran into an error. Could you try that again?", isThinking: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isNameSet) {
    return <Onboarding onComplete={(name) => { setUserName(name); setIsNameSet(true); }} />;
  }

  const lastMessage = messages[messages.length - 1];
  let robotState: 'idle' | 'thinking' | 'talking' = 'idle';
  if (isLoading) {
    if (lastMessage?.role === 'model') {
      robotState = lastMessage.isThinking ? 'thinking' : 'talking';
    } else {
      robotState = 'thinking';
    }
  }
  if (isConnected) {
    robotState = 'talking';
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-sky-50 font-sans">
      {/* Left Panel: Robot & Controls */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-sky-100 border-r border-sky-200 flex flex-col">
        <div className="p-6 flex flex-col items-center justify-center flex-1">
          <Robot state={robotState} />
          <h1 className="text-3xl font-bold text-sky-800 mt-6 text-center">Study Buddy</h1>
          <p className="text-sky-600 text-center font-medium mt-1">Hey, {userName}!</p>
        </div>
        
        <div className="p-4 bg-sky-50/50 border-t border-sky-200">
          <div className="flex bg-white p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setMode('chat')} 
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${mode === 'chat' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <MessageSquare size={16} />
              Notes
            </button>
            <button 
              onClick={() => setMode('live')} 
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${mode === 'live' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <PenTool size={16} />
              Board
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full bg-white relative">
        {mode === 'chat' ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessage message={msg} userName={userName} />
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="shrink-0 border-t border-slate-100 bg-white relative">
              {messages.length > 2 && (
                <div className="absolute -top-14 left-0 right-0 flex justify-center pointer-events-none z-10">
                  <button
                    onClick={() => handleSendMessage("Please show me the full step-by-step solution for this problem so I can review the entire process.")}
                    disabled={isLoading}
                    className="pointer-events-auto text-sm bg-white text-sky-600 border border-sky-200 px-4 py-2 rounded-full hover:bg-sky-50 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 font-bold"
                  >
                    <BookOpen size={16} />
                    Review Full Solution
                  </button>
                </div>
              )}
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
          </>
        ) : (
          // Live Board View
          <div className="flex-1 flex flex-col p-4 md:p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Live Whiteboard</h2>
                <p className="text-sm text-slate-500">Draw and talk with Study Buddy!</p>
              </div>
              <button
                 onClick={isConnected ? disconnect : connect}
                 disabled={isConnecting}
                 className={`px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-colors ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {isConnecting ? <Loader2 className="animate-spin" size={18} /> : isConnected ? <MicOff size={18} /> : <Mic size={18} />}
                 {isConnecting ? 'Connecting...' : isConnected ? 'End Session' : 'Start Voice'}
               </button>
            </div>
            
            {liveError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 mb-4">
                {liveError}
              </div>
            )}
            
            <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <Whiteboard ref={whiteboardRef} />
              
              {isConnected && (
                <div className="absolute top-4 right-4 bg-sky-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Live Audio & Video Active
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
