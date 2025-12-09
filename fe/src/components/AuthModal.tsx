import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Github, Gamepad2, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Input } from './input';
import { AuthMode } from '@/interface/type';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (initialMode) setMode(initialMode);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode]);

  if (!shouldRender) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`
        relative w-full max-w-md bg-slate-900 border border-slate-700/50 
        shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] 
        rounded-2xl overflow-hidden
        transform transition-all duration-300
        ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
      `}>
        
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-1 hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">
              {mode === 'login' ? 'CHÀO MỪNG TRỞ LẠI' : 'TẠO TÀI KHOẢN NGAY'}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === 'login' 
                ? 'Nhập thông tin của đạo hữu' 
                : 'Xin bằng hữu để lại thông tin'}
            </p>
          </div>


          

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Username"
                placeholder="CyberNinja2077"
                icon={<User size={18} />}
                required
              />
            )}
            
            <Input
              label="Email Address"
              type="email"
              placeholder="agent@neon.nexus"
              icon={<Mail size={18} />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                required
              />
              {mode === 'login' && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </a>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              isLoading={isLoading}
              icon={!isLoading && <ArrowRight size={18} />}
            >
              {mode === 'login' ? 'VÀO GAME' : 'TẠO TÀI KHOẢN'}
            </Button>
          </form>

          {/* Footer Switcher */}
          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === 'login' ? "Bạn chưa có tài khoản? " : "Bạn đã có tài khoản "}
            <button 
              onClick={toggleMode}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus:outline-none underline decoration-indigo-400/30 hover:decoration-indigo-400"
            >
              {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </div>
        </div>
        
        {/* Decorative Grid Background for Modal */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </div>
    </div>
  );
};
