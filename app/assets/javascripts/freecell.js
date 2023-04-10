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

// queue up moves here to be sent to the server
Game.move_queue = [];

// true when the move is being sent, and no new moves can be performed
Game.sending_move = false;

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
    console.log("Init turn #", data.turn_number)

    Game.tableau = data.tableau;
    Game.player = data.player;
    Game.turn_number = data.turn_number;

    Game.set_title(data);
    $('.opponent_name').html(data.opponent_name);
    $('#turn_number').html(data.turn_number);

    Game.render();
    Timer.stop();

    if (data.start_time !== 0)
        Timer.start($('#game_timer'), data.start_time);

    Game.initMouseEvents();

    Game.dragging = false;
    Game.autoStacking = false;

};

Game.initMouseEvents = function () {
    if (!Game.initializedMouseEvents) {
        document.querySelector('#table').addEventListener("mousedown", Game.mousedown.bind(Game));
        document.querySelector('#table').addEventListener("contextmenu", Game.contextmenu.bind(Game));
        document.querySelector('#table').addEventListener("dblclick", Game.contextmenu.bind(Game));

        document.addEventListener("mouseup", Game.mouseup.bind(Game));
        document.addEventListener("dragstart", Game.dragstart.bind(Game));		
        document.addEventListener("dragenter", Game.dragenter.bind(Game));
        document.addEventListener("dragover", Game.dragover.bind(Game));
        document.addEventListener("dragend", Game.dragend.bind(Game));
        Game.initializedMouseEvents = true;
    }
};

    Game.contextmenu = function(e) {
        e.preventDefault();

		const targetCard = e.target.closest(".card");

		if (targetCard && targetCard.id) {
            Game.auto_move(parseInt(targetCard.id));
        }
    }
 
	Game.mousedown = function(e) {
        // console.log("mousedown", e);
		
		const targetCard = e.target.closest(".card");
		
		if (targetCard && targetCard.id) {
            const movableCards = Game.get_movable_cards();
            const cardId = parseInt(targetCard.id);
			var card = Game.get_card_info(cardId);

            if (movableCards.find((x) => x.id == card.id)) {
                card.checked = false;

                card.origin = {
                    x: e.pageX,
                    y: e.pageY,
                };

                card.el.classList.add("dragging");

                Game.activeCard = card;
            }
            else {
                e.preventDefault();
                console.log("CANNOT MOVE")
            }
		}			
	};

	Game.dragstart = function(e) {
        // console.log("dragstart", e);

        if (Game.activeCard) {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/html', '');

            // Create blank image to hide the ghost
            var dragIcon = document.createElement('img');
            e.dataTransfer.setDragImage(dragIcon, -10, -10);	

            Game.dragging = true;
        }
	};

	
	Game.dragenter = function(e) {
        // console.log("dragenter", e.target);

		var t = e.target;

		if (Game.activeColumn) {
			Game.activeColumn.classList.remove("over");
		}

        Game.dragenterELEM = null;
		if (t.classList.contains("column") || t.classList.contains("suit") || t.classList.contains("free") || t.classList.contains("card")) {
			if (t.classList.contains('card')) {
				Game.activeColumn = t.parentNode;
			}
            else {
				Game.activeColumn = t;
			}

			Game.activeColumn.classList.add("over");

		}

            Game.dragenterELEM = e.target;
	};

	Game.dragover = function(e) {
        // console.log("dragover", e);

		e.preventDefault();
		e.dataTransfer.dropEffect = 'over';

		// Physically drag the card instead of using the D&D ghost
		if (Game.activeCard && Game.dragging) {
			var c = Game.activeCard;
			var x = e.pageX - c.origin.x;
			var y = e.pageY - c.origin.y;

			Game.activeCard.el.style.setProperty('transform', "rotateX(0deg) translate3d("+x+"px, "+y+"px, 0px)");
			Game.activeCard.el.style.setProperty('pointer-events','none');
		}			
	};

	Game.dragend = function(e) {
        // console.log("dragend", e);

		if (Game.activeCard && Game.dragging && Game.dragenterELEM) {

			var c = Game.activeCard;
			c.el.classList.remove("dragging");
			c.el.style.setProperty('transform', '');
			c.el.style.setProperty('pointer-events', '');

			if (Game.activeColumn) {
				Game.activeColumn.classList.remove("over");
			}			

            let location = Game.dragenterELEM.getAttribute('location');
            let toId = Game.dragenterELEM.getAttribute('id');
            
            if (location == 'column') {
                var column = Game.tableau.stock[parseInt(toId.substr(3, 4))];
                if (column.length > 0) {
                    location = 'card';

                    toId = column[column.length - 1];
                }
                
            }

            if (location == 'card') {
                const toCardId = parseInt(toId);
                const toCard = Game.get_card_info(toCardId);

                const fromCard = c;

                if (Game.is_valid_move(fromCard, toCard)) 
                {
                    console.log("Moving cards", fromCard, toCardId, toCard)
                    Game.move_cards(fromCard, toCard);
                }
            }

            if (location == 'column' || location == 'freecell' || location == 'foundation') {
                const toCardId = toId;

                const fromCard = c;

                if (Game.is_valid_move(fromCard, toCardId)) 
                {
                    console.log("Moving cards", fromCard, toCardId, false)
                    Game.move_cards(fromCard, toCardId);
                }

            }
		}
	};

	Game.mouseup = function(e) {
        // console.log("mouseup", e);

		if (Game.activeCard) {
			Game.activeCard.el.classList.remove("dragging");
			Game.activeCard = false;
		}
        Game.dragging = false;
	};




Game.end_game = function(data) {
    console.log(data);
    Timer.set_static_time(data.end_time - data.start_time);
    Timer.stop();

    if (data.action === "game_lost") {
        if (data.end_type == 'forfeit') {
            Game.play_sfx('/ding04.mp3');
        }
        else {
            Game.play_sfx('/shock3.mp3');
        }
        $('#game_over_bar').css('display', 'block');
    }
    else if (data.action === "game_won") {
        Game.play_sfx('/ice-pen.mp3');
        $('#game_won_bar').css('display', 'block');
    }

    if (data.end_type === "forfeit") {
        $('.forfeit_text').css('display', 'block');
    }
    else if (data.end_type === "played") {
        $('.played_text').css('display', 'block');
    }

    $('.' + data.game_mode + '_text').css('display', 'block');

    // remove the click actions
    Game.render();
};


Game.music_active = false;
Game.loop = new Howl({
    src: ['/ff.mp3', '/ff.wav'],
    loop: true
})

Game.start_music = function() {
    Game.loop.play();
};

Game.stop_music = function() {
    Game.loop.stop();
};

Game.play_sfx = function (url) {
    Game.loop.fade(1, 0, 300);
    setTimeout(() => {
        var sfx = new Howl({
            src: [url],
            autoplay: true,
            onend: function () {
                Game.loop.fade(0, 1, 500);
            }
        });
    }, 100);

}

Game.set_title = function(data) {
    switch (data.game_mode) {
        case 'singleplayer':
            $('#title').html('Singleplayer Freecell');
            break;
        case 'time-attack':
            $('#title').html('Time Attack Faceoff');
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

    if (skin == 'golden')
        var image = '/images/golden/' + card_id + '.png';
    else
        var image = '/images/' + card_id + '.png';

    return {
        id: card_id,
        el: document.querySelector(`[id='${card_id}']`),
        selector: $('[location=card]#' + card_id),
        name: names[Math.floor((card_id - 1) / 4)] + " of " + suits[(card_id - 1)% 4],
        value: values[Math.floor((card_id - 1)/4)],
        suit: suits[(card_id - 1) % 4],
        color: colors[(card_id - 1) % 4],
        image: image
    };

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

    return cards;
};

// returns an array of valid moves for a card
Game.get_valid_moves = function (card)
{
    if (card == null)
        return [];

    var moves = [];

    // If the card is not at the bottom of a column or freecell then you can't move it in the first place
    const isBottomOfColumn = !!Game.tableau.stock.find((x) => x[x.length - 1] == card.id);
    const isInFreeCells = !!Game.tableau.freecells.find((x) => x == card.id);
    if (!isBottomOfColumn && !isInFreeCells) {
        return [];
    }

    // stocks
    for (var i = 0; i < 8; i++)
    {
        var count = Game.tableau.stock[i].length;

        // if there is no cards in the column then its a valid move
        if (count === 0) {
            moves.push({
                location: 'stock',
                id: i
            });
        }
        else {
            var bottom_card = Game.get_card_info(Game.tableau.stock[i][count - 1]);

            // if the bottom card is 1 above and different suit its a valid move
            if ((bottom_card.value - 1 === card.value) && (bottom_card.color !== card.color)) {
                moves.push({
                    location: 'card',
                    id: bottom_card.id
                });
            }
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

    // console.log(valid_moves, moving_card, to_card);

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
                .attr('draggable', true)
                .css('background-image', `url('${card.image}')`)
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
                .attr('draggable', true)
                .css('background-image', `url('${card.image}')`)
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
                .attr('draggable', false)
                .css('background-image', `url('${card.image}')`)
                .appendTo(foundation);
        }
    }

};

Game.auto_move = function (card_id) {
    var card = Game.get_card_info(card_id);
    var moves = Game.get_valid_moves(card);

    for (var i = 0; i < moves.length; i++)
    {
        if (moves[i].location === 'foundation')
        {
            Game.move_cards(card, 'suit' + moves[i].id);
            return true;
        }

    }

    // Don't auto move freecells around inside of the freecells
    const isInFreeCells = !!Game.tableau.freecells.find((x) => x == card.id);
    if (isInFreeCells) {
        return false;
    }

    for (var i = 0; i < moves.length; i++)
    {
        if (moves[i].location === 'freecell')
        {
            Game.move_cards(card, 'free' + moves[i].id);
            return true;
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
