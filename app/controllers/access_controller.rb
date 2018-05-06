class AccessController < ApplicationController

  before_action :confirm_logged_in, :except => [:login, :register, :attempt_login, :logout]


  def options
    # if you submitted the options form
    if params[:options].present?
      volume = params[:options][:volume]
      @user.volume = volume
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
