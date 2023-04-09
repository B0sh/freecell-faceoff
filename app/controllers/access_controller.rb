class AccessController < ApplicationController

  before_action :confirm_logged_in, :except => [:login, :register, :attempt_login, :logout]

  def options
    @unlock_golden_wins = 3

    @totals = {}
    @totals["singleplayer_wins"] = 0
    @totals["singleplayer_losses"] = 0
    @totals["time-attack_wins"] = 0
    @totals["time-attack_losses"] = 0

    @matches = Match.where("end_time IS NOT NULL AND (player1=? OR player2=?)", @user.id.to_i, @user.id.to_i).order(end_time: :desc)

    @matches.each do |m|
      if m.player_winner == @user.id
        @totals[m.game_mode + "_wins"] += 1
      else
        @totals[m.game_mode + "_losses"] += 1
      end
    end

    # if you submitted the options form
    if params[:options].present?
      volume = params[:options][:volume]
      skin = params[:options][:skin]

      if skin == "golden" and @totals["singleplayer_wins"] < @unlock_golden_wins
        skin = "normal"
      end

      @user.volume = volume
      @user.card_skin = skin
      @user.save
      flash.now[:notice] = "Your settings have been adjusted to your specifications, good sir."
    end
  end

  def login
    # display login form
  end

  def register
    # if you have submitted the register form
    #
    if params[:username].present? && params[:password].present?
      username = params[:username]
      password = params[:password]

      check_user = User.where(:username => username).first

      if check_user
        flash.now[:notice] = "A user with this username already exists."
      else
        new_user = User.create(:username => username, :password => password)

        cookies.signed[:user_id] = new_user.id

        if params[:password].size < 5
          flash[:notice] = "That's a shitty password, but whatever... Account created."
        else
          flash[:notice] = "Account created."
        end

        redirect_to(root_path)

      end

    end


  end

  def attempt_login
    if params[:username].present? && params[:password].present?
      found_user = User.where(:username => params[:username]).first

      if found_user
        authorized_user = found_user.authenticate(params[:password])

      end
    end

    if authorized_user
      cookies.signed[:user_id] = authorized_user.id
      flash[:notice] = "You are now logged in."
      redirect_to(root_path)
    else
      flash.now[:notice] = "Invalid username/password combination"
      render('login')
    end
  end

  def logout
    cookies.signed[:user_id] = nil
    flash[:notice] = "Logged out"
    redirect_to(access_login_path)

  end



  private

  def confirm_logged_in
    unless cookies.signed[:user_id]
      flash[:notice] = "Please login in."
      redirect_to(access_login_path)
    end
  end

end
