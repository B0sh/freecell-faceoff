class Match < ApplicationRecord

  def self.create(uuid, game_mode)

    has_match = Match.where("end_time IS NULL and (player1 = ? OR player2 = ?)", uuid, uuid).first

    if has_match.present?
      # puts "\n\n\n You have a match already \n\n\n"

      return has_match
    else
      # puts "\n\n\n Match for #{uuid} was created \n\n\n"

      match = Match.new
      match.game_mode = game_mode
      match.player1 = uuid
      match.player2 = nil
      match.save

      return match

    end

  end

  def self.forefit

  end

  def self.remove(uuid)

    # Needs to be more robust to prevent connection loss.
    match = Match.where("end_time IS NULL and (player1 = ? OR player2 = ?)", uuid, uuid).first

    # puts uuid
    # puts match.player1
    # puts match.player2

    if match.present?
      # match.destroy
    end

    # if match.blank?
    #
    # elsif match.player1 == uuid && match.player2.blank?
    #
    #
    #   Match.delete(match.id)
    # end

  end

end
