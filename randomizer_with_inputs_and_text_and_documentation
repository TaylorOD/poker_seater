# welcome message and creating arrays and index

puts "Welcome to Poker Seat Randomizer!"
puts "Please enter the names of the players one at a time: (enter 'done' when finished)"

poker_players_names = []
poker_players = []

index = 1

# code to process name inputs and add them to poker_player_names, code to add a number to poker_players for each name that is added, allows users to end before 10

while index <= 10
  input = gets.chomp
  if input.downcase == "done"
    break
  end
  poker_players_names << input
  poker_players << index
  index = index + 1
end

# displays the poker players and a table number for them to sit at

puts "--------"
puts "See the players below:"
p poker_players_names.shuffle
puts "--------"
puts "Their seat number:"
p poker_players.shuffle
puts "--------"
puts "Shuffle em and deal!"
