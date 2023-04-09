class GameChannel < ApplicationCable::Channel

  def subscribed
    stream_from "player_#{current_user.id}"

    match = Match.where("end_time IS NULL and (player1 = ? OR player2 = ?)", current_user.id, current_user.id).first

    if match.blank?
      waiting_match = Match.create(current_user.id)
      REDIS.set("game_for:#{current_user.id}", waiting_match.id)
    else
      # at this point both players are connected
      REDIS.set("game_for:#{current_user.id}", match.id)

      if match.game_mode == 'singleplayer'
        game = Singleplayer.new(match)
      elsif match.game_mode == 'time-attack'
        game = TimeAttack.new(match)
      end

      game.setup()
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    Match.remove(current_user.id)
  end

  def move (data)
    puts "\n\nTIME TO MOVE\n\n"

    data['current_user'] = current_user

    match_id = REDIS.get("game_for:#{current_user.id}")
    match = Match.find_by_id(match_id)

    if match.game_mode == 'singleplayer'
      game = Singleplayer.new(match)
    elsif match.game_mode == 'time-attack'
      game = TimeAttack.new(match)
    end

    if game.can_move
      game.move(data)
      game.send_info(current_user)
    end

  end

  def forfeit (data)
    data['current_user'] = current_user

    match_id = REDIS.get("game_for:#{current_user.id}")
    match = Match.find_by_id(match_id)

    if match.game_mode == 'singleplayer'
      game = Singleplayer.new(match)
    elsif match.game_mode == 'time-attack'
      game = TimeAttack.new(match)
    end

    if game.can_move
      game.forfeit(current_user)
    end

  end

end
