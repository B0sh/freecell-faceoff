class CreateUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :users do |t|
      t.string "username", :limit => 30
      t.string "password_digest"

      t.boolean "in_game", :default => false

      t.integer "games_lost"
      t.integer "games_won"
      t.integer "games_started"

      t.timestamps
    end

  end
end