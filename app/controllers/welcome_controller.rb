class WelcomeController < ApplicationController
  def index
    # single player games are out
    @matches = Match.where("end_time IS NULL and game_mode != 'singleplayer'")

    if cookies.signed[:user_id].present?
      @user = User.find(cookies.signed[:user_id])
    end

  end

  def purge
    Match.delete_all
  end
end
