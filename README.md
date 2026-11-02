# Poker Seater

## Why?

I built this for my weekly poker game. We needed a way to randomize where players sat each week.

It also keeps my poker buddies from thinking I give myself the best seat every week.

## How?

Use it at [poker seater](https://www.taylordorsett.com/poker_seater/).

You can type names or paste a list from anywhere. Commas, new lines, bullets and numbers all work. If you dont want to type names, pick a number of players and everyone gets a number. Hit Demo to see how it all works first.

## What can it do?

* Shows you the table before you deal
* Shuffles everyone with a little animation so you can see it's random
* Splits into two tables when you have more than 10 players
* Share link gives you a url with the seats in it for the group chat
* Copy seats gives you plain text instead
* Tap Out when someone busts. If the tables get 2 apart it tells you who moves and where
* At 10 players left it combines into a final table with new seats
* Calls the winner when one player is left
* Undo if you tap Out by mistake
* Remembers your players for next week
* Reset clears it all

Share links are a snapshot, so if someone busts you need to send a new one.

## What tech?

It's all one index.html file with plain HTML, CSS and JavaScript. No framework and no build step. It's hosted on GitHub Pages.

The first version was in Ruby and it's still here. You can run it in your terminal with `ruby poker_seater.rb`.

## Running it locally

Run index.html with something like Live Server.

Every PR also gets a preview link posted as a comment, so you can try it before merging.

## Testing

The tests use Playwright and run on every PR at phone and desktop sizes. To run them yourself:

```bash
npm install
npx playwright install chromium
npm test
```

If you want to try it with a full list by hand, type `test, test` in the names box and it adds 20 players.
