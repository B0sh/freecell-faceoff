window.App ||= {}

App.init = ->

  # this code should be moved later probably
  # https://brandonhilkert.com/blog/organizing-javascript-in-rails-application-with-turbolinks/
  return unless $(".free_cell.play").length > 0

  App.game = App.cable.subscriptions.create "GameChannel",
    foundMatch: false

    connected: ->
      console.log "connected"
      console.log App.game.foundMatch
      $('#disconnected_bar').css('display', 'none');
      # Called when the subscription is ready for use on the server
      if !App.game.foundMatch
        $('#game_loading').css('display', 'block');
        Timer.start($('#wait_timer'));

    disconnected: ->
      # Called when the subscription has been terminated by the server
      console.log "disconnected"
      $('#disconnected_bar').css('display', 'block');

    received: (data) ->
      # Called when there's incoming data on the websocket for this channel
      console.log data

      switch data.action
        when "game_queueing"
          console.log "queue"

        when "game_move"
          if !App.game.foundMatch
            $('#game_loading').css('display', 'none');
            $('#game_window').css('display', 'block');

            App.game.foundMatch = true

            Timer.stop();

            App.game.enable_sound()

            console.log "start"

          Game.init(data)

        when "game_lost"
          Game.end_game(data)
          alert("Game Over")
        when "game_won"
          Game.end_game(data)
          alert("Game Won")

    send_move: (tableau) ->
      @perform "move", tableau: tableau

    send_forfeit: () ->
      @perform "forfeit", im: 'done'

    enable_sound: () ->
      $('#button_sound_off').css('display', 'block');
      $('#button_sound_on').css('display', 'none');
      Game.start_music();

    disable_sound: () ->
      $('#button_sound_on').css('display', 'block');
      $('#button_sound_off').css('display', 'none');
      Game.stop_music();



$(document).ready ->
  App.init()




