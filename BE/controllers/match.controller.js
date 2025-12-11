import mongoose from "mongoose";
import Match from "../models/Match.js";
import Room from "../models/Room.js";
import Move from "../models/Move.js";
import User from "../models/User.js";

function buildSymbolSet(moves, symbol) {
  const set = new Set();
  moves.forEach((m) => {
    if (m.symbol === symbol) {
      set.add(`${m.x},${m.y}`);
    }
  });
  return set;
}

function countDirection(symbolSet, startX, startY, dx, dy) {
  let count = 0;
  let x = startX + dx;
  let y = startY + dy;

  while (symbolSet.has(`${x},${y}`)) {
    count += 1;
    x += dx;
    y += dy;
  }

  return count;
}

function getWinningLine(moves, lastMove, winLength = 5) {
  const { x, y, symbol } = lastMove;
  const symbolSet = buildSymbolSet(moves, symbol);

  const directions = [
    { dx: 1, dy: 0 }, // ngang
    { dx: 0, dy: 1 }, // dọc
    { dx: 1, dy: 1 }, // chéo xuống
    { dx: 1, dy: -1 }, // chéo lên
  ];

  for (const { dx, dy } of directions) {
    let posX = x + dx;
    let posY = y + dy;
    const positiveCells = [];
    while (symbolSet.has(`${posX},${posY}`)) {
      positiveCells.push({ x: posX, y: posY });
      posX += dx;
      posY += dy;
    }

    let negX = x - dx;
    let negY = y - dy;
    const negativeCells = [];
    while (symbolSet.has(`${negX},${negY}`)) {
      negativeCells.unshift({ x: negX, y: negY });
      negX -= dx;
      negY -= dy;
    }

    let cells = [...negativeCells, { x, y }, ...positiveCells];

    if (cells.length >= winLength) {
      // Chỉ trả về đúng 5 ô liên tiếp (từ trái qua phải trong dãy)
      return cells.slice(0, winLength);
    }
  }

  return null;
}

// Trả về true nếu từ nước lastMove có 5 quân liên tiếp
function checkWinFromLastMove(moves, lastMove, winLength = 5) {
  const { x, y, symbol } = lastMove;
  const symbolSet = buildSymbolSet(moves, symbol);

  const directions = [
    [1, 0], // ngang
    [0, 1], // dọc
    [1, 1], // chéo xuống
    [1, -1], // chéo lên
  ];

  for (const [dx, dy] of directions) {
    const countPos = countDirection(symbolSet, x, y, dx, dy);
    const countNeg = countDirection(symbolSet, x, y, -dx, -dy);
    const total = 1 + countPos + countNeg;

    if (total >= winLength) {
      return true;
    }
  }
  return false;
}

function calcEloChange(ratingA, ratingB, scoreA, k = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const deltaA = Math.round(k * (scoreA - expectedA));
  return deltaA;
}

// matchDoc: document Match đã có result.status, players.X/O
async function updateStatsAndElo(matchDoc) {
  const { players, result } = matchDoc;
  const userIdX = players.X;
  const userIdO = players.O;

  const [userX, userO] = await Promise.all([
    User.findById(userIdX),
    User.findById(userIdO),
  ]);

  if (!userX || !userO) return;

  const status = result.status;
  let scoreX = 0.5;
  let scoreO = 0.5;

  // xác định điểm theo kết quả trận
  switch (status) {
    case "X_win":
    case "timeout_O":
      scoreX = 1;
      scoreO = 0;
      break;
    case "O_win":
    case "timeout_X":
      scoreX = 0;
      scoreO = 1;
      break;
    case "draw":
      scoreX = 0.5;
      scoreO = 0.5;
      break;
    default:
      // nếu vẫn đang playing thì không làm gì
      return;
  }

  const eloX = userX.stats?.elo ?? 1000;
  const eloO = userO.stats?.elo ?? 1000;

  const deltaX = calcEloChange(eloX, eloO, scoreX);
  const deltaO = calcEloChange(eloO, eloX, scoreO);

  // cập nhật win/loss/draw
  if (scoreX === 1) {
    userX.stats.wins += 1;
    userO.stats.losses += 1;
  } else if (scoreO === 1) {
    userO.stats.wins += 1;
    userX.stats.losses += 1;
  } else {
    userX.stats.draws += 1;
    userO.stats.draws += 1;
  }

  userX.stats.totalMatches += 1;
  userO.stats.totalMatches += 1;

  userX.stats.elo = eloX + deltaX;
  userO.stats.elo = eloO + deltaO;

  await Promise.all([userX.save(), userO.save()]);

  // lưu delta vào Match
  matchDoc.pointsChange = {
    X: deltaX,
    O: deltaO,
  };
  await matchDoc.save();
}

/**
 * POST /matches/move
 * body: { matchId, userId, x, y, timeTakenMs? }
 */
export const makeMove = async (req, res) => {
  try {
    const { matchId, userId, x, y, timeTakenMs } = req.body;

    if (
      !matchId ||
      !mongoose.Types.ObjectId.isValid(matchId) ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid matchId or userId" });
    }

    if (typeof x !== "number" || typeof y !== "number") {
      return res.status(400).json({ message: "x and y must be numbers" });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    if (match.result.status !== "playing") {
      return res.status(400).json({ message: "Match is not in playing state" });
    }

    const boardSize = match.config.boardSize || 30;

    if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) {
      return res.status(400).json({ message: "Move out of board range" });
    }

    // xác định symbol của user
    let symbol = null;
    if (match.players.X.toString() === userId) {
      symbol = "X";
    } else if (match.players.O.toString() === userId) {
      symbol = "O";
    } else {
      return res.status(403).json({ message: "User not in this match" });
    }

    // ====== CHECK HẾT GIỜ (TIMEOUT) TRƯỚC KHI TẠO MOVE ======
    if (typeof timeTakenMs === "number") {
      const timeLimitMs = (match.config.timePerTurnSec || 30) * 1000;
      if (timeTakenMs > timeLimitMs) {
        // Người chơi này thua do hết giờ
        const loserSymbol = symbol;
        const winnerSymbol = loserSymbol === "X" ? "O" : "X";
        const winnerUserId =
          winnerSymbol === "X" ? match.players.X : match.players.O;

        match.result.status = loserSymbol === "X" ? "timeout_X" : "timeout_O";
        match.result.winnerSymbol = winnerSymbol;
        match.result.winnerUserId = winnerUserId;
        match.result.winningLine = []; // timeout nên không có line
        match.endedAt = new Date();

        await match.save();

        const room = await Room.findById(match.roomId);
        if (room) {
          room.players.forEach((p) => {
            p.isReady = false;
          });
          room.currentMatchId = null;
          room.status = room.players.length > 0 ? "waiting" : "finished";
          await room.save();
        }

        await updateStatsAndElo(match);

        return res.status(200).json({
          message: "Player timeout, match ended",
          data: {
            matchStatus: match.result.status,
            winnerSymbol: match.result.winnerSymbol,
            winnerUserId: match.result.winnerUserId,
            winningLine: match.result.winningLine,
            pointsChange: match.pointsChange,
          },
        });
      }
    }

    // không cho đánh lên ô đã có
    const existedMove = await Move.findOne({ matchId, x, y });
    if (existedMove) {
      return res.status(400).json({ message: "Cell already taken" });
    }

    // kiểm tra lượt
    const moveCount = await Move.countDocuments({ matchId });
    const expectedSymbol = moveCount % 2 === 0 ? "X" : "O";

    if (symbol !== expectedSymbol) {
      return res.status(400).json({ message: "Not your turn" });
    }

    const moveIndex = moveCount;

    const move = await Move.create({
      matchId,
      moveIndex,
      userId,
      symbol,
      x,
      y,
      timeTakenMs: typeof timeTakenMs === "number" ? timeTakenMs : null,
    });

    const allMoves = await Move.find({ matchId }).sort({ moveIndex: 1 });

    // Có thể dùng luôn winningLine để check
    const winningLine = getWinningLine(allMoves, move, 5);
    const isWin = !!winningLine;

    const totalMoves = allMoves.length;
    const maxCells = boardSize * boardSize;
    const isDraw = !isWin && totalMoves >= maxCells;

    if (isWin || isDraw) {
      match.result.status = isWin
        ? symbol === "X"
          ? "X_win"
          : "O_win"
        : "draw";

      match.result.winnerSymbol = isWin ? symbol : null;
      match.result.winnerUserId = isWin ? userId : null;
      match.result.winningLine = winningLine || [];
      match.endedAt = new Date();

      await match.save();

      const room = await Room.findById(match.roomId);
      if (room) {
        room.players.forEach((p) => {
          p.isReady = false;
        });

        room.currentMatchId = null;
        room.status = room.players.length > 0 ? "waiting" : "finished";

        await room.save();
      }

      await updateStatsAndElo(match);
    }

    return res.status(201).json({
      message: "Move created",
      data: {
        move,
        matchStatus: match.result.status,
        winnerSymbol: match.result.winnerSymbol,
        winnerUserId: match.result.winnerUserId,
        winningLine: match.result.winningLine,
        pointsChange: match.pointsChange,
      },
    });
  } catch (error) {
    console.error("makeMove error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
