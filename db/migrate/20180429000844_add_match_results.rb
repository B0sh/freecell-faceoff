class AddMatchResults < ActiveRecord::Migration[5.1]
  def change
    add_column :matches, :end_type, :string
    add_column :matches, :player_winner, :integer
    add_column :matches, :player_loser, :integer
  end
end
