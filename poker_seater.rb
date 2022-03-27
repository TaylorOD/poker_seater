# welcome message and creating arrays and index

puts "Welcome to Poker Seat Randomizer!"
puts "Please enter the names of the players one at a time: (enter 'done' when finished)"

poker_players_names = []
poker_players = []

index = 1

# code to process name inputs and add them to poker_players_names, code to add a number to poker_players for each name that is added, allows users to end before 10

while index <= 20
  input = gets.chomp
  if input.downcase == "done"
    break
  end
  poker_players_names << input
  poker_players << index
  index = index + 1
end

index_two = 0

# displays the poker players and a table number for them to sit at
if poker_players.length() > 10 && poker_players_names.length() > 10
  poker_players_names_two = []
  poker_players_two = []

  puts "--------"
  shuffled_names = poker_players_names.shuffle
  length = shuffled_names.length() / 2
  while index_two < length
    poker_players_names_two << shuffled_names.pop()
    index_two += 1
  end
  
  # p shuffled_names
  # p shuffled_names.pop()
  # p shuffled_names
  index_two = 1
  while index_two <= poker_players.length() / 2
    poker_players_two << index_two
    index_two += 1
  end
  poker_players = poker_players.slice(0, poker_players.length() / 2)

  puts "--------"
  puts "Table One: Players below:"
  puts "--------"
  p shuffled_names
  puts "Table One: Seat number:"
  p poker_players
  
  puts "--------"
  puts "Table Two: Players below:"
  puts "--------"
  p poker_players_names_two
  puts "Table Two: Seat number:"
  p poker_players_two
  
  puts "--------"
  puts "Shuffle em and deal!"
else 
  puts "--------"
  puts "See the players below:"
  p poker_players_names.shuffle
  puts "--------"
  puts "Their seat number:"
  p poker_players
  puts "--------"
  puts "Shuffle em and deal!"
end