# Welcome message
puts "Welcome to Poker Seat Randomizer!"
puts "Please enter the names of the players one at a time: (enter 'done' when finished)"

# Initialize arrays
poker_players_names = []
poker_players = []

# Code to process name inputs and add them to poker_players_names
index = 1
max_players = 20  # Set the maximum number of players here
displayed_message = false  # Boolean variable to track if the message has been displayed

while index <= max_players
  input = gets.chomp.strip
  if input.downcase == "done"
    break
  elsif input.empty? || input.strip.empty?
    puts "Please enter a valid player name."
    next
  end
  
  poker_players_names << input
  poker_players << index
  index += 1

  if index > 10 && !displayed_message
    puts "You have entered more than ten players. The seating will be split into two tables."
    displayed_message = true
  end
end

# Split players into tables if more than 10
if poker_players.length > 10 && poker_players_names.length > 10
  # Shuffle and split names into two tables
  shuffled_names = poker_players_names.shuffle
  table_one_names = shuffled_names.slice(0, shuffled_names.length / 2)
  table_two_names = shuffled_names.slice(shuffled_names.length / 2, shuffled_names.length)

  # Generate seat numbers for each table
  table_one_players = ("Button".."Seat #{table_one_names.length}").to_a
  table_two_players = ("Button".."Seat #{table_two_names.length}").to_a

  # Display tables
  puts "--------"
  puts "Table One: Players below (starting from the button seat):"
  puts "--------"
  table_one_names.each_with_index do |name, index|
    puts "#{table_one_players[index]}: #{name}"
  end
  puts "--------"
  puts "Table Two: Players below (starting from the button seat):"
  puts "--------"
  table_two_names.each_with_index do |name, index|
    puts "#{table_two_players[index]}: #{name}"
  end
else
  # Shuffle all players if there are 10 or fewer
  shuffled_names = poker_players_names.shuffle
  shuffled_players = ("Button".."Seat #{shuffled_names.length}").to_a

  # Display players at a single table
  puts "--------"
  puts "Players below (starting from the button seat):"
  puts "--------"
  shuffled_names.each_with_index do |name, index|
    puts "#{shuffled_players[index]}: #{name}"
  end
end

puts "--------"
puts "Shuffle up and deal!"
