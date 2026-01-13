import createColumn from "../column/column";

export default function createBoard(state, render) {
  const board = document.createElement("div");
  board.className = "board";

  state.columns.forEach((column) => {
    board.append(createColumn(column, state, render));
  });

  return board;
}
