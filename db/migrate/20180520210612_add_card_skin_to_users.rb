class AddCardSkinToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :card_skin, :string, default: "normal"
  end
end
