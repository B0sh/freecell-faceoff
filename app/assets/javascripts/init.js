(function() {
  window.App || (window.App = {});

  App.init = function() {
    // this code should be moved later probably
    // https://brandonhilkert.com/blog/organizing-javascript-in-rails-application-with-turbolinks/
    if (!($(".free_cell.play").length > 0)) {
      return;
    }
    return App.game = App.cable.subscriptions.create("GameChannel", {
      foundMatch: false,
      connected: function() {
        console.log("connected to GameChannel cable");

        $('#disconnected_bar').css('display', 'none');
        if (!App.game.foundMatch) {
          $('#game_loading').css('display', 'block');
          return Timer.start($('#wait_timer'));
        }
      },

      // Called when the subscription has been terminated by the server
      disconnected: function() {
        console.log("disconnected from GameChannel cable");
        return $('#disconnected_bar').css('display', 'block');
      },

      // Called when there's incoming data on the websocket for this channel
      received: function(data) {
        console.log("recieved: ", data);

        switch (data.action) {
          case "game_queueing":
            return console.log("queue");

          case "game_move":
            if (!App.game.foundMatch) {
              $('#game_loading').css('display', 'none');
              $('#game_window').css('display', 'block');
              App.game.foundMatch = true;
              // Timer.stop();
              App.game.enable_sound();
              console.log("start");
            }

            Game.sending_move = false;
            return Game.init(data);

          case "game_lost":
            Game.end_game(data);
            return;

          case "game_won":
            Game.end_game(data);
            return;
        }
      },
      send_move: function(tableau) {
        Game.sending_move = true;
        // setTimeout(() => {

        return this.perform("move", {
          tableau: tableau
        });
        // }, 1000)
      },
      send_forfeit: function() {
        if (Game.turn_number > 0) {
          return this.perform("forfeit", {
            im: 'done'
          });
        }
      },
      enable_sound: function() {
        $('#button_sound_off').css('display', 'block');
        $('#button_sound_on').css('display', 'none');
        return Game.start_music();
      },
      disable_sound: function() {
        $('#button_sound_on').css('display', 'block');
        $('#button_sound_off').css('display', 'none');
        return Game.stop_music();
      }
    });
  };

  $(document).ready(function() {
    return App.init();
  });

}).call(this);