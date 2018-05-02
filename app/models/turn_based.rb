class TurnBased < Game

  def initialize(match)
    @match = match
    if @match.game_data.present?
      @game = JSON.parse(@match.game_data)
    end
  end

  def can_move
    tableau = Tableau.new(@game['tableau'])
    if @match.end_type == "forfeit" or tableau.has_won or tableau.has_lost
      return false
    end
    return true
  end

  def forfeit(current_user)
    if current_user.id.to_i == @match.player1.to_i
      @match.player_winner = @match.player2
      @match.player_loser = @match.player1
    elsif current_user.id.to_i == @match.player2.to_i
      @match.player_winner = @match.player1
      @match.player_loser = @match.player2
    end

    @match.end_type = "forfeit"
    @match.end_time = Time.current

    @match.save

    send_info(current_user)
  end

  def end_game
    tableau = Tableau.new(@game['tableau'])

    if tableau.has_won and @game['turn'] == "1"
      @match.player_loser = @match.player1.to_i
      @match.player_winner = @match.player2.to_i
    elsif tableau.has_won and @game['turn'] == "2"
      @match.player_winner = @match.player1.to_i
      @match.player_loser = @match.player2.to_i
    elsif tableau.has_lost and @game['turn'] == "1"
      @match.player_winner = @match.player1.to_i
      @match.player_loser = @match.player2.to_i
    elsif tableau.has_lost and @game['turn'] == "2"
      @match.player_loser = @match.player1.to_i
      @match.player_winner = @match.player2.to_i
    end
    @match.end_type = "played"
    @match.end_time = Time.current
  end

  def send_info(current_user)
    # waiting for a player to queue
    if @game['turn_number'] == 0 && @match.player2.blank?
      ActionCable.server.broadcast "player_#{@match.player1}",
                                   action: "game_queueing",
                                   game_mode: @match.game_mode,
                                   start_time: @match.start_time.to_f,
                                   player: "1"
    # player found send board data
    else
      tableau = Tableau.new(@game['tableau'])

      action_1 = 'game_move'
      action_2 = 'game_move'

      if tableau.has_won and @game['turn'] == "1"
        action_1 = 'game_lost'
        action_2 = 'game_won'
      elsif tableau.has_won and @game['turn'] == "2"
        action_1 = 'game_won'
        action_2 = 'game_lost'
      elsif tableau.has_lost and @game['turn'] == "1"
        action_1 = 'game_won'
        action_2 = 'game_lost'
      elsif tableau.has_lost and @game['turn'] == "2"
        action_1 = 'game_lost'
        action_2 = 'game_won'
      elsif @match.end_type == "forfeit"
        if @match.player_winner == @match.player1.to_i
          action_1 = 'game_won'
          action_2 = 'game_lost'
        else
          action_1 = 'game_lost'
          action_2 = 'game_won'
        end
      end

      player1 = User.find_by_id(@match.player1)
      player1_name = player1.username
      player2 = User.find_by_id(@match.player2)
      player2_name = player2.username

      ActionCable.server.broadcast "player_#{@match.player1}",
                                   action: action_1,
                                   game_mode: @match.game_mode,
                                   opponent_name: player2_name,
                                   start_time: @match.start_time.to_f,
                                   end_time: @match.end_time.to_f,
                                   end_type: @match.end_type,
                                   player: "1",
                                   turn: @game['turn'],
                                   turn_number: @game['turn_number'],
                                   tableau: @game['tableau']

      ActionCable.server.broadcast "player_#{@match.player2}",
                                   action: action_2,
                                   game_mode: @match.game_mode,
                                   opponent_name: player1_name,
                                   start_time: @match.start_time.to_f,
                                   end_time: @match.end_time.to_f,
                                   end_type: @match.end_type,
                                   player: "2",
                                   turn: @game['turn'],
                                   turn_number: @game['turn_number'],
                                   tableau: @game['tableau']
    end
  end

  def move(data)
    @game = JSON.parse(@match.game_data)
    @game['tableau'] = data['tableau']

    # swap turns, if its turn based
    if @game['turn'] == "1"
      @game['turn'] = "2"
    else
      @game['turn'] = "1"
    end

    # set the start time as the first move is made
    if @game['turn_number'] == 0 and @match.start_time.blank?
      @match.start_time = Time.current
    end

    @game['turn_number'] = @game['turn_number'] + 1

    @match.game_data = @game.to_json

    if !can_move()
      end_game()
    end

    @match.save
  end
end