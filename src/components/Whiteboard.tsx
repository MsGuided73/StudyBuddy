import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Eraser, Trash2 } from 'lucide-react';

export interface WhiteboardRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const Whiteboard = forwardRef<WhiteboardRef, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set white background initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col w-full h-full shadow-sm">
      <div className="flex justify-between items-center bg-white p-3 rounded-t-xl border border-slate-200 border-b-0">
        <div className="flex gap-3">
          <button onClick={() => { setColor('#000000'); setLineWidth(3); }} className={`w-7 h-7 rounded-full bg-black ${color === '#000000' ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`} />
          <button onClick={() => { setColor('#ef4444'); setLineWidth(3); }} className={`w-7 h-7 rounded-full bg-red-500 ${color === '#ef4444' ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`} />
          <button onClick={() => { setColor('#3b82f6'); setLineWidth(3); }} className={`w-7 h-7 rounded-full bg-blue-500 ${color === '#3b82f6' ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`} />
          <button onClick={() => { setColor('#ffffff'); setLineWidth(20); }} className={`w-7 h-7 rounded-full bg-white border border-slate-300 flex items-center justify-center ${color === '#ffffff' ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`} title="Eraser">
            <Eraser size={16} className="text-slate-500" />
          </button>
        </div>
        <button onClick={clearCanvas} className="text-slate-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Clear Board">
          <Trash2 size={20} />
        </button>
      </div>
      <div className="flex-1 min-h-0 bg-white rounded-b-xl border border-slate-200 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-crosshair touch-none object-contain"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          onTouchMove={draw}
        />
      </div>
    </div>
  );
});
