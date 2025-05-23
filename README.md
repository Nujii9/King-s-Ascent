<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>King's Ascent</title>
  <style>
    body { 
      font-family: sans-serif; 
      display: flex; 
      flex-direction: column; 
      align-items: center;
      background-color: #f5f5f5;
    }
    #board { 
      width: 400px; 
      margin: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    #controls { 
      margin: 15px;
      padding: 15px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      width: 400px;
    }
    select, button { 
      margin: 5px;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
      background-color: #f9f9f9;
    }
    button {
      cursor: pointer;
      background-color: #4d7a97;
      color: white;
      border: none;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #3a5d74;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .button-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .timer { 
      font-size: 1.2em; 
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    .timer-display {
      padding: 5px 10px;
      border-radius: 4px;
      background-color: #eee;
    }
    .status {
      margin-top: 10px;
      font-weight: bold;
      color: #333;
      text-align: center;
      padding: 5px;
      border-radius: 4px;
      background-color: #f0f0f0;
    }
    h1 {
      color: #2c3e50;
    }
    .thinking {
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { background-color: #f0f0f0; }
      50% { background-color: #e0e0e0; }
      100% { background-color: #f0f0f0; }
    }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js"></script>
</head>
<body>
  <h1>King's Ascent</h1>
  <div id="controls">
    <div>
      <label for="aiLevel">AI Difficulty:</label>
      <select id="aiLevel">
        <option value="1">Novice</option>
        <option value="2">Intermediate</option>
        <option value="3">Master</option>
      </select>
    </div>
    <div>
      <label for="mode">Game Mode:</label>
      <select id="mode">
        <option value="classic">Classic (15 min)</option>
        <option value="blitz">Blitz (5 min)</option>
      </select>
    </div>
    <div class="button-row">
      <button id="startBtn">Start New Game</button>
      <button id="pauseBtn" disabled>Pause</button>
    </div>
    <div class="button-row">
      <button id="undoBtn" disabled>Undo Move</button>
      <button id="resetBtn">Reset</button>
    </div>
    <div class="timer">
      <div>Player: <span id="playerTime" class="timer-display">5:00</span></div>
      <div>AI: <span id="aiTime" class="timer-display">5:00</span></div>
    </div>
    <div id="gameStatus" class="status">Ready to play</div>
  </div>
  <div id="board"></div>

  <script src="game.js"></script>
</body>
</html>
