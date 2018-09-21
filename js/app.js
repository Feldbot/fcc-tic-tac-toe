
// Holds Tic Tac Toe game state
var ttt = {
  level: '',
  board: [null, null, null, null, null, null, null, null, null],
  boardString: function stringifyBoard() {
    return JSON.stringify(this.board);
  },
  openPositions: [],
  players: '',
  player1_symbol: '',
  player2_symbol: '',
  computer_symbol: '',
  player1_turn: false,
  moveCount: 0,
  lastMove: '',
  draw: false,
  winner: '',
  winningPositions: [],
  player1_score: 0,
  player2_score: 0,
  computer_score: 0,
  gamesPlayed: 0,
  gamesTied: 0,
};

// Winning line combinations
var winLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horiz.
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // vert.
  [0, 4, 8], [2, 4, 6] ];          // diag.

var timeoutID1, // Slows taketurn() computer move
    timeoutID2, // Delays game results to show final moves
    timeoutID3, // Slows displayGameResults() message
    timeoutID4; // Slows takeTurn() message

// Initial game setup options
function setGameOptions() {

  // Clear board and stats
  $("div#board").hide();
  $("div#stats").html('');

  // One or two player buttons
  $("div.gameSetup").html(`
      <h2>One or Two players?</h2>
      <button id="onePlayer" class="setup">1</button>
      <button id="twoPlayer" class="setup">2</button>
    `).fadeIn(1000);

  // One player game setup options
  $("button#onePlayer").on("click", function() {
    ttt.players = 1;
    selectLevel();
  });

  // Two player game setup options
  $("button#twoPlayer").on("click", function() {
    ttt.players = 2;
    chooseXO();
  } );

  // Transition between screens; fn callbacks are executed after timer runs
  function changeScreen(html, fn) {
    $("div.gameSetup").fadeOut(500, function() {
      $("div.gameSetup").html(html).fadeIn(500);
      fn();
    });
  }

  // Select level of play
  function selectLevel() {
    var html;

    html = `
      <h2>Select a level of difficulty:</h2>
      <button class="setup difficulty" id="easy">Easy</button>
      <button class="setup difficulty" id="hard">Hard</button>
      <button class="setup difficulty" id="pro">Pro</button>
    `;

    changeScreen(html, assignLevel);
  }

  // Register clicks and assign options
  function assignLevel() {
    $("button.difficulty").on("click", function() {
      ttt.level = ($(this)[0].id);
      chooseXO();
    });
  }

  // Choose a symbol
  function chooseXO() {
    var html;

    if (ttt.players === 1) {
      html = `
      <h2>Would you like to be X or O?<br>
        <em>X goes first.</em>
      </h2>
      <button class="setup symbol">X</button>
      <button class="setup symbol">O</button>
      `;
    } else {
      html = `
      <h2><strong>Player 1&mdash;</strong><br> Would you like to be X or O?<br>
        <em>X goes first.</em></h2>
      <button class="setup symbol">X</button>
      <button class="setup symbol">O</button>
      `;
    }

    changeScreen(html, assignXO);
  }

  function assignXO() {
    $("button.symbol").on("click", function () {
      ttt.player1_symbol = ($(this)[0].innerHTML);
      if ($(this)[0].innerText === 'X') {
        ttt.player1_turn = true;
        ttt.computer_symbol = 'O';
        ttt.player2_symbol = 'O';
      } else {
        ttt.computer_symbol = 'X';
        ttt.player2_symbol = 'X';
      };

      renderGameUI();
    });
  };

  // Display stats header and board
  function renderGameUI() {
    $("div.gameSetup").fadeOut(1000, function() {
      $("div#board").show().html(`
        <button id="0" class="squares"></button>
        <button id="1" class="squares"></button>
        <button id="2" class="squares"></button>
        <button id="3" class="squares"></button>
        <button id="4" class="squares"></button>
        <button id="5" class="squares"></button>
        <button id="6" class="squares"></button>
        <button id="7" class="squares"></button>
        <button id="8" class="squares"></button>
      `);

    $("div.gameSetup").html('');

      // Setup header
      if (ttt.players === 1) {
        $("div#stats").html(`
          <div id="players">
            <h3 id="player1">${ttt.player1_symbol} - Player 1 </h3>
            <h3 id="computer">${ttt.computer_symbol} - Computer </h3>
          </div>
          <div id="score">
            <h4>Wins:</h4>
            <h3><span id="player1_score" class="score">0</span></h3>
            <h3><span id="computer_score" class="score">0</span></h3>
          </div>
          <div id="smallStats">
            <h4 id="gamesTied"> Draws: 0<h4>
            <h4 id="gamesPlayed">Games: 0</h4>
          </div>`);
      } else {
        $("div#stats").html(`
          <div id="players">
            <h3 id="player1">${ttt.player1_symbol} - Player 1 </h3>
            <h3 id="player2">${ttt.player2_symbol} - Player 2 </h3>
          </div>
          <div id="score">
            <h4>Wins:</h4>
            <h3><span id="player1_score" class="score">0</span></h3>
            <h3><span id="player2_score" class="score">0</span></h3>
          </div>
          <div id="smallStats">
            <h4 id="gamesTied">Draws: 0<h4>
            <h4 id="gamesPlayed">Games: 0</h4>
          </div>`);
      }

    takeTurn();
    });
  }
};

setGameOptions();

function takeTurn() {
  var probability, positionPlayed, winLinesMatch, matchingIndex;

  highlightCurrentPlayer();

  // Player 1 or 2 turn (multiplayer mode)
  if (ttt.player1_turn  || !ttt.player1_turn && ttt.players === 2) {

    // Apply hover only on playable positions on player's turn
    $("button.squares").on("mouseover", function(e) {
      if (e.target.innerText === '' && ttt.player1_turn || ttt.player2_turn) {
        $(this).css({ "background-color": "rgb(146,199,184)" });
      } else { $(this).css({ "background-color": "rgb(155,222,200)" }) }
    });

    $("button.squares").on("mouseout", function(e) {
      if (e.target.innerText === '') {
        $(this).css({ "background-color": "rgb(155,222,200)" });
      }
    });

    // Register player move
    $("button.squares").on("click", function(e) {
      if (e.target.innerText === '') {

        $(this).css({ "background-color": "rgb(155,222,200)" });

        // Capture board position value
        positionPlayed = Number(e.target.id);
        ttt.lastMove = positionPlayed;

        // Capture only one click per turn
        $("button.squares").off("click");

        // Assign symbol onto ttt.board array
        if (ttt.player1_turn) {
          ttt.board[positionPlayed] = ttt.player1_symbol; }
        else {
          ttt.board[positionPlayed] = ttt.player2_symbol;
        }

        // Iterate winLines arrays and replace matched indices w/ player 1 symbol
        winLines.forEach(function(el) {
          winLinesMatch = el.find(function(match) {
            if (positionPlayed === match) {
              matchingIndex = el.indexOf(match);
              if (ttt.player1_turn) {
                el[matchingIndex] = ttt.player1_symbol;
              } else {
                el[matchingIndex] = ttt.player2_symbol;
              }
            };
          });
        })

        // Render symbol on board
        if (ttt.player1_turn) {
          $(this)[0].innerHTML = ttt.player1_symbol;
        } else {
          $(this)[0].innerHTML = ttt.player2_symbol;
        }

        // Toggle player turn
        if (ttt.player1_turn) {
          ttt.player1_turn = false;
        } else {
          ttt.player1_turn = true;
        }

        checkForWin();
      }
    });

  // Computer's turn (1 player mode)
  } else if (!ttt.player1_turn && ttt.players === 1) {

    // Make computer delay move
    timeoutID1 = setTimeout(slowCompMove, 1500);

    function slowCompMove() {

      // Make a random move
      function randomMove(openPositions) {

        // Find open board positions if no openPositions args are passed in
        if (arguments.length === 0) {
          ttt.board.forEach(function(position, i) {
            if (ttt.board[i] === null) {
              ttt.openPositions.push(i);
            };
          });
        }

        // If openPositions args are passed in, use them for open positions
        else if (arguments.length > 0) {
          ttt.openPositions = openPositions;
        }

        // Select a random open position on board based on open positions
        positionPlayed = ttt.openPositions[Math.floor(Math.random() *
          ttt.openPositions.length)];
      }

      // Always go for the winning move if available
      function goForWin() {
        winLines.forEach(function(el, i) {
          if (ttt.computer_symbol === 'X') {
            if (typeof el[0] === 'number' && el[1] === 'X' && el[2] === 'X' ||
                el[0] === 'X' && typeof el[1] === 'number' && el[2] === 'X' ||
                el[0] === 'X' && el[1] === 'X' && typeof el[2] === 'number') {
              getBoardPosition(i);
            }
          }
          if (ttt.computer_symbol === 'O') {
            if (typeof el[0] === 'number' && el[1] === 'O' && el[2] === 'O' ||
                el[0] === 'O' && typeof el[1] === 'number' && el[2] === 'O' ||
                el[0] === 'O' && el[1] === 'O' && typeof el[2] === 'number') {
              getBoardPosition(i);
            }
          }
        });
      }

      // Always go for the block if opponent would win on next turn
      function goForBlock() {
        winLines.forEach(function(el, i) {
          if (ttt.computer_symbol === 'X') {
            if (typeof el[0] === 'number' && el[1] === 'O' && el[2] === 'O' ||
                el[0] === 'O' && typeof el[1] === 'number' && el[2] === 'O' ||
                el[0] === 'O' && el[1] === 'O' && typeof el[2] === 'number') {
              getBoardPosition(i);
            }
          }
          if (ttt.computer_symbol === 'O') {
            if (typeof el[0] === 'number' && el[1] === 'X' && el[2] === 'X' ||
                el[0] === 'X' && typeof el[1] === 'number' && el[2] === 'X' ||
                el[0] === 'X' && el[1] === 'X' && typeof el[2] === 'number') {
              getBoardPosition(i);
            }
          }
        });
      }

      // Helper function that finds index/board position
      function getBoardPosition(i) {
        winLines[i].forEach(function(num) {
          if (typeof num === 'number') { positionPlayed = num; }
        });
      }

      ttt.openPositions = [];

      // Decide computer move based on difficulty level
      if (ttt.level === 'easy') { randomMove(); }
      if (ttt.level === 'hard') {

        // Computer will make a pro move 85% of the time
        probability = 85;
        if (Math.random() * 100 <= probability) {
          console.log('proMove')
          proMove();
        } else {
          console.log('randomMove');
          randomMove();
        }
      }

      if (ttt.level === 'pro') { proMove(); }

      function proMove() {

        /*********************************************************************
         *                    Computer is X (goes first)                     *
         *********************************************************************/

        if (ttt.computer_symbol === 'X') {

          // Move 1: X takes center to start on pro level
          if (ttt.moveCount === 0) {
            positionPlayed = 4;
          }

          // Moves 2-3: if X randomly took a corner and O has center
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,null,null,null,"O",null,"X",null,null]') {
              positionPlayed = 2;
          }
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '["X",null,null,null,"O",null,null,null,null]') {
              positionPlayed = 8;
          }
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,null,"X",null,"O",null,null,null,null]') {
              positionPlayed = 6;
          }
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,null,null,null,"O",null,null,null,"X"]') {
              positionPlayed = 0;
          }

          // Moves 2-3: if X randomly took a side and O has center
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,null,null,"X","O",null,null,null,null]') {
              randomMove([2, 8]);
          }
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,"X",null,null,"O",null,null,null,null]') {
              randomMove([6, 8]);
          }
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,null,null,null,"O","X",null,null,null]') {
              randomMove([0, 6]);
          }
          if (ttt.moveCount === 2 &&
            ttt.boardString() === '[null,null,null,null,"O",null,null,"X",null]') {
              randomMove([0, 2]);
          }

          // Moves 2-3: if O takes a side, X counters with opposite corner
          if (ttt.moveCount === 2 && ttt.board[1] === 'O') {
            randomMove([6, 8]);
          }
          if (ttt.moveCount === 2 && ttt.board[3] === 'O') {
            randomMove([2, 8]);
          }
          if (ttt.moveCount === 2 && ttt.board[5] === 'O') {
            randomMove([0, 6]);
          }
          if (ttt.moveCount === 2 && ttt.board[7] === 'O') {
            randomMove([0, 2]);
          }
        }

        // Moves 2-3: if O takes a corner, counter with straight diagonal line
        if (ttt.moveCount === 2 && ttt.board[0] === 'O') { positionPlayed = 8; }
        if (ttt.moveCount === 2 && ttt.board[2] === 'O') { positionPlayed = 6; }
        if (ttt.moveCount === 2 && ttt.board[6] === 'O') { positionPlayed = 2; }
        if (ttt.moveCount === 2 && ttt.board[8] === 'O') { positionPlayed = 0; }

        // Move 2-3: take center if available
        if (ttt.moveCount === 2 && ttt.board[4] === null) {
          positionPlayed = 4;
        }

        // Move 4-5: If opponent takes far side opposite his symbol, take open corner
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["O",null,null,null,"X","O",null,null,"X"]') {
          positionPlayed = 6;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["O",null,null,null,"X",null,null,"O","X"]') {
          positionPlayed = 2;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,"O","O","X",null,"X",null,null]') {
          positionPlayed = 8;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,"O",null,"X",null,"X","O",null]') {
          positionPlayed = 0;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["X","O",null,null,"X",null,null,null,"O"]') {
          positionPlayed = 6;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["X",null,null,"O","X",null,null,null,"O"]') {
          positionPlayed = 2;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O","X",null,"X",null,"O",null,null]') {
          positionPlayed = 8;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,"X",null,"X","O","O",null,null]') {
          positionPlayed = 0;
        }

        // Move 4-5: take adjacent corner for win on next turn
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O",null,null,"X","O",null,"X",null]' ||
          ttt.boardString() === '[null,"O",null,"O","X",null,null,"X",null]') {
            randomMove([6, 8]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,null,"X","X","O",null,"O",null]' ||
          ttt.boardString() === '[null,"O",null,"X","X","O",null,null,null]') {
          randomMove([0, 6]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"X",null,"O","X",null,null,"O",null]' ||
          ttt.boardString() === '[null,"X",null,null,"X","O",null,"O",null]') {
          randomMove([0, 2]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O",null,"O","X","X",null,null,null]' ||
          ttt.boardString() === '[null,null,null,"O","X","X",null,"O",null]') {
          randomMove([2, 8]);
        }

        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["X","O",null,null,"O",null,null,"X",null]' ||
          ttt.boardString() === '[null,null,null,"X","O","O",null,null,"X"]') {
          positionPlayed = 6;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O","X",null,"O",null,null,"X",null]' ||
          ttt.boardString() === '[null,null,null,"O","O","X","X",null,null]') {
          positionPlayed = 8;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,"X","X","O","O",null,null,null]' ||
          ttt.boardString() === '[null,"X",null,null,"O",null,"X","O",null]') {  positionPlayed = 0;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"X",null,null,"O",null,null,"O","X"]' ||
          ttt.boardString() === '["X",null,null,"O","O","X",null,null,null]') {
          positionPlayed = 2;
        }

        // Move 4-5: take far corner
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O",null,null,"X",null,null,"X","O"]') {
            positionPlayed = 2; // or randomMove([2, 5]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O",null,null,"X",null,"O","X",null]') {
            positionPlayed = 0; // or randomMove([0, 3]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,null,"X","X","O","O",null,null]') {
            positionPlayed = 8; // or randomMove([7, 8]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["O",null,null,"X","X","O",null,null,null]') {
            positionPlayed = 2; // or randomMove([1, 2]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["O","X",null,null,"X",null,null,"O",null]') {
            positionPlayed = 6; // or randomMove([3, 6]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"X","O",null,"X",null,null,"O",null]') {
            positionPlayed = 8; // or randomMove([5, 8]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,null,"O","X","X",null,null,"O"]') {
            positionPlayed = 6; // or randomMove([6, 7]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,"O","O","X","X",null,null,null]') {
            positionPlayed = 0; // or randomMove([0, 1]);
        }

        // Move 4-5: take closest corner
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,null,"O","O","X",null,"X",null]' ||
          ttt.boardString() === '[null,"O",null,null,"O","X",null,"X",null]') {
            positionPlayed = 8;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"X",null,"O","O","X",null,null,null]' ||
          ttt.boardString() === '[null,"X",null,null,"O","X",null,"O",null]') {
            positionPlayed = 2;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"O",null,"X","O",null,null,"X",null]' ||
          ttt.boardString() === '[null,null,null,"X","O","O",null,"X",null]') {
            positionPlayed = 6;
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,"X",null,"X","O","O",null,null,null]' ||
          ttt.boardString() === '[null,"X",null,"X","O",null,null,"O",null]') {
            positionPlayed = 0;
        }

        // Move 4-5: take open corner
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '[null,null,"X",null,"O",null,"O","X",null]' ||
          ttt.boardString() === '[null,"X","O",null,"O",null,"X",null,null]' ||
          ttt.boardString() === '[null,null,"O",null,"O","X","X",null,null]' ||
          ttt.boardString() === '[null,null,"X","X","O",null,"O",null,null]') {
            randomMove([0, 8]);
        }
        if (ttt.moveCount === 4 &&
          ttt.boardString() === '["X",null,null,null,"O",null,null,"X","O"]' ||
          ttt.boardString() === '["X",null,null,null,"O","X",null,null,"O"]' ||
          ttt.boardString() === '["O","X",null,null,"O",null,null,null,"X"]' ||
          ttt.boardString() === '["O",null,null,"X","O",null,null,null,"X"]') {
            randomMove([2, 6]);
        }

        // Move 4-5: take center if available
        if (ttt.moveCount === 4 && ttt.board[4] === null) {
          positionPlayed = 4;
        }

        // Move 6-7: choose random side instead of corner
        if (ttt.moveCount === 6 && JSON.stringify(winLines[1]) === '[3,"X",5]') {
          randomMove([3, 5]);
        }
        if (ttt.moveCount === 6 && JSON.stringify(winLines[4]) === '[1,"X",7]') {
          randomMove([1, 7]);
        }

        // Move 6-7: choose random corner
        if (ttt.moveCount === 6 &&
          ttt.boardString() === '[null,null,"O","O","X","X","X","O",null]' ||
          ttt.boardString() === '[null,"O","X","X","X","O","O",null,null]') {
            randomMove([0, 8]);
        }
        if (ttt.moveCount === 6 &&
          ttt.boardString() === '["X","O",null,"O","X",null,null,"X","O"]' ||
          ttt.boardString() === '["O","X",null,null,"X","O",null,"O","X"]') {
            randomMove([2, 6]);
        }

        // Move 6-7: take random position for draw
        if (ttt.moveCount === 6 &&
          ttt.boardString() === '["O","X",null,null,"O",null,"X","O","X"]' ||
          ttt.boardString() === '[null,"X","O",null,"O",null,"X","O","X"]' ||
          ttt.boardString() === '["X",null,"O","O","O","X","X",null,null]' ||
          ttt.boardString() === '["X",null,null,"O","O","X","X",null,"O"]' ||
          ttt.boardString() === '["X","O","X",null,"O",null,"O","X",null]' ||
          ttt.boardString() === '["X","O","X",null,"O",null,null,"X","O"]' ||
          ttt.boardString() === '["O",null,"X","X","O","O",null,null,"X"]' ||
          ttt.boardString() === '[null,null,"X","X","O","O","O",null,"X"]') {
            randomMove();
        }

        // Move 6-7: take center if available
        if (ttt.moveCount === 6 && ttt.board[4] === null) {
          positionPlayed = 4;
        }

        // Move 4-n: Try for win or prevent win on next move (when possible)
        if (ttt.moveCount >= 4) {
          goForBlock();
          goForWin();
        }

        // Move 9: Take the last open spot for a draw
        if (ttt.moveCount === 8) {
          winLines.forEach(function(arr) {
            winLinesMatch = arr.find(function(match) {
              if (typeof match === 'number') {
                positionPlayed = match;
              }
            });
          });
        }

        /*********************************************************************
         *                    Computer is O (goes second)                    *
         *********************************************************************/

        if (ttt.computer_symbol === 'O') {

          // Move 2A: if X took center, play a corner
          if (ttt.moveCount === 1 && ttt.lastMove === 4) {
            randomMove([0, 2, 6, 8]);
          }

          // Move 2B: if X didn't take center, take center
          if (ttt.moveCount === 1 && ttt.lastMove !== 4) { positionPlayed = 4; }

          // Move 3-4A (X center): if X took diagonal line, take corner
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,null,"O",null,"X",null,"X",null,null]' ||
            ttt.boardString() === '[null,null,"X",null,"X",null,"O",null,null]') {
              randomMove([0, 8]);
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '["X",null,null,null,"X",null,null,null,"O"]' ||
            ttt.boardString() === '["O",null,null,null,"X",null,null,null,"X"]') {
              randomMove([2, 6]);
          }

          // Move 3-4B (O center): if X takes diagonal line, play side
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '["X",null,null,null,"O",null,null,null,"X"]' ||
            ttt.boardString() === '[null,null,"X",null,"O",null,"X",null,null]') {
              randomMove([1, 3, 5, 7]);
          }

          // Move 3-4C: if X chose horizontal line (O center), take corner
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,"X",null,null,"O",null,null,"X",null]' ||
            ttt.boardString() === '[null,null,null,"X","O","X",null,null,null]') {
              randomMove([0, 2, 6, 8]);
          }

          // Move 3-4D: if X chooses two adjacent sides, take corner between them
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,"X",null,null,"O","X",null,null,null]') {
              positionPlayed = 2;
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,null,null,null,"O","X",null,"X",null]') {
              positionPlayed = 8;
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,null,null,"X","O",null,null,"X",null]') {
              positionPlayed = 6;
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,"X",null,"X","O",null,null,null,null]') {
              positionPlayed = 0;
          }

          // Move 3-4E: if X chooses corner and far side, take perpendicular corner
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '["X",null,null,null,"O","X",null,null,null]' ||
            ttt.boardString() === '[null,"X",null,null,"O",null,null,null,"X"]') {
              positionPlayed = 2;
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,null,"X",null,"O",null,null,"X",null]' ||
            ttt.boardString() === '[null,null,null,null,"O","X","X",null,null]') {
              positionPlayed = 8;
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,null,null,"X","O",null,null,null,"X"]' ||
            ttt.boardString() === '["X",null,null,null,"O",null,null,"X",null]') {
              positionPlayed = 6;
          }
          if (ttt.moveCount === 3 &&
            ttt.boardString() === '[null,"X",null,null,"O",null,"X",null,null]' ||
            ttt.boardString() === '[null,null,"X","X","O",null,null,null,null]') {
              positionPlayed = 0;
          }

          // Move 5-6A: if X completes diagonal line
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,"O","X",null,"X",null,"O","X",null]') {
              randomMove([0, 3]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["O",null,null,"X","X","O",null,null,"X"]') {
              randomMove([1, 2]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,"X","O",null,"X",null,"X","O",null]') {
              randomMove([5, 8]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["X",null,null,"O","X","X",null,null,"O"]') {
              randomMove([6, 7]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["X","O",null,null,"X",null,null,"X","O"]') {
              randomMove([2, 5]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["O","X",null,null,"X",null,null,"O","X"]') {
              randomMove([3, 6]);
          }

          // Move 5B: Take an open side
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["X","O","X",null,"O",null,null,"X",null]' ||
            ttt.boardString() === '[null,"X",null,null,"O",null,"X","O","X"]') {
              randomMove([3, 5]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,null,"X","X","O","O",null,null,"X"]' ||
            ttt.boardString() === '["X",null,null,"O","O","X","X",null,null]') {
              randomMove([1, 7]);
          }

          // Move 5C: Take an open corner
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,"X","O",null,"O","X","X",null,null]' ||
            ttt.boardString() === '[null,null,"X","X","O",null,"O","X",null]') {
              randomMove([0, 8]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["X",null,null,null,"O","X",null,"X","O"]' ||
            ttt.boardString() === '["O","X",null,"X","O",null,null,null,"X"]') {
              randomMove([2, 6]);
          }

          // Move 5D: Take horizontal line as last possible win line
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,null,"X","X","X","O","O",null,null]') {
              randomMove([7, 8]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["O","X",null,null,"X",null,null,"O","X"]') {
              randomMove([3, 6]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,null,"O","O","X","X","X",null,null]') {
              randomMove([0, 1]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["X","O",null,null,"X",null,null,"X","O"]') {
              randomMove([2, 5]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["X",null,null,"O","X","X",null,null,"O"]') {
              randomMove([6, 7]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,"O","X",null,"X",null,"O","X",null]') {
              randomMove([0, 3]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '["O",null,null,"X","X","O",null,null,"X"]') {
              randomMove([1, 2]);
          }
          if (ttt.moveCount === 5 &&
            ttt.boardString() === '[null,"X","O",null,"X",null,"X","O",null]') {
              randomMove([5, 8]);
          }

          // Move 7A: take an open side for draw
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["O","X","O",null,"X",null,"X","O","X"]' ||
            ttt.boardString() === '["X","O","X",null,"X",null,"O","X","O"]') {
            randomMove([3, 5]);
          }

          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["X",null,"O","O","X","X","X",null,"O"]' ||
            ttt.boardString() === '["O",null,"X","X","X","O","O",null,"X"]') {
            randomMove([1, 7]);
          }

          // Move 7B: take a random move for draw
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["X","X","O","O","O","X","X",null,null]') {
              randomMove([7, 8]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["X","O","X",null,"O","X",null,"X","O"]') {
              randomMove([3, 6]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '[null,null,"X","X","O","O","O","X","X"]') {
              randomMove([0, 1]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["O","X",null,"X","O",null,"X","O","X"]') {
              randomMove([2, 5]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["O","X","X","X","O","O",null,null,"X"]') {
              randomMove([6, 7]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '[null,"X","O",null,"O","X","X","O","X"]') {
              randomMove([0, 3]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["X",null,null,"O","O","X","X","X","O"]') {
              randomMove([1, 2]);
          }
          if (ttt.moveCount === 7 &&
            ttt.boardString() === '["X,""O","X","X","O",null,"O","X",null]') {
              randomMove([5, 8]);
          }

          // Move 4A: Block win on next move
          if (ttt.moveCount >= 3) {
            goForBlock();
            goForWin();
          }

        // Move 9A: Take the last open spot for a draw
        if (ttt.moveCount === 8) {
          winLines.forEach(function(arr) {
            winLinesMatch = arr.find(function(match) {
              if (typeof match === 'number') {
                positionPlayed = match;
              }
            });
          });
        }
      }
    }

      // Update board array & last move
      ttt.board[positionPlayed] = ttt.computer_symbol;
      ttt.lastMove = positionPlayed;

      // Update board with computer's symbol
      if (ttt.moveCount < 9) {
        $("button.squares")[positionPlayed].innerText = ttt.computer_symbol;
      }

      // Iterate winLines arrays and replace matched indices with computer symbol
      winLines.forEach(function(el) {
        winLinesMatch = el.find(function(match) {
          if (positionPlayed === match) {
            matchingIndex = el.indexOf(match);
            el[matchingIndex] = ttt.computer_symbol;
          };
        });
      })

      // Toggle players
      ttt.player1_turn = true;

      clearTimeout(timeoutID1);
      clearTimeout(timeoutID4);

      checkForWin();
    }
  }
}

function highlightCurrentPlayer() {

  // Indicate current player
  if (ttt.players === 1) {
    if (ttt.player1_turn) {  // X
      $("h3#player1").addClass("currentPlayer");
      $("h3#computer").removeClass("currentPlayer");
    } else if (!ttt.player1_turn) {  // O
      $("h3#player1").removeClass("currentPlayer");
      $("h3#computer").addClass("currentPlayer");
    }
  }
  if (ttt.players === 2) {
    if (ttt.player1_turn) {  // X
      $("h3#player1").addClass("currentPlayer");
      $("h3#player2").removeClass("currentPlayer");
    } else if (!ttt.player1_turn) {  // O
      $("h3#player1").removeClass("currentPlayer");
      $("h3#player2").addClass("currentPlayer");
    }
  }
}

function checkForWin() {
  var isXWinner, isOWinner;

  ttt.moveCount++;

  // Find winner and winLines winning index
  winLines.forEach(function(el, i) {
    if (JSON.stringify(el) === '["X","X","X"]') {
      ttt.winner = 'X';
      ttt.winningIndex = i;
    } else if (JSON.stringify(el) === '["O","O","O"]' ) {
      ttt.winner = 'O';
      ttt.winningIndex = i;
    };
  });

  // Highlight winning moves on board
  switch (ttt.winningIndex) {
    case 0:
      ttt.winningIndex = [0, 1, 2];
      $("button#0, button#1, button#2").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 1:
      ttt.winningIndex = [3, 4, 5];
      $("button#3, button#4, button#5").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 2:
      ttt.winningIndex = [6, 7, 8];
      $("button#6, button#7, button#8").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 3:
      ttt.winningIndex = [0, 3, 6];
      $("button#0, button#3, button#6").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 4:
      ttt.winningIndex = [1, 4, 7];
      $("button#1, button#4, button#7").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 5:
      ttt.winningIndex = [2, 5, 8];
      $("button#2, button#5, button#8").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 6:
      ttt.winningIndex = [0, 4, 8];
      $("button#0, button#4, button#8").css("backgroundColor", "rgb(249,236,49)");
      break;
    case 7:
      ttt.winningIndex = [2, 4, 6];
      $("button#2, button#4, button#6").css("backgroundColor", "rgb(249,236,49)");
      break;
  }

  // Game is won, disable button hover and delay to see winning move on board
  if (ttt.winner != '') {
    $("button.squares").off("mouseover");
    $("button.squares").off("mouseout");
    timeoutID2 = setTimeout(displayGameResults, 2000);
  };


  // Game is a draw, delay to see results on board
  if (ttt.moveCount === 9 && ttt.winner === '') {
    ttt.draw = true;
    timeoutID2 = setTimeout(displayGameResults, 1500);
  }

  // Game continues if no winner
  if (ttt.moveCount < 9 && ttt.winner === '') { takeTurn(); }
}

function displayGameResults() {
  var winMsg = `<h2>${ttt.winner} won!</h2>`,
      drawMsg = '<h2>It\'s a draw...</h2>';

  // Clear player indicators
  $("div#one, div#two").css("backgroundColor", "rgb(155,222,200)");

  // Render draw message
  if (ttt.draw) {
    $("div#board").fadeOut(500, function() {
      $("div#board").hide();
      $("div.gameSetup").show().html(drawMsg).fadeIn(1000, function() {
        timeoutID3 = setTimeout(pauseAndFade, 1000);
        });
      });
    };

  // Render win message
  if (ttt.winner) {
    $("div#board").fadeOut(500, function() {
      $("div#board").hide();
      $("div.gameSetup").show().html(winMsg).fadeIn(1000, function() {
        timeoutID3 = setTimeout(pauseAndFade, 1000);
        });
      });
    };

  function pauseAndFade() {
    $("div.gameSetup").fadeOut(1000, function() {
      $("div.gameSetup").hide();
      $("div#board").show();
    });
  }

  updateStats();

  clearTimeout(timeoutID2);
  clearTimeout(timeoutID3);

  playAnotherGame();
}

function updateStats() {

  // Update scores based on who won
  if (ttt.player1_symbol === ttt.winner) {
    ttt.player1_score++;
    $("span#player1_score").delay(3000).text(ttt.player1_score);
  }
  if (ttt.player2_symbol === ttt.winner) {
    ttt.player2_score++;
    $("span#player2_score").delay(3000).text(ttt.player2_score);
  }
  if (ttt.computer_symbol === ttt.winner) {
    ttt.computer_score++;
    $("span#computer_score").delay(3000).text(ttt.computer_score);
  }

  // Update games played, games tied
  ttt.gamesPlayed++;
  $("h4#gamesPlayed").text(`Games: ${ttt.gamesPlayed}`);
  if (ttt.winner === '') {
    ttt.gamesTied++;
    $("h4#gamesTied").text(`Draws: ${ttt.gamesTied}`);
  }
}

function playAnotherGame() {
  ttt.board = [null, null, null, null, null, null, null, null, null];
  ttt.openPositions = [];
  ttt.moveCount = 0;
  ttt.draw = false;
  ttt.winner = '';
  ttt.winningIndex = [];

  winLines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8],
               [0, 3, 6], [1, 4, 7], [2, 5, 8],
               [0, 4, 8], [2, 4, 6] ];

  // Decide who goes first
  ttt.computer_symbol === 'X' ? ttt.player1_turn = false : ttt.player1_turn = true;

  $("div#board").html(`
    <button id="0" class="squares"></button>
    <button id="1" class="squares"></button>
    <button id="2" class="squares"></button>
    <button id="3" class="squares"></button>
    <button id="4" class="squares"></button>
    <button id="5" class="squares"></button>
    <button id="6" class="squares"></button>
    <button id="7" class="squares"></button>
    <button id="8" class="squares"></button>
  `);

  timeoutID4 = setTimeout(takeTurn, 4000);
}

// Reset game to beginning
$("button#reset").on("click", function() {
  reset();
  setGameOptions();
});

function reset() {
  ttt = {
    level: '',
    board: [null, null, null, null, null, null, null, null, null],
    boardString: function stringifyBoard() {
      return JSON.stringify(this.board);
    },
    openPositions: [],
    players: '',
    player1_symbol: '',
    player2_symbol: '',
    computer_symbol: '',
    player1_turn: false,
    moveCount: 0,
    lastMove: '',
    draw: false,
    winner: '',
    winningPositions: [],
    player1_score: 0,
    player2_score: 0,
    computer_score: 0,
    gamesPlayed: 0,
    gamesTied: 0,
  };

  winLines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8],
               [0, 3, 6], [1, 4, 7], [2, 5, 8],
               [0, 4, 8], [2, 4, 6] ];
}
