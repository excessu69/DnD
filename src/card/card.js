import { saveState } from "../app/app";

export default function createCard(card, column, state, render, dnd) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.draggable = true;

  cardEl.innerHTML = `
    ${card.text}
    <span class="remove">✕</span>
  `;

  cardEl.querySelector(".remove").onclick = () => {
    column.cards = column.cards.filter((c) => c.id !== card.id);
    saveState(state);
    render();
  };

  cardEl.addEventListener("dragstart", (e) => {
    dnd.onDragStart({ card, from: column.id });

    dnd.placeholder.style.height = `${cardEl.offsetHeight}px`;
    cardEl.classList.add("dragging");
    cardEl.after(dnd.placeholder);

    const ghost = cardEl.cloneNode(true);
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    ghost.style.pointerEvents = "none";
    document.body.append(ghost);

    dnd.setGhost(ghost);

    e.dataTransfer.setData("text/plain", "");
    e.dataTransfer.setDragImage(ghost, 0, 0);
  });

  cardEl.addEventListener("dragend", () => {
    cardEl.classList.remove("dragging");
    dnd.placeholder.remove();
    dnd.clearGhost();
    dnd.onDragEnd();
  });

  return cardEl;
}
