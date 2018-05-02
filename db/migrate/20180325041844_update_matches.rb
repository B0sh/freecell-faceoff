class UpdateMatches < ActiveRecord::Migration[5.1]
  def change
    add_column :matches, :player1, :string
    add_column :matches, :player2, :string
    add_column :matches, :game_data, :text
  end
end
