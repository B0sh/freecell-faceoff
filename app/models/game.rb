class Game < ApplicationRecord

  def setup

    # randomly choose between x and o for players
    if @match.game_data.blank?
      turn = ["1", "2"].sample

      # board data
      game_data = {
        turn: turn,
        turn_number: 0,
        tableau: Tableau.new({ :create => true }).hashed
        # tableau: Tableau.new({ :debug_win => true }).hashed
        # tableau: Tableau.new({ :debug_lose => true }).hashed
      }

      # save the board
      @match.game_data = game_data.to_json
      @game = JSON.parse(@match.game_data)

      if @match.game_mode == "time-attack"
        @match.game_data_p2 = game_data.to_json
        @game_1 = @game
        @game_2 = JSON.parse(@match.game_data)
      end

      @match.save
    end

    # tell people about the game
    send_info(nil)

  end


end
