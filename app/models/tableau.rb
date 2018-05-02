class Tableau

  def initialize(args)
    if args[:create].present?
      @freecells = [nil, nil, nil, nil]
      @foundation = [nil, nil, nil, nil]
      @stock = deal()
    elsif args[:debug_win].present?
      @freecells = [nil, nil, nil, nil]
      @foundation =  [5, 11, 6, 12]
      # @foundation =  [6, 7, 5, 8]
      @stock = [[], [], [], [], [8], [7], [], []]
    elsif args[:debug_lose].present?
      @freecells = [5, 6, 7, 8]
      @foundation = [nil, nil, nil, nil]
      @stock = [[5], [5], [5], [5], [5], [5], [5, 24], []]
    else
      @freecells = args['freecells']
      @foundation = args['foundation']
      @stock = args['stock']
    end
  end

  def hashed
    return {
      freecells: @freecells,
      foundation: @foundation,
      stock: @stock
    }
  end

  # method returns true if the game has been won
  def has_won
    @foundation.each do |card_id|
      card = Card.new(card_id)
      if card.value.blank? or card.value != 13
        return false
      end
    end

    return true
  end

  # method returns false if the game has been lost
  def has_lost
    @stock.each  do |col|
      count = col.length
      if count != 0 and get_valid_moves(Card.new(col[count - 1])).length != 0
          return false
      end
    end

    @freecells.each  do |card_id|
      if get_valid_moves(Card.new(card_id)).length != 0
        return false
      end
    end

    return true
  end

  def get_valid_moves (card)
    moves = []

    @stock.each_with_index do |col, key|
      count = col.length
      # if there is no cards in the column, card can be moved there
      if col.length == 0
        moves.push({
            location: 'stock',
            id: key
        })
      else
        bottom_card = Card.new(col[count - 1])

        # if the bottom card of the col is 1 above and a different suit
        # the card can be moved under that card
        if bottom_card.value - 1 == card.value and bottom_card.color != card.color
          moves.push({
              location: 'card',
              id: bottom_card.id
          })
        end
      end
    end

    @foundation.each_with_index do |card_id, key|

      # if there is no card in the foundation and the card is an ace
      # it can start the foundation
      if card_id == nil
        if card.value == 1
          moves.push({
              location: 'foundation',
              id: key
          })
        end
      # if the card is next in the sequence it can be added to the foundation
      else
        foundation_card = Card.new(card_id)

        if foundation_card.suit == card.suit and foundation_card.value + 1 == card.value
          moves.push({
              location: 'foundation',
              id: key
          })
        end

      end
    end

    @freecells.each_with_index do |card_id, key|
      # if the free cell slot is empty, then any card can move there
      if card_id == nil
        moves.push({
            location: 'freecell',
            id: key
        })
      end
    end

    return moves
  end


  def deal
    # generate a deck of card id 1-52
    deck = []
    for i in 0..51
      deck.push(i+1)
    end

    # shuffle the deck
    deck = deck.shuffle

    # spread the deck on the stock
    stock = [[], [], [], [], [], [], [], []]
    for i in 0..51
      stock[i % 8].push(deck[i])
    end

   return stock
  end



end