import createCard from "../card/card";
import { saveState } from "../app/app";

const placeholder = document.createElement("div");
placeholder.className = "card placeholder";

let dragged = null;

function getInsertPosition(container, mouseY) {
  const cards = [...container.children].filter(
    (el) => el !== placeholder && !el.classList.contains("dragging"),
  );

  return cards.find((card) => {
    const rect = card.getBoundingClientRect();
    return mouseY < rect.top + rect.height / 2;
  });
}

export default function createColumn(column, state, render) {
  const col = document.createElement("div");
  col.className = "column";

  col.innerHTML = `
    <div class="column-title">${column.title}</div>
    <div class="cards"></div>
  `;

  const cardsEl = col.querySelector(".cards");
  let ghostEl = null;

  column.cards.forEach((card) => {
    cardsEl.append(
      createCard(card, column, state, render, {
        onDragStart(data) {
          dragged = data;
        },
        onDragEnd() {
          dragged = null;
        },
        placeholder,
        getInsertPosition,
        cardsEl,
        setGhost(el) {
          ghostEl = el;
        },
        clearGhost() {
          if (ghostEl) {
            ghostEl.remove();
            ghostEl = null;
          }
        },
      }),
    );
  });

  cardsEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!dragged) return;

    const afterEl = getInsertPosition(cardsEl, e.clientY);
    afterEl
      ? cardsEl.insertBefore(placeholder, afterEl)
      : cardsEl.append(placeholder);
  });

  cardsEl.addEventListener("drop", () => {
    if (!dragged) return;

    const fromCol = state.columns.find((c) => c.id === dragged.from);
    const toCol = state.columns.find((c) => c.id === column.id);

    fromCol.cards = fromCol.cards.filter((c) => c.id !== dragged.card.id);

    const index = [...cardsEl.children].indexOf(placeholder);
    toCol.cards.splice(index, 0, dragged.card);

    placeholder.remove();
    saveState(state);
    render();
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-card";
  addBtn.textContent = "+ Add another card";

  function showAddForm() {
    const form = document.createElement("div");
    form.className = "add-form";
    form.innerHTML = `
      <textarea rows="3"></textarea>
      <div class="add-form-actions">
        <button class="add-btn">Add card</button>
        <button class="cancel-btn" title="Cancel">×</button>
      </div>
    `;

    const textarea = form.querySelector("textarea");
    const confirm = form.querySelector(".add-btn");
    const cancel = form.querySelector(".cancel-btn");

    confirm.addEventListener("click", () => {
      const text = textarea.value.trim();
      if (!text) return;

      column.cards.push({
        id: crypto.randomUUID(),
        text,
      });
      saveState(state);
      render();
    });

    cancel.addEventListener("click", () => {
      form.remove();
      addBtn.style.display = "";
    });

    addBtn.style.display = "none";
    col.insertBefore(form, addBtn);
    textarea.focus();
  }

  addBtn.addEventListener("click", showAddForm);

  col.append(addBtn);
  return col;
}
