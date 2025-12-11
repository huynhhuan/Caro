import { BOARD_SIZE, WIN_LENGTH, SquareValue, Player } from '@/interface/type';

export function calculateWinner(squares: SquareValue[], lastMoveIndex: number | null): { winner: Player | 'Draw' | null; line: number[] | null } {
  if (lastMoveIndex === null) return { winner: null, line: null };

  const row = Math.floor(lastMoveIndex / BOARD_SIZE);
  const col = lastMoveIndex % BOARD_SIZE;
  const player = squares[lastMoveIndex];

  if (!player) return { winner: null, line: null };

  // Directions: [deltaRow, deltaCol]
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Diagonal /
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    const line = [lastMoveIndex];

    // Check positive direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const index = r * BOARD_SIZE + c;

      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && squares[index] === player) {
        count++;
        line.push(index);
      } else {
        break;
      }
    }

    // Check negative direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      const index = r * BOARD_SIZE + c;

      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && squares[index] === player) {
        count++;
        line.push(index);
      } else {
        break;
      }
    }

    if (count >= WIN_LENGTH) {
      return { winner: player, line };
    }
  }

  // Check for draw
  if (!squares.includes(null)) {
    return { winner: 'Draw', line: null };
  }

  return { winner: null, line: null };
}