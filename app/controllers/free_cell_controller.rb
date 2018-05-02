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
