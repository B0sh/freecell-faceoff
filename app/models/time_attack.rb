class TimeAttack < Game

  def initialize(match)
    @match = match
    if @match.game_data.present?
      @game_1 = JSON.parse(@match.game_data)
      @game_2 = JSON.parse(@match.game_data_p2)
    end
  end

  def can_move
    tableau_player1 = Tableau.new(@game_1['tableau'])
    tableau_player2 = Tableau.new(@game_2['tableau'])

    if @match.end_type == "forfeit" or tableau_player1.has_won or tableau_player1.has_lost or tableau_player2.has_won or tableau_player2.has_lost
      return false
    else
      return true
    end
  end

  def forfeit(current_user)
    if current_user.id.to_i == @match.player1.to_i
      @match.player_winner = @match.player2.to_i
      @match.player_loser = @match.player1.to_i
    elsif current_user.id.to_i == @match.player2.to_i
      @match.player_winner = @match.player1.to_i
      @match.player_loser = @match.player2.to_i
    end

    @match.end_type = "forfeit"
    @match.end_time = Time.current

    @match.save

    send_info(current_user)
  end


  def end_game
    tableau_player1 = Tableau.new(@game_1['tableau'])
    tableau_player2 = Tableau.new(@game_2['tableau'])

    if tableau_player1.has_won
      @match.player_winner = @match.player1
      @match.player_loser = @match.player2
    elsif tableau_player1.has_lost
      @match.player_loser = @match.player1
      @match.player_winner = @match.player2
    elsif tableau_player2.has_won
      @match.player_loser = @match.player1
      @match.player_winner = @match.player2
    elsif tableau_player2.has_lost
      @match.player_winner = @match.player1
      @match.player_loser = @match.player2
    end
    @match.end_type = "played"
    @match.end_time = Time.current
  end


  def send_info(current_user)

    # waiting for a player to queue
    if @game_1['turn_number'] == 0 && @match.player2.blank?
      ActionCable.server.broadcast "player_#{@match.player1}",
                                   action: "game_queueing",
                                   game_mode: @match.game_mode,
                                   start_time: @match.start_time.to_f,
                                   player: "1"
    # player found send board data
    else

      player1 = User.find_by_id(@match.player1)
      player1_name = player1.username
      player2 = User.find_by_id(@match.player2)
      player2_name = player2.username

      tableau_player1 = Tableau.new(@game_1['tableau'])
      tableau_player2 = Tableau.new(@game_2['tableau'])

      action_1 = 'game_move'
      action_2 = 'game_move'


      if tableau_player1.has_won
        action_1 = 'game_won'
        action_2 = 'game_lost'
        current_user = nil
      elsif tableau_player1.has_lost
        action_1 = 'game_lost'
        action_2 = 'game_won'
        current_user = nil
      elsif tableau_player2.has_won
        action_1 = 'game_lost'
        action_2 = 'game_won'
        current_user = nil
      elsif tableau_player2.has_lost
        action_1 = 'game_won'
        action_2 = 'game_lost'
        current_user = nil
      elsif @match.end_type == "forfeit"
        if @match.player_winner == @match.player1.to_i
          action_1 = 'game_won'
          action_2 = 'game_lost'
        else
          action_1 = 'game_lost'
          action_2 = 'game_won'
        end
        current_user = nil
      end

      if current_user == nil or current_user.id.to_i == @match.player1.to_i
        ActionCable.server.broadcast "player_#{@match.player1}",
                                     action: action_1,
                                     game_mode: @match.game_mode,
                                     opponent_name: player2_name,
                                     start_time: @match.start_time.to_f,
                                     end_time: @match.end_time.to_f,
                                     end_type: @match.end_type,
                                     player: "1",
                                     turn: "1",
                                     turn_number: @game_1['turn_number'],
                                     tableau: @game_1['tableau']
      end

      if current_user == nil or current_user.id.to_i == @match.player2.to_i
        ActionCable.server.broadcast "player_#{@match.player2}",
                                     action: action_2,
                                     game_mode: @match.game_mode,
                                     opponent_name: player1_name,
                                     start_time: @match.start_time.to_f,
                                     end_time: @match.end_time.to_f,
                                     end_type: @match.end_type,
                                     player: "2",
                                     turn: "2",
                                     turn_number: @game_2['turn_number'],
                                     tableau: @game_2['tableau']
      end
    end
  end

  def move(data)
    if @match.player2.to_i == data['current_user'].id.to_i
      game = @game_2
    else
      game = @game_2
    end

    game['tableau'] = data['tableau']

    # set the start time as the first move is made
    if game['turn_number'] == 0 and @match.start_time.blank?
      @match.start_time = Time.current
    end

    game['turn_number'] = game['turn_number'] + 1

    if @match.player2.to_i == data['current_user'].id.to_i
      @match.game_data_p2 = game.to_json
      @game_2 = game
    else
      @match.game_data = game.to_json
      @game_1 = game
    end

    if !can_move()
      end_game()
    end

    @match.save
  end
end