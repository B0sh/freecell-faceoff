class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  before_action :setup_user

  private

  def setup_user
    @user = User.where(:id => cookies.signed[:user_id]).first

    if @user.present?
      @current_match = Match.where("end_time IS NULL AND (player1=? OR player2=?)", @user.id.to_i, @user.id.to_i).first


    end

  end

end
