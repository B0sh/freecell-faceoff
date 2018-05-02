class Card

  def initialize (card_id)
    if card_id == nil
      return false
    end

    names = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    values = [1, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    suits = ['clubs', 'spades', 'hearts', 'diamonds']
    colors = ['black', 'black', 'red', 'red']


    @id = card_id.to_i
    @name = names[((@id - 1) / 4).floor] + " of " + suits[(@id - 1) % 4]
    @value = values[((@id - 1) / 4).floor]
    @suit = suits[(@id - 1) % 4]
    @color = colors[(@id - 1) % 4]
  end

  def id
    @id
  end

  def name
    @name
  end

  def value
    @value
  end

  def suit
    @suit
  end

  def color
    @color
  end

end