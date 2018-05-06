class AddOptionsToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :volume, :integer, default: 40
  end
end
