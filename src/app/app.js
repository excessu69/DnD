const STORAGE_KEY = "trello-state";

const defaultState = {
  columns: [
    { id: "todo", title: "TODO", cards: [] },
    { id: "progress", title: "IN PROGRESS", cards: [] },
    { id: "done", title: "DONE", cards: [] },
  ],
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  if (typeof structuredClone === "function") {
    return structuredClone(defaultState);
  }

  return JSON.parse(JSON.stringify(defaultState));
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const placeholder = document.createElement("div");
placeholder.className = "card placeholder";

function getInsertPosition(container, mouseY) {
  const cards = [...container.children].filter(
    (el) => el !== placeholder && !el.classList.contains("dragging"),
  );

  return cards.find((card) => {
    const rect = card.getBoundingClientRect();
    return mouseY < rect.top + rect.height / 2;
  });
}

export default function initApp() {
  const root = document.getElementById("root");
  let state = loadState();
  let dragged = null;
  let addingColumnId = null;
  let ghostEl = null;

  function render() {
    root.innerHTML = "";

    const board = document.createElement("div");
    board.className = "board";

    state.columns.forEach((column) => {
      const col = document.createElement("div");
      col.className = "column";

      col.innerHTML = `
        <div class="column-title">${column.title}</div>
        <div class="cards"></div>
      `;

      const cardsEl = col.querySelector(".cards");

      column.cards.forEach((card) => {
        const cardEl = document.createElement("div");
        cardEl.className = "card";
        cardEl.draggable = true;

        cardEl.innerHTML = `
          ${card.text}
          <span class="remove">✕</span>
        `;

        /* delete */
        cardEl.querySelector(".remove").onclick = () => {
          column.cards = column.cards.filter((c) => c.id !== card.id);
          saveState(state);
          render();
        };

        /* drag start */
        cardEl.addEventListener("dragstart", (e) => {
          dragged = { card, from: column.id };

          placeholder.style.height = `${cardEl.offsetHeight}px`;

          cardEl.classList.add("dragging");
          document.body.classList.add("dragging");

          cardEl.after(placeholder);

          ghostEl = cardEl.cloneNode(true);
          ghostEl.classList.remove("dragging");
          ghostEl.style.position = "absolute";
          ghostEl.style.top = "-9999px";
          ghostEl.style.left = "-9999px";
          ghostEl.style.width = `${cardEl.offsetWidth}px`;
          ghostEl.style.pointerEvents = "none";

          document.body.appendChild(ghostEl);

          e.dataTransfer.setData("text/plain", "");
          e.dataTransfer.setDragImage(ghostEl, e.offsetX, e.offsetY);
        });

        /* drag end */
        cardEl.addEventListener("dragend", () => {
          placeholder.remove();
          dragged = null;
          cardEl.classList.remove("dragging");
          document.body.classList.remove("dragging");

          if (ghostEl) {
            document.body.removeChild(ghostEl);
            ghostEl = null;
          }
        });

        cardsEl.append(cardEl);
      });

      /* drag over */
      cardsEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dragged) return;

        const afterEl = getInsertPosition(cardsEl, e.clientY);

        if (afterEl) {
          cardsEl.insertBefore(placeholder, afterEl);
        } else {
          cardsEl.appendChild(placeholder);
        }
      });

      /* drop */
      cardsEl.addEventListener("drop", () => {
        if (!dragged) return;

        const fromCol = state.columns.find((c) => c.id === dragged.from);
        const toCol = state.columns.find((c) => c.id === column.id);

        fromCol.cards = fromCol.cards.filter((c) => c.id !== dragged.card.id);

        const index = [...cardsEl.children].indexOf(placeholder);
        toCol.cards.splice(index, 0, dragged.card);

        placeholder.remove();
        dragged = null;

        saveState(state);
        render();
      });

      /* ADD CARD */
      if (addingColumnId === column.id) {
        const form = document.createElement("div");
        form.className = "add-form";

        form.innerHTML = `
          <textarea rows="3" placeholder="Enter a title for this card..."></textarea>
          <div class="add-form-actions">
            <button class="add-btn">Add Card</button>
            <span class="cancel-btn">✕</span>
          </div>
        `;

        const textarea = form.querySelector("textarea");
        textarea.focus();

        form.querySelector(".add-btn").onclick = () => {
          const text = textarea.value.trim();
          if (!text) return;

          column.cards.push({
            id: crypto.randomUUID(),
            text,
          });

          addingColumnId = null;
          saveState(state);
          render();
        };

        form.querySelector(".cancel-btn").onclick = () => {
          addingColumnId = null;
          render();
        };

        col.append(form);
      } else {
        const addBtn = document.createElement("button");
        addBtn.className = "add-card";
        addBtn.textContent = "+ Add another card";

        addBtn.onclick = () => {
          addingColumnId = column.id;
          render();
        };

        col.append(addBtn);
      }

      board.append(col);
    });

    root.append(board);
  }

  render();
}
