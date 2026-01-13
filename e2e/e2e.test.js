import puppeteer from "puppeteer";
import { fork } from "child_process";

jest.setTimeout(40000);

describe("Trello board E2E", () => {
  let browser;
  let page;
  let server;

  const baseUrl = "http://localhost:8087";

  beforeAll(async () => {
    // запускаем webpack-dev-server
    server = fork(`${__dirname}/e2e.server.js`);

    // ждём, пока сервер поднимется
    await new Promise((resolve) => setTimeout(resolve, 2000));

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.kill("SIGTERM");
  });

  beforeEach(async () => {
    await page.goto(baseUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle0" });
  });

  test("renders 3 columns", async () => {
    const columns = await page.$$(".column");
    expect(columns.length).toBe(3);

    const titles = await page.$$eval(".column-title", (els) =>
      els.map((el) => el.textContent.trim()),
    );

    expect(titles).toEqual(["TODO", "IN PROGRESS", "DONE"]);
  });

  test("adds a card to column", async () => {
    await page.click(".column:nth-child(1) .add-card");
    await page.type("textarea", "My first card");
    await page.click(".add-btn");

    const cardText = await page.$eval(
      ".column:nth-child(1) .card",
      (el) => el.textContent,
    );

    expect(cardText).toContain("My first card");
  });

  test("removes a card", async () => {
    await page.click(".column:nth-child(1) .add-card");
    await page.type("textarea", "Card to delete");
    await page.click(".add-btn");

    await page.hover(".card");
    await page.click(".card .remove");

    const cards = await page.$$(".card");
    expect(cards.length).toBe(0);
  });

  test("drag & drop card between columns", async () => {
    // добавляем карточку
    await page.click(".column:nth-child(1) .add-card");
    await page.type("textarea", "Drag me");
    await page.click(".add-btn");

    // dispatch native drag events with DataTransfer
    await page.evaluate(() => {
      const src = document.querySelector(".column:nth-child(1) .card");
      const dest = document.querySelector(".column:nth-child(2) .cards");
      const dt = new DataTransfer();
      const srcRect = src.getBoundingClientRect();
      const destRect = dest.getBoundingClientRect();

      src.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
          clientX: srcRect.left + 5,
          clientY: srcRect.top + 5,
        }),
      );

      dest.dispatchEvent(
        new DragEvent("dragenter", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
          clientX: destRect.left + 5,
          clientY: destRect.top + 5,
        }),
      );

      dest.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
          clientX: destRect.left + 5,
          clientY: destRect.top + 5,
        }),
      );

      dest.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
          clientX: destRect.left + 5,
          clientY: destRect.top + 5,
        }),
      );

      src.dispatchEvent(
        new DragEvent("dragend", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
          clientX: srcRect.left + 5,
          clientY: srcRect.top + 5,
        }),
      );
    });

    // assert moved
    await page.waitForSelector(".column:nth-child(2) .card");
    const movedCardText = await page.$eval(
      ".column:nth-child(2) .card",
      (el) => el.textContent,
    );

    expect(movedCardText).toContain("Drag me");
  });

  test("state is saved to localStorage", async () => {
    await page.click(".column:nth-child(1) .add-card");
    await page.type("textarea", "Persisted card");
    await page.click(".add-btn");

    await page.reload({ waitUntil: "networkidle0" });

    const cardText = await page.$eval(".card", (el) => el.textContent);
    expect(cardText).toContain("Persisted card");
  });
});
