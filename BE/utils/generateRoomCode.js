import Room from "../models/Room.js";

export async function generateUniqueRoomCode() {
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 100000 → 999999

    // Kiểm tra xem mã này đã tồn tại chưa
    const exists = await Room.exists({
      roomCode: code,
      type: "friend",
    });

    if (!exists) {
      return code;
    }
  }
  throw new Error("Không thể tạo mã phòng duy nhất sau nhiều lần thử");
}

export function generateRoomCodeSync() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
