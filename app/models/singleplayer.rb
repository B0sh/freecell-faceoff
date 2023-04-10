class Singleplayer < Game

  def initialize(match)
    @match = match
    if @match.game_data.present?
      @game = JSON.parse(@match.game_data)
    end
  end

  def can_move
    tableau = Tableau.new(@game['tableau'])
    if tableau.has_won or tableau.has_lost or @match.end_type.present?
      return false
    end
    return true
  end

  def forfeit(current_user)
    @match.player_winner = nil
    @match.player_loser = @match.player1.to_i

    @match.end_type = "forfeit"
    @match.end_time = Time.current

    @match.save

    send_info(current_user)
  end

  def end_game
    tableau = Tableau.new(@game['tableau'])
    if tableau.has_won
      @match.player_winner = @match.player1
      @match.player_loser = nil
    elsif tableau.has_lost
      @match.player_loser = @match.player1
      @match.player_winner = nil
    end
    @match.end_type = "played"
    @match.end_time = Time.current
  end

  def send_info(current_user)
    tableau = Tableau.new(@game['tableau'])

    if tableau.has_won
      action = 'game_won'
    elsif tableau.has_lost or @match.end_type == "forfeit"
      action = 'game_lost'
    else
      action = 'game_move'
    end

    ActionCable.server.broadcast "player_#{@match.player1}",
                                 action: action,
                                 game_mode: @match.game_mode,
                                 start_time: @match.start_time.to_f,
                                 end_time: @match.end_time.to_f,
                                 end_type: @match.end_type,
                                 turn: @game['turn'],
                                 turn_number: @game['turn_number'],
                                 tableau: @game['tableau']
  end

  def move(data)
    # set the start time as the first move is made
    if @game['turn_number'] == 0 and @match.start_time.blank?
      @match.start_time = Time.current
    end

    @game['turn_number'] = @game['turn_number'] + 1
    @game['tableau'] = data['tableau']

    @match.game_data = @game.to_json

    if !can_move()
      end_game()
    end

    @match.save
  end
end