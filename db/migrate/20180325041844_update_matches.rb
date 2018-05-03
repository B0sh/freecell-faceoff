class UpdateMatches < ActiveRecord::Migration[5.1]
  def change
    add_column :matches, :player1, :integer
    add_column :matches, :player2, :integer
    add_column :matches, :game_data, :text
    add_column :matches, :game_mode, :string
  end
end
