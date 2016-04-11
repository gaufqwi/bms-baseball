
var fontConfig = {
    active: function () {
        init();
    },
    
    google: {
        families: ['Rye', 'VT323', 'Rock Salt']
    }
};

WebFont.load(fontConfig);

var init = function () {
    var game;
    
    // Declare shared variables here
    
    // Variables for sprite objects
    var players = [];
    
    // Variables for text objects
    
    // Variables for sound objects
    
    // Variables for other Phaser game objects
    var questionPopup;
    var questionText;
    var batterUp;
    var answerButtons = [];
    
    // Variables for keyboard input;
    var answerKeys = [];

    // Variables for game state (e.g. score, strikes, etc.)
    var bases = [{x: 90, y: 500}, {x: 300, y: 500}, {x: 300, y: 300}, {x:90, y:300}];
    var team1InningScores = [0, 0, 0, 0, 0];
    var team1TotalScore = 0;
    var team2InningScores = [0, 0, 0, 0, 0];
    var team2TotalScore = 0;
    var inning = 0;
    var teamAtBat = 1;
    var batter = 0;
    var strikes = 0;
    var basesPossible = 4;
    var outs = 0;
    var nRunners = 0;
    var question = null;
    var answers = [];
    var wrongAnswers = [];
    var unusedQuestions = questions.length;
    var mode = 'batterup';
    var timeMarker = 0;
    
    // Preload assets
    // game.load.whatever functions
    var preload = function () {
        game.load.image('diamond', 'assets/images/baseballfield.png');
        game.load.image('player', 'assets/images/player.png');
        game.load.image('pinebutton', 'assets/images/pinebutton.png');
        game.load.image('batterup', 'assets/images/batterup.png');
        game.load.image('qboard', 'assets/images/qboard.png');
    };
    
    // Draw initial screen
    var create = function () {
        answerKeys[0] = game.input.keyboard.addKey(Phaser.Keyboard.A);
        answerKeys[1] = game.input.keyboard.addKey(Phaser.Keyboard.B);
        answerKeys[2] = game.input.keyboard.addKey(Phaser.Keyboard.C);
        answerKeys[3] = game.input.keyboard.addKey(Phaser.Keyboard.D);
        
        var diamond = game.add.image(0, 0, 'diamond');
        diamond.width = 800;
        diamond.height = 600;
        for (var i = 0; i < 4; i++) {
            players[i] = game.add.sprite(0, 0, 'player');
            players[i].visible = false;
            players[i].scale.setTo(0.2);
            players[i].anchor.setTo(0.5);
            players[i].base = -1;
        }
        
        questionPopup = game.add.group();
        game.add.image(12, 0, 'qboard', null, questionPopup);
        questionText = game.make.text(36, 8, 'Foo', {
            font: '36px VT323',
            fill: 'red',
            wordWrap: true,
            wordWrapWidth: 728
        });
        questionPopup.add(questionText);
        for (i = 0; i < 4; i++) {
            var x = 24 + (i % 2) * 402;
            var y = 144 + Math.floor(i / 2) * 124;
            var letter = String.fromCharCode(65 + i);
            answerButtons[i] = new AnswerButton(game, x, y, letter);
            answerButtons[i].setHandler(checkAnswer);
            questionPopup.add(answerButtons[i]);
        }
        questionPopup.y = 100;
        questionPopup.visible = false;
        
        batterUpButton = game.add.image(game.world.centerX, game.world.centerY, 'batterup');
        batterUpButton.anchor.setTo(0.5);
        batterUpButton.inputEnabled = true;
        batterUpButton.input.start(0, true);
        batterUpButton.events.onInputUp.add(function () {
            batterUpButton.visible = false;
            mode = 'newquestion';
        });
    };
    
    // Runs every second to get input, redraw screen,
    // etc.
    var update = function () {
        if (mode === 'newquestion') {
            nextBatter();
            nextQuestion();
            showPopup();
            basesPossible = 4;
            strikes = 0;
            for (var i = 0; i < 4; i++) {
                answerKeys[i].eliminated = false;
            }
            timeMarker = game.time.now;
            mode = 'waiting';
        } else if (mode === 'waiting') {
            // Check to see if a key is pressed
            for (i = 0; i < 4; i++) {
                if (!answerKeys[i].eliminated && answerKeys[i].isDown) {
                    checkAnswer(answers[i]);
                    break;
                }
            }

            // If enough time has passed, add strikes
            if ((game.time.now - timeMarker) > 2000) {
                timeMarker = game.time.now;
                basesPossible -= 1;
                if (basesPossible < 3) {
                    strikes += 1;
                    eliminateAnswer();
                    updateScoreBoard();
                }
            }
            
            // Three strikes and you're out
            if (strikes === 3) {
                strikeOut();
            }
        }
    };
    
    // Function to do specific jobs
    var batterUp = function () {
        hidePopup();
        batterUpButton.visible = true;
        mode = 'batterup';
    };
    
    var checkAnswer = function (ans) {
        if (ans === question.a) {
            mode = 'running';
            runBases(basesPossible);
            hidePopup();
        } else {
            // Find answer index
            for (var i = 0; i < 4; i++) {
                if (answers[i] === ans) {
                    break;
                }
            }
            eliminateAnswer(i);
            strikes += 1;
            basesPossible -= 1;
        }
    };
    
    var runBases = function (nBases) {
        players[batter].base = 0;
        nRunners = 0;
        for (var i = 0; i < 4; i++) {
            if (players[i].base !== -1) {
                nRunners += 1;
                var nextbase = (players[i].base + 1) % 4;
                var tween = game.add.tween(players[i]);
                players[i].basesToRun = nBases;
                tween.to(bases[nextbase], game.rnd.integerInRange(2300,2700), 'Linear', true, 500);
                tween.onComplete.addOnce(reachBase, this);
            } 
        }
    };
    
    var reachBase = function (player) {
        player.base = (player.base + 1) % 4;
        player.basesToRun -= 1;
        if (player.base === 0) {
            player.base = -1;
            player.visible = false;
            nRunners -= 1;
            scoreRun();
        } else if (player.basesToRun > 0) {
            var nextbase = (player.base + 1) % 4;
            var tween = game.add.tween(player);
            tween.to(bases[nextbase], game.rnd.integerInRange(2300,2700), 'Linear', true, 500);
            tween.onComplete.addOnce(reachBase, this);
        }
        if (nRunners === 0) {
            game.time.events.add(3000, batterUp);
        }
    };
    
    var scoreRun = function() {
        if (teamAtBat === 1) {
            team1InningScores[inning] += 1;
            team1TotalScore += 1;
        } else {
            team2InningScores[inning] += 1;
            team2TotalScore += 1;
        }
        // TODO: Razzle dazzle
        updateScoreBoard();
    };
    
    var eliminateAnswer = function (i) {
        if (!i) {
            i = wrongAnswers.pop();
        }
        answerButtons[i].hide();
        answerKeys[i].eliminated = true;
    };
    
    var strikeOut = function () {
        console.log('strikeout');
        outs += 1;
        batterUp();
    };
    
    var updateScoreBoard = function () {
        console.log(team1InningScores);
        console.log(team1TotalScore);
        console.log(strikes);
    };
    
    var nextBatter = function () {
        while (players[batter].base !== -1) {
            batter = (batter + 1) % 4;
        }
        players[batter].x = bases[0].x;
        players[batter].y = bases[0].y;
        players[batter].visible = true;
    };
    
    var nextQuestion = function () {
        if (unusedQuestions === 0) {
            return false;
        }
        var i = game.rnd.between(0, unusedQuestions - 1);
        question = questions[i];
        questions.splice(i, 1);
        questions.push(question);
        return true;
    };
    
    var showPopup = function () {
        questionPopup.alpha = 0;
        questionPopup.visible = true;
        questionText.setText(question.q);
        answers = question.c.slice(0, 3);
        answers.push(question.a);
        shuffle(answers);
        wrongAnswers.length = 0;
        for (var i = 0; i < 4; i++) {
            answerButtons[i].reset();
            answerButtons[i].setText(answers[i]);
            if (answers[i] !== question.a) {
                wrongAnswers.push(i);
            }
        }
        shuffle(wrongAnswers);
        game.add.tween(questionPopup).to({alpha: 1.0}, 500, 'Linear', true);
    };
    
    var hidePopup = function () {
        var tween = game.add.tween(questionPopup).to({alpha: 0}, 200, 'Linear', true);
        tween.onComplete.add(function () {
            questionPopup.visible = false;
        });
    };
    
    var shuffle = function (a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = game.rnd.between(0, i);
            a.push(a[j]);
            a.splice(j, 1);
        }
    }
    
    // Don't edit below here
    game = new Phaser.Game(800, 600, Phaser.AUTO,
        'main', {
            preload: preload, 
            create: create,
            update: update
        });
};

// Seriously, don't edit below here

var AnswerButton = function (game, x, y, letter) {
    Phaser.Image.call(this, game, x, y, 'pinebutton');
    this.inputEnabled = true;
    this.input.start(0, true);
    var letterText = game.make.text(30, 50, letter, {
        font: '56px Rye',
        fill: 'blue'
    });
    letterText.anchor.setTo(0.5);
    this.addChild(letterText);
    this.ansText = this.game.make.text(200, 50, '', {
        font: '48px Rye',
        fill: 'black',
        strokeThickness: 4,
        stroke: 'white'
    });
    this.ansText.anchor.setTo(0.5);
    this.addChild(this.ansText);
    var self = this;
    this.events.onInputUp.add(function () {
        if (self.clickHandler) {
            self.clickHandler(self.ansText.text);
        }
    });
};

AnswerButton.prototype = Object.create(Phaser.Image.prototype);
AnswerButton.prototype.constructor = AnswerButton;

AnswerButton.prototype.setText = function (text) {
    this.ansText.setText(text);
    this.ansText.scale.setTo(1);
};

AnswerButton.prototype.setHandler = function (handler) {
    this.clickHandler = handler;
};

AnswerButton.prototype.hide = function () {
    this.inputEnabled = false;
    this.game.add.tween(this).to({alpha: 0}, 400, 'Linear', true);
};

AnswerButton.prototype.reset = function () {
    this.inputEnabled = true;
    this.input.start(0, true);
    this.alpha = 1;
    this.game.tweens.removeFrom(this);
}

AnswerButton.prototype.update = function () {
    if (this.ansText.dirty) {
        if (this.ansText.width > 270) {
            this.ansText.scale.setTo(270 / this.ansText.width);
        }
    }
};