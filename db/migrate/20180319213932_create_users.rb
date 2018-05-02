class Users < ActiveRecord::Migration[5.1]
  def up
    create_table :users do |t|
      t.string "username", :limit => 30
      t.string "password"

      t.boolean "in_game", :default => false

      t.integer "games_lost"
      t.integer "games_won"
      t.integer "games_started"

      t.timestamps
    end

  end

  def down
    drop_table :users
  end
end