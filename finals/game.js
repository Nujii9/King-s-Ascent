// Global variables
let board, game;
let aiLevel = 1;
let timerInterval;
let playerTime = 300, aiTime = 300; // Default 5 minutes
let isBlitz = false;
let playerColor = 'w';
let isPlayerTurn = true;
let gameActive = false;
let isPaused = false;
let lastTimerUpdate = 0; // Timestamp of last timer update

// DOM elements - we'll populate these after DOM is loaded
let statusElement;
let undoButton;
let resetButton;
let pauseButton;

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  statusElement = document.getElementById('gameStatus');
  undoButton = document.getElementById('undoBtn');
  resetButton = document.getElementById('resetBtn');
  pauseButton = document.getElementById('pauseBtn');
  
  // Add event listeners
  document.getElementById("startBtn").addEventListener("click", startGame);
  undoButton.addEventListener("click", undoMove);
  resetButton.addEventListener("click", resetGame);
  pauseButton.addEventListener("click", togglePause);
  
  // Initialize an empty board without game functionality
  board = Chessboard('board', {
    position: 'start',
    draggable: false
  });
});

/**
 * Starts a new chess game with the selected settings
 */
function startGame() {
  // Initialize new game
  game = new Chess();
  aiLevel = parseInt(document.getElementById("aiLevel").value);
  isBlitz = document.getElementById("mode").value === "blitz";
  playerTime = aiTime = isBlitz ? 300 : 900; // 5 or 15 minutes
  gameActive = true;
  isPlayerTurn = true;
  isPaused = false;
  
  // Update button state
  pauseButton.textContent = "Pause";
  pauseButton.disabled = false;
  undoButton.disabled = false;
  
  // Update the UI
  updateTimers();
  updateStatus();
  
  // Clear existing timer if any
  if (timerInterval) clearInterval(timerInterval);
  
  // Set up the board
  if (board) {
    board = null; // Destroy previous board instance if it exists
  }
  
  board = Chessboard('board', {
    position: 'start',
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    orientation: 'white'
  });

  // Start the timer
  lastTimerUpdate = Date.now();
  timerInterval = setInterval(updateTimers, 1000);
  
  // Update status
  statusElement.textContent = "Game started! Your move.";
}

/**
 * Updates the chess timer for both players
 */
function updateTimers() {
  if (!gameActive || isPaused) return;
  
  // Calculate elapsed time since last update
  const now = Date.now();
  const elapsed = (now - lastTimerUpdate) / 1000;
  lastTimerUpdate = now;
  
  // Decrement time for the current player's turn
  if (isPlayerTurn) {
    playerTime = Math.max(0, playerTime - elapsed);
  } else {
    aiTime = Math.max(0, aiTime - elapsed);
  }
  
  // Update the timer display
  document.getElementById('playerTime').innerText = formatTime(Math.ceil(playerTime));
  document.getElementById('aiTime').innerText = formatTime(Math.ceil(aiTime));
  
  // Check for time-out
  if (playerTime <= 0 && gameActive) {
    gameActive = false;
    clearInterval(timerInterval);
    statusElement.textContent = "Time's up! AI wins!";
    alert("Time's up! AI wins!");
  }
  if (aiTime <= 0 && gameActive) {
    gameActive = false;
    clearInterval(timerInterval);
    statusElement.textContent = "Time's up! You win!";
    alert("Time's up! You win!");
  }
}

/**
 * Formats seconds into MM:SS format
 */
function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

/**
 * Controls when dragging pieces is allowed
 */
function onDragStart(source, piece) {
  // Do not allow drag if game is over, paused, or it's not player's turn
  if (game.game_over() || !gameActive || !isPlayerTurn || isPaused) {
    return false;
  }
  
  // Only allow dragging player's pieces
  if (piece.search(/^b/) !== -1) {
    return false;
  }
}

/**
 * Handles the piece drop event
 */
function onDrop(source, target) {
  // Try to make the move
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' // Always promote to queen for simplicity
  });
  
  // If invalid move, return piece to original position
  if (move === null) return 'snapback';
  
  // Update board position
  board.position(game.fen());
  
  // Switch turns
  isPlayerTurn = false;
  lastTimerUpdate = Date.now(); // Reset timer at turn switch
  
  // Update game status
  updateStatus();
  
  // AI makes a move after a short delay
  makeAIMove();
}

/**
 * Updates the game status message
 */
function updateStatus() {
  let status = '';

  if (game.in_checkmate()) {
    status = (isPlayerTurn) ? 'Game over: AI wins by checkmate!' : 'Game over: You win by checkmate!';
    endGame();
  } else if (game.in_draw()) {
    status = 'Game over: Draw';
    endGame();
  } else if (game.in_check()) {
    status = (isPlayerTurn) ? 'You are in check!' : 'AI is in check!';
  } else {
    status = (isPlayerTurn) ? 'Your move' : 'AI is thinking...';
  }

  statusElement.textContent = status;
}

/**
 * Ends the current game
 */
function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  pauseButton.disabled = true;
}

/**
 * Makes the AI move based on the selected difficulty level
 */
function makeAIMove() {
  if (!gameActive || game.game_over() || isPaused) return;
  
  // Set AI is thinking status
  statusElement.textContent = "AI is thinking...";
  statusElement.classList.add('thinking');
  
  // Scale AI thinking time based on difficulty level
  // Novice: 500ms, Intermediate: 1000ms, Master: 2000ms
  const thinkingTime = aiLevel === 1 ? 500 : (aiLevel === 2 ? 1500 : 3000);
  
  // Disable board interaction during AI's turn
  board.draggable = false;
  
  // The AI timer should be running during this time
  // No need to manually update it since the updateTimers function handles it
  
  setTimeout(() => {
    if (!gameActive || isPaused) return; // Check again in case the game was paused during AI think time
    
    let move;
    // Select AI strategy based on difficulty level
    if (aiLevel === 1) {
      move = randomMove(game);
    } else if (aiLevel === 2) {
      move = bestMoveMaterial(game);
    } else {
      // Use deeper search for master level
      move = minimaxRoot(3, game, true);
    }
    
    // Make the selected move
    if (move) {
      game.move(move);
      
      // Update board
      board.position(game.fen());
      
      // Switch back to player's turn
      isPlayerTurn = true;
      lastTimerUpdate = Date.now(); // Reset timer at turn switch
      
      // Re-enable board interaction
      board.draggable = true;
      
      // Update status
      statusElement.classList.remove('thinking');
      updateStatus();
    }
  }, thinkingTime);
}

/**
 * Returns a random legal move (Novice level)
 */
function randomMove(game) {
  const moves = game.moves();
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Returns the move that maximizes material advantage (Intermediate level)
 */
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
  
  return bestMove || moves[0]; // Fallback to first move if evaluation fails
}

/**
 * Evaluates the board position based on material
 */
function evaluateBoard(board) {
  let total = 0;
  const pieceValues = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
  
  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      
      // Get the base piece value
      let val = pieceValues[piece.type] || 0;
      
      // AI plays as black, so reverse the values
      total += piece.color === 'w' ? -val : val;
    }
  }
  
  return total;
}

/**
 * Minimax algorithm with alpha-beta pruning (Master level)
 */
function minimaxRoot(depth, game, isMaximizing) {
  const moves = game.moves();
  let bestMove = null;
  let bestValue = isMaximizing ? -Infinity : Infinity;
  
  // Handle case with no legal moves
  if (moves.length === 0) return null;

  for (let move of moves) {
    game.move(move);
    let value = minimax(depth - 1, game, -10000, 10000, !isMaximizing);
    game.undo();
    
    if (isMaximizing) {
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    } else {
      if (value < bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
  }
  
  return bestMove;
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(depth, game, alpha, beta, isMaximizing) {
  // Base case: return evaluation at leaf nodes
  if (depth === 0) return evaluateBoard(game.board());
  
  // Check for game over conditions
  if (game.game_over()) {
    if (game.in_checkmate()) {
      // Big penalty/reward for checkmate
      return isMaximizing ? -9000 : 9000;
    }
    // Draw is neutral
    return 0;
  }
  
  const moves = game.moves();
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let move of moves) {
      game.move(move);
      const eval = minimax(depth - 1, game, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break; // Alpha-beta pruning
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
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minEval;
  }
}

/**
 * Allows the player to undo their last move
 */
function undoMove() {
  if (!gameActive || game.history().length < 2) return;
  
  // Undo both AI's move and player's move
  game.undo(); // Undo AI move
  game.undo(); // Undo player move
  
  // Update board
  board.position(game.fen());
  
  // Reset to player's turn
  isPlayerTurn = true;
  lastTimerUpdate = Date.now(); // Reset timer after undo
  
  // Update status
  updateStatus();
}

/**
 * Pauses or resumes the game
 */
function togglePause() {
  if (!gameActive) return;
  
  isPaused = !isPaused;
  
  if (isPaused) {
    pauseButton.textContent = "Resume";
    statusElement.textContent = "Game paused";
    // Store current time when pausing
  } else {
    pauseButton.textContent = "Pause";
    updateStatus(); // Update status text
    // Reset timer reference point when resuming
    lastTimerUpdate = Date.now();
  }
}

/**
 * Resets the game to initial state
 */
function resetGame() {
  // Clear the timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Reset game state
  gameActive = false;
  isPaused = false;
  
  // Reset timers to default values
  playerTime = aiTime = isBlitz ? 300 : 900;
  document.getElementById('playerTime').innerText = formatTime(Math.ceil(playerTime));
  document.getElementById('aiTime').innerText = formatTime(Math.ceil(aiTime));
  
  // Reset the board to initial position
  if (board) {
    board.position('start');
    board.draggable = false;
  }
  
  // Reset buttons
  pauseButton.textContent = "Pause";
  pauseButton.disabled = true;
  undoButton.disabled = true;
  
  // Reset status
  statusElement.classList.remove('thinking');
  statusElement.textContent = "Ready to play";
}
