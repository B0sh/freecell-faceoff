class FreeCellController < ApplicationController
  before_action :confirm_logged_in

  def play
    @params = params
    @user = User.find_by_id(cookies.signed[:user_id])

    if params[:id].present?
      @match = Match.find_by_id(params[:id])

      if @match.present?
        if @match.player1 == @user.id
          flash[:notice] = "You cannot join your own game"
          redirect_to :controller => 'welcome', :action => 'index'
        else
          @match.player2 = cookies.signed[:user_id]
          @match.save
        end
      end
    end
  end

  def create
    @params = params
    @user = User.find_by_id(cookies.signed[:user_id])

    if params[:game_mode]
      Match.create(@user.id, params[:game_mode])

      redirect_to :controller => 'free_cell', :action => 'play'
    end

  end

  def history
    @matches = Match.where("end_time IS NOT NULL AND (player1=? OR player2=?)", @user.id.to_i, @user.id.to_i).order(end_time: :desc).limit(10)

    @totals = {}
    @totals["singleplayer_wins"] = 0
    @totals["singleplayer_losses"] = 0
    @totals["time-attack_wins"] = 0
    @totals["time-attack_losses"] = 0
    @totals["turn-based_wins"] = 0
    @totals["turn-based_losses"] = 0

    @matches.each do |m|
      if m.player_winner == @user.id
        @totals[m.game_mode + "_wins"] += 1
      else
        @totals[m.game_mode + "_losses"] += 1
      end
    end
  end

  def cancel
    # remove your match
    if @current_match.present?
      @current_match.delete
    end
    flash[:notice] = "You have forfeited your current match."
    redirect_to :controller => 'welcome', :action => 'index'
  end

  private

  def confirm_logged_in
    unless cookies.signed[:user_id]
      flash[:notice] = "Please login in."
      redirect_to(access_login_path)
    end
  end

end
