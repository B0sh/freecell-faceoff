class WelcomeController < ApplicationController
  def index
    # single player games are out
    @matches = Match.where("end_time IS NULL AND game_mode != 'singleplayer'")

    if cookies.signed[:user_id].present?
      @user = User.find(cookies.signed[:user_id]) rescue nil

      # if your logged in user was deleted, reset the session
      if @user == nil
        cookies.signed[:user_id] = nil
      end
    end

  end

  def purge
    Match.delete_all
  end
end
