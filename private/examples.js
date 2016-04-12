var things = [];

for (var i = 0; i < 10; i++) {
    things[i] = game.add.whatever(x, y);
    things[i].someProperty = 'something';
    // blah blah
}

// Adding an image to screen

//                   key string from preload
//                   |
//                y coordinate of anchor
//                |  |
//             x coordinate of anchor
//             |  |  |
//             v  v  v
blah = game.add.image(x, y, key);