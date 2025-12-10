import React, { useState, useRef, useEffect } from "react";
import { X, ArrowRight, Hash, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle mounting animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Reset code
      setCode(["", "", "", "", ""]);
      // Focus first input after animation
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    // Handle paste event or multiple chars
    if (value.length > 1) {
      const pastedChars = value.slice(0, 5).split("");
      for (let i = 0; i < pastedChars.length; i++) {
        if (index + i < 5) {
          newCode[index + i] = pastedChars[i];
        }
      }
      setCode(newCode);
      const nextIndex = Math.min(index + pastedChars.length, 4);
      inputsRef.current[nextIndex]?.focus();
    } else {
      // Single character input
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 4) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        // If empty and backspace pressed, move to previous
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 5) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/game"); // <-- chuyển trang
    }, 1500);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
        relative w-full max-w-md bg-slate-900 border border-slate-700/50 
        shadow-[0_0_50px_-12px_rgba(217,70,239,0.3)] 
        rounded-2xl overflow-hidden
        transform transition-all duration-300
        ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
      `}
      >
        {/* Decorative Top Line (Accent Color) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-1 hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 mb-4 shadow-lg">
              <Hash className="text-pink-500" size={24} />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-wide">
              MÃ PHÒNG
            </h2>
            <p className="text-slate-400 text-sm">
              Nơi chỉ có hai ta, một là tôi thắng hai là bạn thua.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-3 mb-8">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if (el) inputsRef.current[index] = el;
                  }}
                  type="text"
                  maxLength={5} // Allow paste but handled in onChange
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`
                    w-12 h-14 text-center text-2xl font-display font-bold rounded-lg
                    bg-slate-950 border-2 transition-all duration-200 focus:outline-none
                    ${
                      digit
                        ? "border-pink-500/50 text-white shadow-[0_0_15px_rgba(236,72,153,0.2)]"
                        : "border-slate-800 text-slate-500 focus:border-indigo-500/50"
                    }
                  `}
                  autoComplete="off"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
              isLoading={isLoading}
              disabled={code.join("").length !== 5}
              icon={!isLoading && <ArrowRight size={18} />}
            >
              VÀO PHÒNG
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
            <ShieldAlert className="text-yellow-500 shrink-0" size={16} />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              Đảm bảo bạn tin tưởng chủ nhà trước khi tham gia. Các hành lang
              riêng không được giám sát bởi hệ thống mai mối xếp hạng.
            </p>
          </div>
        </div>

        {/* Modal Background Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </div>
    </div>
  );
};
