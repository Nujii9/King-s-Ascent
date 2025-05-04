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
let possibleMovesSquares = []; // Track squares that have possible moves highlights
let selectedSquare = null; // For click-to-move functionality
let recentMoves = []; // Array to track recent AI moves

// DOM elements - we'll populate these after DOM is loaded
let statusElement;
let undoButton;
let resetButton;
let pauseButton;
let moveListElement;

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  statusElement = document.getElementById('gameStatus');
  undoButton = document.getElementById('undoBtn');
  resetButton = document.getElementById('resetBtn');
  pauseButton = document.getElementById('pauseBtn');
  moveListElement = document.getElementById('moveList');
  
  // Add event listeners
  document.getElementById("startBtn").addEventListener("click", startGame);
  undoButton.addEventListener("click", undoMove);
  resetButton.addEventListener("click", resetGame);
  pauseButton.addEventListener("click", togglePause);
  
  // Initialize an empty board without game functionality
  board = Chessboard('board', {
    position: 'start',
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    onClick: onSquareClick,
    orientation: playerColor === 'w' ? 'white' : 'black'
  });
});

/**
 * Starts a new chess game with the selected settings
 */
function startGame() {
  // Stop any existing game and timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Initialize new game
  game = new Chess();
  aiLevel = parseInt(document.getElementById("aiLevel").value);
  isBlitz = document.getElementById("mode").value === "blitz";
  playerColor = document.getElementById("playerColor").value;
  
  // Set exact time values based on game mode
  playerTime = isBlitz ? 300 : 900; // 5 or 15 minutes
  aiTime = isBlitz ? 300 : 900;
  
  // Set game state
  gameActive = true;
  isPlayerTurn = playerColor === 'w'; // If player is white, they start first
  isPaused = false;
  selectedSquare = null;
  recentMoves = []; // Reset recent moves
  
  // Update button state
  pauseButton.textContent = "Pause";
  pauseButton.disabled = false;
  undoButton.disabled = false;
  
  // Display exact initial times
  document.getElementById('playerTime').innerText = isBlitz ? "5:00" : "15:00";
  document.getElementById('aiTime').innerText = isBlitz ? "5:00" : "15:00";
  
  // Clear move list
  moveListElement.innerHTML = "";
  
  // Set up the board
  if (board) {
    board = null; // Destroy previous board instance if it exists
  }
  
  board = Chessboard('board', {
    position: 'start',
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    onClick: onSquareClick,
    orientation: playerColor === 'w' ? 'white' : 'black'
  });

  // Start the timer only after everything is set up
  lastTimerUpdate = Date.now();
  timerInterval = setInterval(updateTimers, 1000);
  
  // Update status
  if (isPlayerTurn) {
    statusElement.textContent = "Game started! Your move.";
  } else {
    statusElement.textContent = "Game started! AI is thinking...";
    // If player chose black, AI makes first move
    setTimeout(() => makeAIMove(), 500);
  }
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
  }
  if (aiTime <= 0 && gameActive) {
    gameActive = false;
    clearInterval(timerInterval);
    statusElement.textContent = "Time's up! You win!";
  }
}

/**
 * Formats seconds into MM:SS format
 */
function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

/**
 * Handles mouse over square event for highlighting possible moves
 */
function onMouseoverSquare(square, piece) {
  // Only show possible moves for novice level
  if (!gameActive || !isPlayerTurn || isPaused || aiLevel !== 1) return;
  
  // Don't show moves for opponent's pieces
  if (piece && (playerColor === 'w' ? piece.search(/^b/) !== -1 : piece.search(/^w/) !== -1)) return;
  
  // Get list of possible moves for this square
  const moves = game.moves({
    square: square,
    verbose: true
  });
  
  // Return if there are no moves available for this square
  if (moves.length === 0) return;
  
  // Highlight the square being moused over
  greySquare(square);
  
  // Highlight possible moves
  for (let i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
    possibleMovesSquares.push(moves[i].to);
  }
  possibleMovesSquares.push(square);
}

/**
 * Handles mouse out square event to remove highlights
 */
function onMouseoutSquare() {
  // Remove all highlights
  removeGreySquares();
}

/**
 * Highlights a square for possible moves
 */
function greySquare(square) {
  const $square = $('#board .square-' + square);
  
  // Add highlight class
  $square.addClass('highlight-square');
}

/**
 * Removes all square highlights
 */
function removeGreySquares() {
  for (let square of possibleMovesSquares) {
    $('#board .square-' + square).removeClass('highlight-square');
    $('#board .square-' + square).removeClass('selected-square');
  }
  possibleMovesSquares = [];
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
  if (playerColor === 'w' ? piece.search(/^b/) !== -1 : piece.search(/^w/) !== -1) {
    return false;
  }
  
  // Clear any existing selections when starting a drag
  if (selectedSquare !== null) {
    removeGreySquares();
    selectedSquare = null;
  }
}

/**
 * Handles the piece drop event
 */
function onDrop(source, target) {
  // Remove any highlights
  removeGreySquares();
  
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
  
  // Update move list
  addMoveToList(move, game.history().length);
  
  // Switch turns - end player's timer and start AI's timer
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

  // Randomize AI thinking time based on difficulty level
  const minThinkTime = aiLevel === 1 ? 1000 : (aiLevel === 2 ? 2000 : 3000);
  const maxThinkTime = aiLevel === 1 ? 3000 : (aiLevel === 2 ? 5000 : 7000);
  const thinkingTime = Math.floor(Math.random() * (maxThinkTime - minThinkTime + 1)) + minThinkTime;

  // Disable board interaction during AI's turn
  board.draggable = false;

  setTimeout(() => {
    if (!gameActive || isPaused) return; // Check again in case the game was paused during AI think time

    let move;
    // Select AI strategy based on difficulty level
    if (aiLevel === 1) {
      move = randomMove(game);
    } else if (aiLevel === 2) {
      move = bestMoveMaterial(game);
    } else {
      move = minimaxRoot(3, game, playerColor === 'w');
    }

    // Ensure the move is not a recent move
    if (recentMoves.includes(move.san)) {
      // If the move is repetitive, find an alternative
      move = findAlternativeMove(game, recentMoves);
    }

    // Make the selected move
    if (move) {
      const aiMove = game.move(move);
      recentMoves.push(aiMove.san); // Track the move
      if (recentMoves.length > 3) recentMoves.shift(); // Limit history size

      // Update board
      board.position(game.fen());

      // Update move list
      addMoveToList(aiMove, game.history().length);

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
 * Find an alternative move that is not in the recent moves
 */
function findAlternativeMove(game, recentMoves) {
  const moves = game.moves();
  for (let move of moves) {
    if (!recentMoves.includes(move.san)) {
      return move; // Return the first non-recent move found
    }
  }
  return null; // If all moves are recent, return null
}

/**
 * Add move to the move list
 */
function addMoveToList(move, moveNumber) {
  const notation = move.san;
  const isWhite = moveNumber % 2 !== 0;
  const moveRow = isWhite ? 
    document.createElement('div') : 
    moveListElement.lastElementChild;
  
  if (isWhite) {
    moveRow.className = 'move-row';
    moveRow.innerHTML = `<span class="move-number">${Math.ceil(moveNumber/2)}.</span><span class="white-move">${notation}</span>`;
    moveListElement.appendChild(moveRow);
  } else {
    const blackMove = document.createElement('span');
    blackMove.className = 'black-move';
    blackMove.textContent = notation;
    moveRow.appendChild(blackMove);
  }
  
  // Scroll to bottom of move list
  moveListElement.scrollTop = moveListElement.scrollHeight;
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
      
      // AI plays as opposite color to player
      if (playerColor === 'w') {
        // AI plays as black
        total += piece.color === 'w' ? -val : val;
      } else {
        // AI plays as white
        total += piece.color === 'w' ? val : -val;
      }
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
  
  // Remove the last move entry from the move list
  if (moveListElement.lastElementChild) {
    const lastRow = moveListElement.lastElementChild;
    if (lastRow.querySelector('.black-move')) {
      // Remove the black move span
      lastRow.removeChild(lastRow.querySelector('.black-move'));
    } else {
      // Remove the entire row if it only contains a white move
      moveListElement.removeChild(lastRow);
    }
  }
  
  // Reset to player's turn
  isPlayerTurn = true;
  lastTimerUpdate = Date.now(); // Reset timer after undo
  selectedSquare = null; // Reset selected square for click-to-move
  
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
  } else {
    pauseButton.textContent = "Pause";
    updateStatus(); // Update status text
    lastTimerUpdate = Date.now(); // Reset timer reference point when resuming
  }
}

/**
 * Highlights the selected square
 */
function highlightSelectedSquare(square) {
  // Apply special highlighting to the selected square
  $('#board .square-' + square).addClass('selected-square');
  possibleMovesSquares.push(square);
}

/**
 * Handles click-to-move functionality
 */
function onSquareClick(square) {
  // Do nothing if the game is over, paused, or it's not the player's turn
  if (game.game_over() || !gameActive || !isPlayerTurn || isPaused) {
    return;
  }
  
  // Check if a piece on this square belongs to the player
  const piece = game.get(square);
  const isPieceOwned = piece && 
    (playerColor === 'w' ? piece.color === 'w' : piece.color === 'b');
  
  // If no square is selected and the clicked square has the player's piece
  if (selectedSquare === null && isPieceOwned) {
    // Select this square
    selectedSquare = square;
    // Highlight the selected square and possible moves
    highlightSelectedSquare(square);
    
    // Also highlight possible moves
    const moves = game.moves({
      square: square,
      verbose: true
    });
    
    for (let i = 0; i < moves.length; i++) {
      greySquare(moves[i].to);
      possibleMovesSquares.push(moves[i].to);
    }
    return;
  }
  
  // If there's already a selected square
  if (selectedSquare !== null) {
    // If it's the same square, deselect it
    if (selectedSquare === square) {
      removeGreySquares();
      selectedSquare = null;
      return;
    }
    
    // Try to make a move
    const move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q' // Always promote to queen for simplicity
    });
    
    // If it's a valid move
    if (move) {
      // Remove highlights
      removeGreySquares();
      
      // Update board
      board.position(game.fen());
      
      // Update move list
      addMoveToList(move, game.history().length);
      
      // Reset selected square
      selectedSquare = null;
      
      // Switch turns - end player's timer and start AI's timer  
      isPlayerTurn = false;
      lastTimerUpdate = Date.now(); // Reset timer at turn switch
      
      // Update status
      updateStatus();
      
      // AI makes a move after a short delay
      makeAIMove();
      
      return;
    }
    
    // If it's not a valid move but the clicked square has the player's piece
    if (isPieceOwned) {
      // Remove previous highlights
      removeGreySquares();
      
      // Switch selection to this piece
      selectedSquare = square;
      highlightSelectedSquare(square);
      
      // Highlight possible moves
      const moves = game.moves({
        square: square,
        verbose: true
      });
      
      for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
        possibleMovesSquares.push(moves[i].to);
      }
      return;
    }
    
    // If it's neither a valid move nor the player's piece, deselect
    removeGreySquares();
    selectedSquare = null;
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
  selectedSquare = null;
  removeGreySquares();
  
  // Reset timers to default values with fixed display
  const timeDisplay = isBlitz ? "5:00" : "15:00";
  document.getElementById('playerTime').innerText = timeDisplay;
  document.getElementById('aiTime').innerText = timeDisplay;
  
  // Reset the board to initial position
  if (board) {
    board.position('start');
    board.draggable = false;
  }
  
  // Clear move list
  moveListElement.innerHTML = "";
  
  // Reset buttons
  pauseButton.textContent = "Pause";
  pauseButton.disabled = true;
  undoButton.disabled = true;
  
  // Reset status
  statusElement.classList.remove('thinking');
  statusElement.textContent = "Ready to play";
}
