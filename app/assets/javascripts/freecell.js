String.prototype.ucfirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


/*
 instead of doing all that class prototype shit we need a way to sync data between client and server
 javascript objects won't work for that case
 so we need to use CARD IDs and then generate properties from that ID
 so that ruby and and JS can easily transmit card ids and etc
 */


// initalize game
var Game = {};

// ie board
Game.tableau = {
    // the wild spaces
    freecells: [null, null, null, null],
    // piles where the aces ago
    foundation: [null, null, null, null],
    // ie columns
    stock: [[], [], [], [], [], [], [], []]
};


Game.init = function (data) {
    Game.tableau = data.tableau;
    Game.player = data.player;

    Game.set_title(data);
    $('.opponent_name').html(data.opponent_name);
    $('#turn_number').html(data.turn_number);

    if (data.game_mode === "singleplayer") {
        Game.is_your_turn = true;
    } else {
        Game.is_your_turn = data.turn === Game.player;
    }

    if (Game.is_your_turn) {
        $('.timer_area').addClass('your_turn');
        $('.timer_area').removeClass('their_turn');
    } else {
        $('.timer_area').removeClass('your_turn');
        $('.timer_area').addClass('their_turn');
    }

    Game.render();
    Timer.stop();

    if (data.start_time !== 0)
        Timer.start($('#game_timer'), data.start_time);

    if (Game.is_your_turn)
      Game.render_actions();

    Game.music();
};

Game.end_game = function(data) {
    if (data.action === "game_lost")
        $('#game_over_bar').css('display', 'block');
    else if (data.action === "game_won")
        $('#game_won_bar').css('display', 'block');

    if (data.end_type === "forfeit") {
        $('.forfeit_text').css('display', 'block');
    } else if (data.end_type === "played") {
        $('.played_text').css('display', 'block');
    }

    $('.' + data.game_mode + '_text').css('display', 'block');

    // remove the click actions
    Game.render();

    Timer.stop();
    Timer.set_static_time(data.end_time - data.start_time);
};


Game.music_active = false;
Game.music = function() {
    if (!Game.music_active) {
        Game.music_active = true;
        loopify("/ff.wav", function (err, loop) {
            if (err) {
                Game.music_active = false;
                console.warn(err);
            }

            // loop.play();
        });
    }
};


Game.set_title = function(data) {
    switch (data.game_mode) {
        case 'singleplayer':
            $('#title').html('Singleplayer Freecell');
            break;
        case 'time-attack':
            $('#title').html('Time Attack Faceoff');
            break;
        case 'turn-based':
            $('#title').html('Turn Based Faceoff');
            break;
    }
};



Game.get_card_info = function(card_id)
{

    if (card_id === null)
        return null;

    var names = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    var values = [1, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    var suits = ['clubs', 'spades', 'hearts', 'diamonds'];
    var colors = ['black', 'black', 'red', 'red'];


    return {
        id: card_id,
        selector: $('[location=card]#' + card_id),
        name: names[Math.floor((card_id - 1) / 4)] + " of " + suits[(card_id - 1)% 4],
        value: values[Math.floor((card_id - 1)/4)],
        suit: suits[(card_id - 1) % 4],
        color: colors[(card_id - 1) % 4],
        image: 'http://localhost:3000/images/' + card_id + '.png'
    };

};

//
Game.get_card_location = function() {

};


// returns an array of the cards that can be moved
Game.get_movable_cards = function() {
    var cards = [];

    // last slot of columns
    for (var i = 0; i < 8; i++)
    {
        var count = Game.tableau.stock[i].length;
        if (count === 0)
            continue;
        cards.push(Game.get_card_info(Game.tableau.stock[i][count - 1]));
    };

    // cards in freecell spaces
    for (i  = 0; i < 4; i++)
    {
        if (Game.tableau.freecells[i] === null)
            continue;
        cards.push(Game.get_card_info(Game.tableau.freecells[i]));
    }

    // cards moved to foundations CANNOT be moved

    return cards;
};

// returns an array of valid moves for a card
Game.get_valid_moves = function (card)
{
    if (card == null)
        return [];

    var moves = [];

    // stocks
    for (var i = 0; i < 8; i++)
    {
        var count = Game.tableau.stock[i].length;

        // if there is no cards in the column then its a valid move
        if (count === 0)
            moves.push({
                location: 'stock',
                id: i
            });
        else {
            var bottom_card = Game.get_card_info(Game.tableau.stock[i][count - 1]);

            // if the bottom card is 1 above and different suit its a valid move
            if ((bottom_card.value - 1 === card.value) && (bottom_card.color !== card.color))
                moves.push({
                    location: 'card',
                    id: bottom_card.id
                });
        }

    }

    // foundations
    for (i = 0; i < 4; i++)
    {
        var foundation_card = Game.get_card_info(Game.tableau.foundation[i]);
        // if there is no card in the foundation and its an Ace, its valid
        if (foundation_card == null) {
            if (card.value === 1)
                moves.push({
                    location: 'foundation',
                    id: i
                });

        // or if the card shares suit & is the next in sequence
        } else if ((foundation_card.suit === card.suit) && (foundation_card.value + 1 === card.value)) {
            moves.push({
                location: 'foundation',
                id: i
            });
        }
    }

    // freecells
    for (i = 0; i < 4; i++)
    {
        if (Game.tableau.freecells[i] === null)
            moves.push({
                location: 'freecell',
                id: i
            });
    }

    return moves;
};

Game.is_valid_move = function(moving_card, to_card) {
    var valid_moves = Game.get_valid_moves(moving_card);

    console.log(valid_moves, moving_card, to_card);

    // loop through moves possibilities
    for (var i  = 0; i < valid_moves.length; i++)
    {
        if (typeof to_card === "string")
        {
            if (to_card.substr(0, 3) === "col") {
                var column = parseInt(to_card.substr(3, 4));

                if (valid_moves[i].location === 'stock' && valid_moves[i].id === column)
                    return true;

            } else if (to_card.substr(0, 4) === "free") {
                var column = parseInt(to_card.substr(4, 5));

                if (valid_moves[i].location === "freecell" && valid_moves[i].id === column)
                    return true;
            } else if (to_card.substr(0, 4) === "suit") {
                var column = parseInt(to_card.substr(4, 5));

                if (valid_moves[i].location === "foundation" && valid_moves[i].id === column)
                    return true;
            }
        }
        else {

            if (valid_moves[i].location === "card" && valid_moves[i].id === to_card.id)
                return true;

        }
    }

    console.log("INVALID MOVE");

    return false;
};


Game.render = function()
{
    // step 1 of the rendering process is to create the card images

    var stock, column, card, freecell, foundation, i;

    if (Game.is_your_turn) {
        $('#game_turn_theirs').css('display', 'none');
        $('#game_turn_yours').css('display', 'block');
    } else {
        $('#game_turn_theirs').css('display', 'block');
        $('#game_turn_yours').css('display', 'none');
    }

    // render the columns
    for (i = 0; i < 8; i++) {
        stock = Game.tableau.stock[i];

        column = $('#col' + i);
        column.html('');

        for (var ii = 0; ii < stock.length; ii++) {

            card = Game.get_card_info(stock[ii]);

            $('<div></div>')
                .addClass('card')
                .attr('location', 'card')
                .attr('id', card.id)
                .css('top', (25 * ii) + 'px')
                .html('<img src="' + card.image + '" />')
                .appendTo(column);
        }

    }

    // render the freecells
    for (i = 0; i < 4; i++) {
        freecell = $('#free' + i);
        freecell.html('');

        if (Game.tableau.freecells[i] !== null)
        {
            card = Game.get_card_info(Game.tableau.freecells[i]);

            $('<div></div>')
                .addClass('card')
                .attr('location', 'card')
                .attr('id', card.id)
                .css('position', 'inherit')
                .html('<img src="' + card.image + '" />')
                .appendTo(freecell);
        }
    }

    // render the foundations
    for (i = 0; i < 4; i++) {
        foundation = $('#suit' + i);
        foundation.html('');

        if (Game.tableau.foundation[i] !== null)
        {
            card = Game.get_card_info(Game.tableau.foundation[i]);

            $('<div></div>')
                .addClass('card')
                .attr('location', 'card')
                .attr('id', card.id)
                .css('position', 'inherit')
                .html('<img src="' + card.image + '" />')
                .appendTo(foundation);
        }
    }

};

// creates a number of actions
Game.render_actions = function() {

    var cards = Game.get_movable_cards();

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];

        $('[location=card]#' + card.id)
            .on('click', Game.left_click_action)
            .on('dblclick', Game.double_click_action)
            .hover(
                function () {
                    if (Game.left_click_buffer !== parseInt(this.id.replace(/\D/g,'')))
                        $(this).addClass('highlight');
                },
                function () {
                    if (Game.left_click_buffer !== parseInt(this.id.replace(/\D/g,'')))
                        $(this).removeClass('highlight');
                }
            )


    }

    // make columns clickable, if they are empty
    for (var i = 0; i < 8; i++)
    {
        var count = Game.tableau.stock[i].length;
        if (count === 0) {
            $('#col' + i).on('click', Game.left_click_action);
        } else {
            $('#col' + i).off('click');
        }
    }

    // make freecells clickable, if they are empty
    for (var i = 0; i < 4; i++)
    {
        if (Game.tableau.freecells[i] === null) {
            $('#free' + i).on('click', Game.left_click_action);
        } else {
            $('#free' + i).off('click');
        }
    }

    // make foundations clickable, if they are empty
    for (var i = 0; i < 4; i++)
    {
        //if (Game.tableau.freecells[i] === null) {
            $('#suit' + i).on('click', Game.left_click_action);
        //} else {
        //}
    }

};

// Game.double_click_action = function(event) {
//     console.log('double click action');
//
//     var card = Game.get_card_info(parseInt(this.id));
//     var moves = Game.get_valid_moves(card);
//
//     var move = null;
//     for (var i = 0; i < moves.length; i++)
//     {
//         if (moves[i].location == 'foundation')
//         {
//             break;
//         }
//
//     }
//
//     // no double click moves found
//     if (move === null)
//         return;
// };

Game.right_click_action = function(event) {
    console.log('right click action');

};

Game.left_click_buffer = null;
Game.left_click_action = function(event) {
    console.log('left click action', this.getAttribute('location'), this.id, Game.left_click_buffer);
    var location = this.getAttribute('location');

    if (location === 'card') {

        var card_id = parseInt(this.id);
        var card = Game.get_card_info(card_id);

        // if there is no card currently selected, then select it.
        if (Game.left_click_buffer === null) {
            Game.left_click_buffer = card.id;

            card.selector.addClass('highlight');

        }
        // if the card is currently selected, unselect it on click
        else if (Game.left_click_buffer === card.id) {
            Game.left_click_buffer = null;

            card.selector.removeClass('highlight');

        }

        // otherwise the player is attempting to make a move
        else {
            var moving_card = Game.get_card_info(Game.left_click_buffer);

            if (Game.is_valid_move(moving_card, card)) {

                Game.move_cards(moving_card, card);
                Game.left_click_buffer = null;

            } else {

                Game.left_click_buffer = null;
                moving_card.selector.removeClass('highlight');

            }

        }

        return;
    }

    if (Game.left_click_buffer !== null) {


        var moving_card = Game.get_card_info(Game.left_click_buffer);

        // otherwise its a not a card move.
        if (Game.is_valid_move(moving_card, this.id)) {

            // you can't select an empty column, but you can move a card there

            Game.move_cards(moving_card, this.id);
            Game.left_click_buffer = null;

        } else {

            Game.left_click_buffer = null;
            moving_card.selector.removeClass('highlight');

        }
    }
};



Game.move_cards = function (moving_card, to_card) {
    var column;

    if (typeof to_card === "string")
    {
        if (to_card.substr(0, 3) === "col") {
            column = to_card.substr(3, 4);
            Game.pop_card(moving_card);
            Game.tableau.stock[column] = [ moving_card.id ];
        } else if (to_card.substr(0, 4) === "free") {
            column = to_card.substr(4, 5);
            Game.pop_card(moving_card);
            Game.tableau.freecells[column] = moving_card.id;
        } else if (to_card.substr(0, 4) === "suit") {
            column = to_card.substr(4, 5);
            Game.pop_card(moving_card);
            Game.tableau.foundation[column] = moving_card.id;
        }
    }
    else {
        Game.pop_card(moving_card);
        Game.push_card(moving_card, to_card);
    }

    Game.render();
    Game.render_actions();

    App.game.send_move(Game.tableau);
};

// removes a card from its current position
Game.pop_card = function (card)
{
    // check the bottoms of each column
    for (var i = 0; i < 8; i++)
    {
        var count = Game.tableau.stock[i].length;
        if (count === 0)
            continue;

        if (Game.tableau.stock[i][count - 1] === card.id) {
            Game.tableau.stock[i].pop();
            return true;
        }
    }

    // check to see if its in a freecell, if its not in a column
    for (i = 0; i < 4; i++) {
        if (Game.tableau.freecells[i] === card.id)
        {
            Game.tableau.freecells[i] = null;
            return true;
        }
    }

    alert("Card popping lookup failed");
    return false;
};

// push a card on top of another column
Game.push_card = function(moving_card, to_card) {

    // check the bottoms of each column
    for (var i = 0; i < 8; i++)
    {
        var count = Game.tableau.stock[i].length;
        if (count === 0)
            continue;

        if (Game.tableau.stock[i][count - 1] === to_card.id) {
            Game.tableau.stock[i].push(moving_card.id);
            return true;
        }
    }

};

Game.has_lost_game = function() {

    // check for no moves in stocks
    for (i = 0; i < 8; i++) {
        var count = Game.tableau.stock[i].length;
        if (count === 0)
            continue;

        if (Game.get_valid_moves(Game.get_card_info(Game.tableau.stock[i][count - 1])).length !== 0)
            return false;
    }

    // check for no moves in freecells
    for (i = 0; i < 4; i++) {
        if (Game.get_valid_moves(Game.get_card_info(Game.tableau.freecells[i])).length !== 0)
            return false;
    }

    return true;

};

Game.has_won_game = function() {

    for (var i = 0; i < 4; i++) {
        var card = Game.get_card_info(Game.tableau.foundation[i]);
        if (card === null || card.value !== 13) {
            return false;
        }
    }

    return true;
};