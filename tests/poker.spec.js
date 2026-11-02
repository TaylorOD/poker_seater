const { test, expect } = require("@playwright/test");

const names = (count) => Array.from({ length: count }, (_, index) => `Name${index + 1}`);

async function addPlayers(page, text) {
  await page.locator("#player-names").fill(text);
  await page.locator("#add-player").click();
}

async function playerList(page) {
  return page.locator("#players-ul span").allTextContents();
}

async function deal(page, count) {
  await addPlayers(page, names(count).join(", "));
  await page.locator("#deal-button").click();
  await waitForShuffle(page);
}

async function waitForShuffle(page) {
  await expect(page.locator("#poker-table .seat.spinning")).toHaveCount(0);
}

async function tableCounts(page, area = "#poker-table") {
  return page.locator(`${area} .poker-table`).evaluateAll((tables) =>
    tables.map((table) => table.querySelectorAll(".seat:not(.empty)").length)
  );
}

async function seatedPlayers(page) {
  const seated = await page.locator("#poker-table .seat:not(.empty)").evaluateAll((seats) =>
    seats.map((seat) => seat.querySelector(".seat-name").textContent)
  );
  return seated.sort();
}

async function markOut(page, tableIndex) {
  await page.locator("#poker-table .seat-list").nth(tableIndex).locator(".out-button").first().click();
}

test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/");
});

test.describe("adding players", () => {
  test("cleans up a pasted list", async ({ page }) => {
    await addPlayers(page, "1. Taylor\n2) Rob\n- Jess\n* Sam\n• Kelly\nDan, Alex; Priya\tChris\n\n");
    expect(await playerList(page)).toEqual(["Taylor", "Rob", "Jess", "Sam", "Kelly", "Dan", "Alex", "Priya", "Chris"]);
  });

  test("adds with the enter key", async ({ page }) => {
    await page.locator("#player-names").fill("Taylor");
    await page.locator("#player-names").press("Enter");
    expect(await playerList(page)).toEqual(["Taylor"]);
  });

  test("skips names already on the list", async ({ page }) => {
    await addPlayers(page, "Taylor, Rob");
    await addPlayers(page, "rob, Sam, TAYLOR");
    expect(await playerList(page)).toEqual(["Taylor", "Rob", "Sam"]);
    await expect(page.locator("#message")).toHaveText("Already added: rob, TAYLOR.");
  });

  test("stops at 20 players and keeps what you typed", async ({ page }) => {
    await addPlayers(page, names(19).join(","));
    await addPlayers(page, "One, Two");
    await expect(page.locator("#message")).toHaveText("Cannot add more than 20 players.");
    await expect(page.locator("#players-count")).toHaveText("19");
    await expect(page.locator("#player-names")).toHaveValue("One, Two");
  });

  test("the test shortcut fills 20 players", async ({ page }) => {
    await addPlayers(page, "test, test");
    await expect(page.locator("#players-count")).toHaveText("20");
  });

  test("can remove one player", async ({ page }) => {
    await addPlayers(page, "Taylor, Rob");
    await page.getByRole("button", { name: "Remove Taylor" }).click();
    expect(await playerList(page)).toEqual(["Rob"]);
  });

  test("remembers players after a reload", async ({ page }) => {
    await addPlayers(page, "Taylor, Rob");
    await page.reload();
    expect(await playerList(page)).toEqual(["Taylor", "Rob"]);
  });

  test("asks for a name when dealing with nobody", async ({ page }) => {
    await page.locator("#deal-button").click();
    await expect(page.locator("#message")).toHaveText("Please enter at least one player name.");
    await expect(page.locator("#results")).toBeHidden();
  });
});

test.describe("number of players", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("#mode-number").click();
  });

  test("stays between 2 and 20", async ({ page }) => {
    const input = page.locator("#player-count");
    await input.fill("99");
    await input.blur();
    await expect(input).toHaveValue("20");
    await input.fill("0");
    await input.blur();
    await expect(input).toHaveValue("2");
    await page.locator("#count-down").click();
    await expect(input).toHaveValue("2");
    await page.locator("#count-up").click();
    await expect(input).toHaveValue("3");
  });

  test("deals numbered players", async ({ page }) => {
    await page.locator("#count-up").click();
    await page.locator("#deal-button").click();
    await waitForShuffle(page);
    const expected = Array.from({ length: 9 }, (_, index) => `Player ${index + 1}`).sort();
    expect(await seatedPlayers(page)).toEqual(expected);
  });

  test("leaves saved names alone", async ({ page }) => {
    await page.locator("#mode-names").click();
    await addPlayers(page, "Taylor, Rob");
    await page.locator("#mode-number").click();
    await page.locator("#deal-button").click();
    await waitForShuffle(page);
    await page.locator("#edit-button").click();
    await page.locator("#mode-names").click();
    expect(await playerList(page)).toEqual(["Taylor", "Rob"]);
  });
});

test.describe("table preview", () => {
  test("shows 10 open seats before anyone is added", async ({ page }) => {
    expect(await page.locator("#preview-tables .seat").count()).toBe(10);
    await expect(page.locator("#preview-tables .felt-count")).toHaveText("Add players to fill it");
  });

  test("follows the player count", async ({ page }) => {
    await addPlayers(page, names(3).join(","));
    expect(await page.locator("#preview-tables .seat").count()).toBe(3);
    await addPlayers(page, names(13).slice(3).join(","));
    const perTable = await page.locator("#preview-tables .poker-table").evaluateAll((tables) =>
      tables.map((table) => table.querySelectorAll(".seat").length)
    );
    expect(perTable).toEqual([7, 6]);
  });

  test("is hidden once seats are dealt", async ({ page }) => {
    await deal(page, 4);
    await expect(page.locator("#table-preview")).toBeHidden();
  });
});

test.describe("dealing", () => {
  test("seats every player exactly once", async ({ page }) => {
    await deal(page, 10);
    expect(await seatedPlayers(page)).toEqual(names(10).sort());
    expect(await tableCounts(page)).toEqual([10]);
  });

  test("splits into two tables over 10 players", async ({ page }) => {
    await deal(page, 13);
    expect(await tableCounts(page)).toEqual([7, 6]);
  });

  test("hides the seat list until the shuffle finishes", async ({ page }) => {
    await addPlayers(page, names(8).join(","));
    await page.locator("#deal-button").click();
    await expect(page.locator("#poker-table .seat.spinning").first()).toBeVisible();
    await expect(page.locator("#poker-table .seat-list")).toBeHidden();
    await waitForShuffle(page);
    await expect(page.locator("#poker-table .seat-list")).toBeVisible();
  });

  test("marks the first seat as the dealer", async ({ page }) => {
    await deal(page, 4);
    await expect(page.locator("#poker-table .seat.dealer")).toHaveCount(1);
    await expect(page.locator("#poker-table .seat.dealer .seat-number")).toHaveText("D");
  });

  test("treats names as plain text", async ({ page }) => {
    await addPlayers(page, "<img src=x onerror=window.pwned=1>, Rob");
    await page.locator("#deal-button").click();
    await waitForShuffle(page);
    await expect(page.locator("#poker-table img")).toHaveCount(0);
    expect(await page.evaluate(() => window.pwned)).toBeUndefined();
  });

  test("reshuffle keeps everyone", async ({ page }) => {
    await deal(page, 5);
    await markOut(page, 0);
    await page.locator("#reshuffle-button").click();
    await waitForShuffle(page);
    expect(await seatedPlayers(page)).toEqual(names(5).sort());
    await expect(page.locator("#out-list")).toBeHidden();
  });

  test("copy seats puts the seats on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await deal(page, 2);
    await page.locator("#copy-button").click();
    await expect(page.locator("#copy-button")).toHaveText("Copied!");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("Table One:");
    expect(copied).toContain("(dealer)");
    expect(copied).toMatch(/Seat 2: Name\d/);
  });
});

test.describe("demo", () => {
  test("deals 13 players without touching saved names", async ({ page }) => {
    await addPlayers(page, "Taylor, Rob");
    await page.locator("#demo-button").click();
    await waitForShuffle(page);
    expect(await tableCounts(page)).toEqual([7, 6]);
    await expect(page.locator("#notice-text")).toContainText("demo game");
    await page.locator("#edit-button").click();
    expect(await playerList(page)).toEqual(["Taylor", "Rob"]);
  });
});

test.describe("balancing", () => {
  test("no move when tables stay within 1", async ({ page }) => {
    await deal(page, 12);
    await markOut(page, 0);
    expect(await tableCounts(page)).toEqual([5, 6]);
    await expect(page.locator("#notice-text p")).toHaveCount(1);
    await expect(page.locator("#poker-table .seat.moved")).toHaveCount(0);
  });

  test("moves a player when tables get 2 apart", async ({ page }) => {
    await deal(page, 13);
    await markOut(page, 1);
    expect(await tableCounts(page)).toEqual([6, 6]);
    await expect(page.locator("#notice-text")).toContainText(/Move .+ from Table One seat \d+ to Table Two seat \d+\./);
    await expect(page.locator("#poker-table .seat.moved")).toHaveCount(1);
    await expect(page.locator("#out-list")).toBeVisible();
  });

  test("undo puts everything back", async ({ page }) => {
    await deal(page, 13);
    const before = await seatedPlayers(page);
    await markOut(page, 1);
    await page.locator("#undo-button").click();
    expect(await tableCounts(page)).toEqual([7, 6]);
    expect(await seatedPlayers(page)).toEqual(before);
    await expect(page.locator("#out-list")).toBeHidden();
    await expect(page.locator("#undo-button")).toBeHidden();
  });

  test("combines into a final table at 10 players", async ({ page }) => {
    await deal(page, 11);
    await markOut(page, 0);
    await waitForShuffle(page);
    expect(await tableCounts(page)).toEqual([10]);
    await expect(page.locator("#notice-text")).toContainText("Final table");
  });

  test("calls the winner when one player is left", async ({ page }) => {
    await deal(page, 2);
    await markOut(page, 0);
    await expect(page.locator("#notice-text")).toContainText("wins!");
    await expect(page.locator("#poker-table .out-button")).toHaveCount(0);
  });
});

test.describe("share links", () => {
  test("someone else sees the same seats without controls", async ({ page, browser }) => {
    await deal(page, 13);
    const url = page.url();
    const seated = await seatedPlayers(page);

    const friendContext = await browser.newContext();
    const friend = await friendContext.newPage();
    await friend.goto(url);
    await expect(friend.locator("#shared-note")).toBeVisible();
    await expect(friend.locator("#reshuffle-button")).toBeHidden();
    await expect(friend.locator("#edit-button")).toBeHidden();
    await expect(friend.locator("#poker-table .out-button")).toHaveCount(0);
    expect(await seatedPlayers(friend)).toEqual(seated);
    await expect(friend.locator("#own-game-button")).toBeVisible();
    await friend.locator("#own-game-button").click();
    await expect(friend.locator("#poker-form")).toBeVisible();
    expect(friend.url()).not.toContain("#seats=");
    await friendContext.close();
  });

  test("shows empty seats after someone is out", async ({ page, browser }) => {
    await deal(page, 5);
    await markOut(page, 0);
    const friendContext = await browser.newContext();
    const friend = await friendContext.newPage();
    await friend.goto(page.url());
    await expect(friend.locator("#poker-table .seat.empty")).toHaveCount(1);
    await friendContext.close();
  });

  test("keeps names with accents and other alphabets", async ({ page, browser }) => {
    await addPlayers(page, "José, 李雷, O'Brien");
    await page.locator("#deal-button").click();
    await waitForShuffle(page);
    const friendContext = await browser.newContext();
    const friend = await friendContext.newPage();
    await friend.goto(page.url());
    expect(await seatedPlayers(friend)).toEqual(["José", "李雷", "O'Brien"].sort());
    await friendContext.close();
  });

  test("reloading your own link keeps your controls", async ({ page }) => {
    await deal(page, 13);
    await markOut(page, 1);
    await page.reload();
    await expect(page.locator("#reshuffle-button")).toBeVisible();
    await expect(page.locator("#shared-note")).toBeHidden();
    await expect(page.locator("#out-list")).toBeVisible();
    await expect(page.locator("#undo-button")).toBeVisible();
  });

  test("a broken link shows the first screen", async ({ page }) => {
    await page.goto("/#seats=not-real-data");
    await expect(page.locator("#poker-form")).toBeVisible();
    await expect(page.locator("#results")).toBeHidden();
  });
});

test.describe("reset", () => {
  test("clears the players on the first screen", async ({ page }) => {
    await addPlayers(page, "Taylor, Rob");
    await page.locator("#clear-button").click();
    expect(await playerList(page)).toEqual([]);
    await page.reload();
    expect(await playerList(page)).toEqual([]);
  });

  test("clears the game and players after dealing", async ({ page }) => {
    await deal(page, 13);
    await markOut(page, 1);
    await page.locator("#reset-game-button").click();
    await expect(page.locator("#poker-form")).toBeVisible();
    await expect(page.locator("#results")).toBeHidden();
    expect(await playerList(page)).toEqual([]);
    expect(page.url()).not.toContain("#seats=");
    await expect(page.locator("#preview-tables .felt-count")).toHaveText("Add players to fill it");
  });

  test("sets the number of players back to 8", async ({ page }) => {
    await page.locator("#mode-number").click();
    await page.locator("#count-up").click();
    await page.locator("#deal-button").click();
    await waitForShuffle(page);
    await page.locator("#reset-game-button").click();
    await expect(page.locator("#player-count")).toHaveValue("8");
  });

  test("does nothing if you back out", async ({ page }) => {
    await addPlayers(page, "Taylor, Rob");
    page.removeAllListeners("dialog");
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.locator("#clear-button").click();
    expect(await playerList(page)).toEqual(["Taylor", "Rob"]);
  });

  test("is not on a shared view", async ({ page, browser }) => {
    await deal(page, 4);
    const friendContext = await browser.newContext();
    const friend = await friendContext.newPage();
    await friend.goto(page.url());
    await expect(friend.locator("#reset-game-button")).toBeHidden();
    await friendContext.close();
  });
});

test.describe("layout", () => {
  async function expectNoSidewaysScroll(page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }

  test("nothing runs off the screen", async ({ page }) => {
    await expectNoSidewaysScroll(page);
    await addPlayers(page, `A Really Long Player Name Goes Here, ${names(19).join(",")}`);
    await expectNoSidewaysScroll(page);
    await page.locator("#deal-button").click();
    await waitForShuffle(page);
    await expectNoSidewaysScroll(page);
  });
});
