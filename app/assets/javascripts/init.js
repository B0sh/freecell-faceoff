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
        console.log("connected");
        console.log(App.game.foundMatch);
        $('#disconnected_bar').css('display', 'none');
        if (!App.game.foundMatch) {
          $('#game_loading').css('display', 'block');
          return Timer.start($('#wait_timer'));
        }
      },
      disconnected: function() {
        // Called when the subscription has been terminated by the server
        console.log("disconnected");
        return $('#disconnected_bar').css('display', 'block');
      },
      received: function(data) {
        // Called when there's incoming data on the websocket for this channel
        console.log(data);
        switch (data.action) {
          case "game_queueing":
            return console.log("queue");
          case "game_move":
            if (!App.game.foundMatch) {
              $('#game_loading').css('display', 'none');
              $('#game_window').css('display', 'block');
              App.game.foundMatch = true;
              Timer.stop();
              App.game.enable_sound();
              console.log("start");
            }
            Game.sending_move = false;
            return Game.init(data);
          case "game_lost":
            Game.end_game(data);
            return alert("Game Over");
          case "game_won":
            Game.end_game(data);
            return alert("Game Won");
        }
      },
      send_move: function(tableau) {
        Game.sending_move = true;
        return this.perform("move", {
          tableau: tableau
        });
      },
      send_forfeit: function() {
        return this.perform("forfeit", {
          im: 'done'
        });
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