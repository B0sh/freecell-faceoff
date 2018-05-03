# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180503201813) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "games", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "matches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "player1"
    t.integer "player2"
    t.text "game_data"
    t.string "game_mode"
    t.datetime "start_time"
    t.datetime "end_time"
    t.text "game_data_p2"
    t.string "end_type"
    t.integer "player_winner"
    t.integer "player_loser"
  end

  create_table "users", force: :cascade do |t|
    t.string "username", limit: 30
    t.string "password_digest"
    t.boolean "in_game", default: false
    t.integer "games_lost"
    t.integer "games_won"
    t.integer "games_started"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
