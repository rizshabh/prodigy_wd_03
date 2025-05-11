// Constants
const X_CLASS = 'X';
const O_CLASS = 'O';
const WINNING_COMBINATIONS = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // columns
  [0,4,8],[2,4,6]          // diagonals
];

// Elements
const menuScreen = document.getElementById('menu-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const gameScreen = document.getElementById('game-screen');
const board = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('[data-cell]'));
const statusText = document.getElementById('status');

// Game state variables
let circleTurn = false; // false means X turn, true means O turn
let vsBot = false;
let botDifficulty = null;
let gameActive = false;

// Initialize Event Listeners and game state for a new game
function init() {
  cells.forEach(cell => {
    cell.removeEventListener('click', handleClick);
    cell.addEventListener('click', handleClick, { once: true });
    cell.className = 'cell';
    cell.textContent = '';
    cell.setAttribute('aria-label', '');
    cell.setAttribute('tabindex', '0');
    cell.style.pointerEvents = '';
  });
  gameActive = true;
  updateStatus();
}

// Show difficulty selection screen
function showDifficultySelection() {
  menuScreen.style.display = 'none';
  difficultyScreen.style.display = 'block';
}

// Return to main menu
function backToMenu() {
  gameScreen.style.display = 'none';
  difficultyScreen.style.display = 'none';
  menuScreen.style.display = 'block';
  statusText.textContent = '';
  vsBot = false;
  botDifficulty = null;
  gameActive = false;
  cells.forEach(cell => {
    cell.className = 'cell';
    cell.textContent = '';
    cell.style.pointerEvents = '';
  });
}

// Start playing against a friend (PvP)
function startPvP() {
  vsBot = false;
  botDifficulty = null;
  menuScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  circleTurn = false; // X starts first
  init();
}

// Start playing against bot with chosen difficulty
function startBot(difficulty) {
  vsBot = true;
  botDifficulty = difficulty;
  difficultyScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  circleTurn = false; // Player X starts first
  init();
  if (circleTurn) {
    // Bot starts if O starts (rare here as X starts)
    botMove();
  }
}

// Handle player click on cell
function handleClick(e) {
  if (!gameActive) return;
  const cell = e.target;
  if (cell.textContent !== '') return; // ignore if already marked

  const currentClass = circleTurn ? O_CLASS : X_CLASS;
  placeMark(cell, currentClass);

  if (checkWin(currentClass)) {
    endGame(false);
  } else if (isDraw()) {
    endGame(true);
  } else {
    swapTurns();
    updateStatus();
    if (vsBot && circleTurn) {
      // Bot's turn
      setTimeout(botMove, randomDelay());
    }
  }
}

// Place mark in cell
function placeMark(cell, currentClass) {
  cell.textContent = currentClass;
  cell.classList.add(currentClass);
  cell.setAttribute('aria-label', currentClass + " placed");
}

// Swap turns between X and O
function swapTurns() {
  circleTurn = !circleTurn;
}

// Update status display text
function updateStatus() {
  if (!gameActive) {
    return;
  }
  if (vsBot) {
    if (!circleTurn) {
      statusText.textContent = "Your Turn (X)";
    } else {
      statusText.textContent = "Bot's Turn (O)";
    }
  } else {
    statusText.textContent = `Player ${circleTurn ? 'O' : 'X'}'s Turn`;
  }
}

// Check if current player has won
function checkWin(currentClass) {
  return WINNING_COMBINATIONS.some(combination => {
    return combination.every(index => {
      return cells[index].classList.contains(currentClass);
    });
  });
}

// Check for draw
function isDraw() {
  return cells.every(cell => {
    return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
  });
}

// End game with win or draw
function endGame(draw) {
  gameActive = false;
  if (draw) {
    statusText.textContent = "It's a Draw! 🤝";
  } else {
    const winner = circleTurn ? (vsBot ? 'Bot (O)' : 'Player O') : (vsBot ? 'You (X)' : 'Player X');
    statusText.textContent = `${winner} Wins! 🎉`;
  }
  // Disable further input
  cells.forEach(cell => {
    cell.style.pointerEvents = 'none';
  });
}

// Reset game button handler
function resetGame() {
  init();
  if (vsBot && circleTurn) {
    // Bot starts first in some variant? Not here by default
    setTimeout(botMove, randomDelay());
  }
  cells.forEach(cell => {
    cell.style.pointerEvents = '';
  });
}

// Bot AI logic
function botMove() {
  if (!gameActive) return;

  const currentClass = O_CLASS;
  let moveIndex = -1;

  switch (botDifficulty) {
    case 'easy':
      moveIndex = getRandomMove();
      break;
    case 'medium':
      moveIndex = getMediumMove();
      break;
    case 'hard':
      moveIndex = getHardMove();
      break;
    case 'ultra-hard':
      moveIndex = getUltraHardMove();
      break;
    default:
      moveIndex = getRandomMove();
  }

  if (moveIndex >= 0) {
    placeMark(cells[moveIndex], currentClass);
    if (checkWin(currentClass)) {
      endGame(false);
    } else if (isDraw()) {
      endGame(true);
    } else {
      swapTurns();
      updateStatus();
    }
  }
}

// Random delay function for bot move (300-900ms)
function randomDelay() {
  return 300 + Math.random() * 600;
}

// Easy Level: random empty cell
function getRandomMove() {
  const availableIndices = cells.reduce((acc, cell, i) => {
    if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS)) {
      acc.push(i);
    }
    return acc;
  }, []);

  if (availableIndices.length === 0) return -1;
  return availableIndices[Math.floor(Math.random() * availableIndices.length)];
}

// Medium Level: Try to win/block, else random
function getMediumMove() {
  // 1. Win if possible
  let move = findWinningMove(O_CLASS);
  if (move !== -1) return move;

  // 2. Block opponent win
  move = findWinningMove(X_CLASS);
  if (move !== -1) return move;

  // 3. Random move
  return getRandomMove();
}

// Hard Level: Minimax with depth limit
function getHardMove() {
  // depth limit set to 3 for performance balance
  const best = minimax(getBoardArray(), O_CLASS, 3);
  return best.index;
}

// Ultra Hard Level: Perfect Minimax
function getUltraHardMove() {
  const best = minimax(getBoardArray(), O_CLASS);
  return best.index;
}

// Build current board array for minimax ("X", "O", or null)
function getBoardArray() {
  return cells.map(cell => {
    if (cell.classList.contains(X_CLASS)) return X_CLASS;
    if (cell.classList.contains(O_CLASS)) return O_CLASS;
    return null;
  });
}

// Find winning move for a player, else -1
function findWinningMove(player) {
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i].classList.contains(X_CLASS) && !cells[i].classList.contains(O_CLASS)) {
      // Temporarily apply move
      cells[i].classList.add(player);
      let win = checkWin(player);
      cells[i].classList.remove(player);
      if (win) return i;
    }
  }
  return -1;
}

// Minimax algorithm (returns an object with index and score)
// depth limit: optional number to limit recursion depth
function minimax(board, player, depthLimit = Infinity, depth = 0) {
  const opponent = player === O_CLASS ? X_CLASS : O_CLASS;

  // Check terminal states
  if (checkWinBoard(board, O_CLASS)) {
    return { score: 10 - depth };
  }
  if (checkWinBoard(board, X_CLASS)) {
    return { score: depth - 10 };
  }
  if (board.every(cell => cell !== null)) {
    return { score: 0 };
  }
  if (depth >= depthLimit) {
    return { score: 0 };
  }

  const moves = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      const move = {};
      move.index = i;
      board[i] = player;

      const result = minimax(board, opponent, depthLimit, depth + 1);
      move.score = result.score;

      board[i] = null; // Undo

      moves.push(move);
    }
  }

  let bestMove;
  if (player === O_CLASS) {
    // Maximize
    let bestScore = -Infinity;
    for (const move of moves) {
      if (move.score > bestScore) {
        bestScore = move.score;
        bestMove = move;
      }
    }
  } else {
    // Minimize
    let bestScore = Infinity;
    for (const move of moves) {
      if (move.score < bestScore) {
        bestScore = move.score;
        bestMove = move;
      }
    }
  }
  return bestMove;
}

// Check win for minimax board array (array-based)
function checkWinBoard(board, player) {
  return WINNING_COMBINATIONS.some(combination => {
    return combination.every(index => {
      return board[index] === player;
    });
  });
}

// Accessibility: Keyboard support for cells
cells.forEach((cell, index) => {
  cell.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cell.click();
    }
  });
});
