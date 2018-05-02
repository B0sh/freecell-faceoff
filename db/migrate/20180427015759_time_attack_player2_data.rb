class TimeAttackPlayer2Data < ActiveRecord::Migration[5.1]
  def change
    add_column :matches, :game_data_p2, :text
  end
end
