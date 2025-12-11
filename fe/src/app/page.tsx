"use client";

import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/Button";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { MatchmakingLoader } from "@/components/MatchmakingLoader";
import { CreateRoomModal } from "@/components/CreateRoomModal";

type NextAction = "none" | "quick-play" | "create-room";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [nextAction, setNextAction] = useState<NextAction>("none");

  // Load user từ localStorage khi vào trang
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  // Bấm CHƠI NGAY
  const handlePlayNow = () => {
    setNextAction("quick-play");

    if (!currentUser) {
      // chưa login → mở modal login
      setIsModalOpen(true);
    } else {
      // đã login → mở tìm trận
      setIsMatchmakingOpen(true);
    }
  };

  // Bấm TẠO PHÒNG
  const handleCreateRoom = () => {
    setNextAction("create-room");

    if (!currentUser) {
      // chưa login → yêu cầu login trước
      setIsModalOpen(true);
    } else {
      // đã login → mở modal tạo phòng
      setIsCreateRoomOpen(true);
    }
  };

  // Login / Register thành công
  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setIsModalOpen(false);

    if (nextAction === "quick-play") {
      setIsMatchmakingOpen(true);
    } else if (nextAction === "create-room") {
      setIsCreateRoomOpen(true);
    }

    setNextAction("none");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
    }
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/05/co-caro.jpg"
          alt="Game Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/40" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg rotate-45 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <div className="w-3 h-3 bg-white rounded-full -rotate-45" />
          </div>
          <span className="text-2xl font-display font-bold text-white tracking-widest ml-2">
            NEON<span className="text-indigo-500">NEXUS</span>
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
          <a href="#" className="hover:text-white transition-colors">
            HOME
          </a>
          <a href="#" className="hover:text-white transition-colors">
            PLAY
          </a>
          <a href="#" className="hover:text-white transition-colors">
            RANKING
          </a>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <span className="text-sm text-slate-300">
              Xin chào,{" "}
              <span className="font-semibold text-white">
                {currentUser.name}
              </span>
            </span>
          )}

          {currentUser ? (
            <Button variant="ghost" onClick={handleLogout}>
              LOGOUT
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
              LOGIN
            </Button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-20 flex-grow flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest mb-4">
            SEASON 5 IS LIVE
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
            Caro Online <br />
            <span className="uppercase md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Chơi Mọi Lúc, Thắng Mọi Nơi
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Chơi đối kháng trực tuyến, ghép trận nhanh, bảng xếp hạng cập nhật
            theo thời gian thực.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button
              onClick={handlePlayNow}
              className="w-full sm:w-auto text-lg h-14 px-10"
              icon={<Play fill="currentColor" size={20} />}
            >
              CHƠI NGAY
            </Button>

            <Button
              variant="secondary"
              className="w-full sm:w-auto h-14"
              onClick={handleCreateRoom}
            >
              TẠO PHÒNG
            </Button>
          </div>
        </div>
      </main>

      <footer className="relative z-20 py-8 text-center text-slate-600 text-sm">
        <p>&copy; 2024 Neon Nexus Studios. All rights reserved.</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNextAction("none");
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Matchmaking Loader */}
      <MatchmakingLoader
        isOpen={isMatchmakingOpen}
        onCancel={() => setIsMatchmakingOpen(false)}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
      />
    </div>
  );
}
