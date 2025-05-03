let board, game, aiLevel = 1, timerInterval;
let playerTime = 300, aiTime = 300; // 5 minutes
let isBlitz = false;

function startGame() {
  game = new Chess();
  aiLevel = parseInt(document.getElementById("aiLevel").value);
  isBlitz = document.getElementById("mode").value === "blitz";
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDrop: onDrop
  });

  playerTime = aiTime = isBlitz ? 300 : 900; // classic: 15 mins
  updateTimers();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimers, 1000);
}

function updateTimers() {
  if (game.game_over()) return clearInterval(timerInterval);
  const turn = game.turn();
  if (turn === 'w') playerTime--; else aiTime--;
  document.getElementById('playerTime').innerText = formatTime(playerTime);
  document.getElementById('aiTime').innerText = formatTime(aiTime);
  if (playerTime <= 0) alert("Time's up! AI wins!");
  if (aiTime <= 0) alert("Time's up! You win!");
}

function formatTime(sec) {
  return `${Math.floor(sec / 60)}:${('0' + sec % 60).slice(-2)}`;
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  board.position(game.fen());
  window.setTimeout(makeAIMove, 250);
}

function makeAIMove() {
  if (game.game_over()) return;
  let move;
  if (aiLevel === 1) move = randomMove(game);
  else if (aiLevel === 2) move = bestMoveMaterial(game);
  else move = minimaxRoot(2, game, true);
  game.move(move);
  board.position(game.fen());
}

function randomMove(game) {
  const moves = game.moves();
  return moves[Math.floor(Math.random() * moves.length)];
}

function bestMoveMaterial(game) {
  const moves = game.moves();
  let bestVal = -9999;
  let bestMove = null;
  for (let move of moves) {
    game.move(move);
    let value = evaluateBoard(game.board());
    game.undo();
    if (value > bestVal) {
      bestVal = value;
      bestMove = move;
    }
  }
  return bestMove;
}

function evaluateBoard(board) {
  let total = 0;
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      let val = values[piece.type] || 0;
      total += piece.color === 'w' ? val : -val;
    }
  }
  return total;
}

function minimaxRoot(depth, game, isMaximizing) {
  const newGameMoves = game.moves();
  let bestMove = null;
  let bestValue = -9999;

  for (let move of newGameMoves) {
    game.move(move);
    let value = minimax(depth - 1, game, -10000, 10000, !isMaximizing);
    game.undo();
    if (value >= bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(depth, game, alpha, beta, isMaximizing) {
  if (depth === 0) return evaluateBoard(game.board());
  const moves = game.moves();
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let move of moves) {
      game.move(move);
      const eval = minimax(depth - 1, game, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      game.move(move);
      const eval = minimax(depth - 1, game, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
