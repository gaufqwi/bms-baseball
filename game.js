window.onload = function () {
    var game;
    
    // Declare shared variables here
    
    // Variables for sprite objects
    var players = [];
    
    // Variables for text objects
    
    // Variables for sound objects
    
    // Variables for other Phaser game objects
    
    // Variables for game state (e.g. score, strikes, etc.)
    var bases = [{x: 90, y: 500}, {x: 300, y: 500}, {x: 300, y: 300}, {x:90, y:300}];
    var team1Scores = [0, 0, 0, 0, 0];
    var team2Scores = [0, 0, 0, 0, 0]
    var teamAtBat = 1;
    var playerAtBat = 0;
    var mode = "waiting";
    
    // Preload assets
    // game.load.whatever functions
    var preload = function () {
        game.load.image('diamond', 'assets/images/baseballfield.png');
        game.load.image('player', 'assets/images/player.png');
    };
    
    // Draw initial screen
    var create = function () {
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
        players[0].visible = true;
        players[0].x = 90;
        players[0].y = 500;
        
        runBases(4);
    };
    
    // Runs every second to get input, redraw screen,
    // etc.
    var update = function () {

    };
    
    // Function to do specific jobs
    var runBases = function (nBases) {
        players[playerAtBat].base = 0;
        for (var i = 0; i < 4; i++) {
            if (players[i].base !== -1) {
                var nextbase = (players[i].base + 1) % 4;
                var tween = game.add.tween(players[i]);
                players[i].basesToRun = nBases;
                tween.to(bases[nextbase], 2000, 'Linear', true, 500);
                tween.onComplete.addOnce(reachBase, this);
            } 
        }
    };
    
    var reachBase = function (player) {
        player.base = (player.base + 1) % 4;
        player.basesToRun -= 1;
        console.log('On base', player.base, player.basesToRun);
        if (player.base === 0) {
            player.base = -1;
            scoreRun();
        } else if (player.basesToRun > 0) {
            var nextbase = (player.base + 1) % 4;
            var tween = game.add.tween(player);
            tween.to(bases[nextbase], 2000, 'Linear', true, 500);
            tween.onComplete.addOnce(reachBase, this);
        }
    };
    
    var scoreRun = function() {
        console.log('and the crowd goes wild');
    };
    
    // Don't edit below here
    game = new Phaser.Game(800, 600, Phaser.AUTO,
        'main', {
            preload: preload, 
            create: create,
            update: update
        });
};