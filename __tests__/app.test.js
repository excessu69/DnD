/**
 * @jest-environment jsdom
 */

import initApp from "../src/app/app";

describe("Trello board (unit)", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
    localStorage.clear();
  });

  test("renders 3 columns with correct titles", () => {
    initApp();

    const titles = [...document.querySelectorAll(".column-title")].map(
      (el) => el.textContent,
    );

    expect(titles).toEqual(["TODO", "IN PROGRESS", "DONE"]);
  });

  test("adds a card to column", () => {
    initApp();

    const addBtn = document.querySelector(".add-card");
    addBtn.click();

    const textarea = document.querySelector("textarea");
    textarea.value = "Test card";

    const confirmBtn = document.querySelector(".add-btn");
    confirmBtn.click();

    const cards = document.querySelectorAll(".card");
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain("Test card");
  });

  test("removes a card", () => {
    initApp();

    document.querySelector(".add-card").click();
    document.querySelector("textarea").value = "Delete me";
    document.querySelector(".add-btn").click();

    const removeBtn = document.querySelector(".remove");
    removeBtn.click();

    expect(document.querySelectorAll(".card").length).toBe(0);
  });

  test("saves state to localStorage", () => {
    initApp();

    document.querySelector(".add-card").click();
    document.querySelector("textarea").value = "Saved card";
    document.querySelector(".add-btn").click();

    const saved = JSON.parse(localStorage.getItem("trello-state"));

    expect(saved.columns[0].cards.length).toBe(1);
    expect(saved.columns[0].cards[0].text).toBe("Saved card");
  });
});
