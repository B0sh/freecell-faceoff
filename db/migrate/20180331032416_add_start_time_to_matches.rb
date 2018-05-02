class AddStartTimeToMatches < ActiveRecord::Migration[5.1]
  def change
    add_column :matches, :start_time, :datetime
    add_column :matches, :end_time, :datetime
  end
end
