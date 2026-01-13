import createBoard from "../board/board";

const STORAGE_KEY = "trello-state";

export const defaultState = {
  columns: [
    { id: "todo", title: "TODO", cards: [] },
    { id: "progress", title: "IN PROGRESS", cards: [] },
    { id: "done", title: "DONE", cards: [] },
  ],
};

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  if (typeof structuredClone === "function") {
    return structuredClone(defaultState);
  }

  return JSON.parse(JSON.stringify(defaultState));
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function initApp() {
  const root = document.getElementById("root");
  let state = loadState();

  function render() {
    root.innerHTML = "";
    root.append(createBoard(state, render));
  }

  render();
}
