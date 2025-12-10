"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  BOARD_SIZE,
  GameState,
  Player,
  ChatMessage,
  MoveLog,
} from "@/interface/type";
import { calculateWinner } from "@/utils/gameLogic";
import { PlayerCard } from "@/components/PlayerCard";
import { Chat } from "@/components/Chat";
import { Modal } from "@/components/Modal";
import {
  IconRefresh,
  IconUndo,
  IconFlag,
  IconHandshake,
  IconHistory,
  IconMessage,
} from "@/components/Icons";
import { Square } from "@/components/Square";

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    history: [Array(BOARD_SIZE * BOARD_SIZE).fill(null)],
    stepNumber: 0,
    xIsNext: true,
    winner: null,
    winningLine: null,
    lastMoveIndex: null,
  });

  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [moveLogs, setMoveLogs] = useState<MoveLog[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");

  // Timers
  const [timers, setTimers] = useState({ X: 600, O: 600 }); // 10 mins each
  const timerRef = useRef<number | null>(null);

  const currentSquares = gameState.history[gameState.stepNumber];
  const currentPlayer = gameState.xIsNext ? "X" : "O";

  // --- Effects ---

  // Timer Logic
  useEffect(() => {
    if (gameState.winner) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimers((prev) => {
        const active = gameState.xIsNext ? "X" : "O";
        if (prev[active] <= 0) {
          // Timeout logic could go here (auto lose)
          return prev;
        }
        return { ...prev, [active]: prev[active] - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.xIsNext, gameState.winner]);

  // Scroll to center of board on load
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (boardRef.current) {
      const centerOffset =
        (BOARD_SIZE * 32) / 2 - boardRef.current.clientWidth / 2;
      boardRef.current.scrollTo({
        top: centerOffset,
        left: centerOffset,
        behavior: "auto",
      });
    }
  }, []);

  // --- Handlers ---

  const handleSquareClick = useCallback(
    (index: number) => {
      if (gameState.winner || currentSquares[index]) return;

      const newSquares = [...currentSquares];
      const playerMoving = gameState.xIsNext ? "X" : "O";
      newSquares[index] = playerMoving;

      const { winner, line } = calculateWinner(newSquares, index);

      // Update scores
      if (winner && winner !== "Draw") {
        setScores((prev) => ({ ...prev, [winner]: prev[winner] + 1 }));
        addSystemMessage(`Game Over! Player ${winner} wins.`);
      }

      const newHistory = gameState.history.slice(0, gameState.stepNumber + 1);

      // Log Move
      const row = Math.floor(index / BOARD_SIZE) + 1;
      const col = (index % BOARD_SIZE) + 1;
      const newLog: MoveLog = {
        step: gameState.stepNumber + 1,
        player: playerMoving,
        row,
        col,
        timestamp: new Date().toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMoveLogs((prev) => [...prev, newLog]);

      setGameState({
        history: [...newHistory, newSquares],
        stepNumber: newHistory.length,
        xIsNext: !gameState.xIsNext,
        winner: winner,
        winningLine: line,
        lastMoveIndex: index,
      });
    },
    [gameState, currentSquares]
  );

  const resetGame = () => {
    setGameState({
      history: [Array(BOARD_SIZE * BOARD_SIZE).fill(null)],
      stepNumber: 0,
      xIsNext: true,
      winner: null,
      winningLine: null,
      lastMoveIndex: null,
    });
    setTimers({ X: 600, O: 600 });
    setMoveLogs([]);
    addSystemMessage("Game restarted.");
  };

  const undoMove = () => {
    if (gameState.stepNumber === 0 || gameState.winner) return;

    // Undo usually goes back 2 moves in single player, but 1 in PvP. Assuming local PvP.
    const prevStep = gameState.stepNumber - 1;
    let prevMoveIndex: number | null = null;

    if (prevStep > 0) {
      const current = gameState.history[prevStep];
      const prev = gameState.history[prevStep - 1];
      for (let i = 0; i < current.length; i++) {
        if (current[i] !== prev[i]) {
          prevMoveIndex = i;
          break;
        }
      }
    }

    setGameState((prev) => ({
      ...prev,
      stepNumber: prevStep,
      xIsNext: !prev.xIsNext,
      winner: null,
      winningLine: null,
      lastMoveIndex: prevMoveIndex,
    }));

    setMoveLogs((prev) => prev.slice(0, -1));
  };

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "System",
        text,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = (text: string) => {
    // Determine sender based on whose turn it is? Or just current user concept?
    // Since this is local multiplayer, let's assume the "current active player" sends the chat
    const sender = gameState.xIsNext ? "X" : "O";
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // --- Render Helpers ---

  // Convert column index to Letter (0 -> A, 29 -> AD)
  const getColLabel = (index: number) => {
    let label = "";
    index++;
    while (index > 0) {
      const remainder = (index - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      index = Math.floor((index - 1) / 26);
    }
    return label;
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* --- Navbar --- */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg rotate-45 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <div className="w-3 h-3 bg-white rounded-full -rotate-45" />
          </div>
          <div>
            <span className="text-2xl font-display font-bold text-white tracking-widest ml-2">
              NEON<span className="text-indigo-500">NEXUS</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-green-600/10 text-green-400 hover:bg-green-600/20 border border-green-600/30 rounded text-xs font-bold uppercase tracking-wider transition-all">
            Online: 2
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <span className="text-xs text-slate-400">GS</span>
          </div>
        </div>
      </header>

      {/* --- Main Grid Layout --- */}
      <main className="flex-grow grid grid-cols-1 xl:grid-cols-[300px_1fr_350px] overflow-hidden">
        {/* --- Left Panel: Player Stats --- */}
        <aside className="bg-slate-900/30 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Players
          </div>

          <PlayerCard
            player="X"
            name="CyberNinja"
            elo={1450}
            isActive={gameState.xIsNext && !gameState.winner}
            score={scores.X}
            winner={gameState.winner}
            timeRemaining={timers.X}
          />

          <div className="flex items-center gap-4 my-2 opacity-50">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            <span className="text-slate-500 text-xs font-mono">VS</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          </div>

          <PlayerCard
            player="O"
            name="NeonStriker"
            elo={1380}
            isActive={!gameState.xIsNext && !gameState.winner}
            score={scores.O}
            winner={gameState.winner}
            timeRemaining={timers.O}
          />

          <div className="mt-auto pt-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500 mb-2 font-semibold">
                ROOM CODE
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-sm font-mono tracking-widest text-slate-300">
                  #8291A
                </span>
                <button className="text-xs text-indigo-400 hover:text-indigo-300">
                  COPY
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* --- Center Panel: The Board --- */}
        <section className="relative bg-[#0b1121] flex flex-col overflow-hidden">
          {/* Scrollable Board Wrapper */}
          <div
            ref={boardRef}
            className="flex-grow overflow-auto custom-scrollbar flex items-center justify-center p-10 relative"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, #1e293b 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            <div className="relative bg-slate-900/80 p-6 rounded-lg shadow-2xl border border-slate-800 backdrop-blur-sm">
              {/* Column Labels (Top) */}
              <div className="flex mb-2 pl-8">
                {" "}
                {/* pl-8 matches row label width */}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 sm:w-8 text-center text-[10px] text-slate-600 font-mono select-none"
                  >
                    {getColLabel(i)}
                  </div>
                ))}
              </div>

              <div className="flex">
                {/* Row Labels (Left) */}
                <div className="flex flex-col mr-2">
                  {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                    <div
                      key={i}
                      className="h-7 sm:h-8 flex items-center justify-end pr-2 text-[10px] text-slate-600 font-mono select-none w-6"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div
                  className="grid bg-slate-800/50 border border-slate-700"
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, min-content)`,
                  }}
                >
                  {currentSquares.map((val, idx) => (
                    <Square
                      key={idx}
                      value={val}
                      onClick={() => handleSquareClick(idx)}
                      isWinningSquare={
                        gameState.winningLine?.includes(idx) ?? false
                      }
                      isLastMove={gameState.lastMoveIndex === idx}
                      disabled={!!gameState.winner}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Right Panel: Chat & History --- */}
        <aside className="bg-slate-900/30 border-l border-slate-800 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative
                        ${
                          activeTab === "chat"
                            ? "text-white"
                            : "text-slate-500 hover:text-slate-300"
                        }
                    `}
            >
              <IconMessage className="w-4 h-4" /> Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-grow overflow-hidden relative">
            {activeTab === "chat" ? (
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                currentPlayer={currentPlayer}
              />
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase sticky top-0 z-10 backdrop-blur">
                    <tr>
                      <th className="p-3 font-medium">#</th>
                      <th className="p-3 font-medium">Player</th>
                      <th className="p-3 font-medium">Pos</th>
                      <th className="p-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {moveLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-slate-600 text-xs italic"
                        >
                          No moves yet
                        </td>
                      </tr>
                    ) : (
                      moveLogs.map((log) => (
                        <tr
                          key={log.step}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3 text-slate-500 font-mono">
                            {log.step}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-bold ${
                                log.player === "X"
                                  ? "text-cyan-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {log.player}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 font-mono">
                            {getColLabel(log.col - 1)}
                            {log.row}
                          </td>
                          <td className="p-3 text-right text-slate-500 text-xs font-mono">
                            {log.timestamp}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ready/Exit Buttons */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-3">
              {/* <button
                onClick={resetGame}
                className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
              >
                {gameState.winner ? "NEW GAME" : "RESTART"}
              </button> */}

              <button className="col-span-2 py-2.5 border border-red-900/30 text-red-400 hover:bg-red-950/30 font-semibold rounded-lg text-sm transition-colors">
                Rời phòng
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Modal Overlay */}
      <Modal winner={gameState.winner} onRestart={resetGame} />
    </div>
  );
};

export default App;
