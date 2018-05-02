class AddGameModeToMatches < ActiveRecord::Migration[5.1]
  def change
    add_column :matches, :game_mode, :string
  end
end

