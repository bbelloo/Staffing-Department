function addCard(listId) {
  const title = prompt("Enter card title:");
  if (!title) return;

  const description = prompt("Enter card description (optional):") || "";

  const labelColor = prompt(
    "Choose label color: red, green, blue, yellow, purple (optional):"
  ) || "";

  const card = createCardElement(title, description, labelColor.toLowerCase());
  document.querySelector(`#${listId} .cards`).appendChild(card);
  saveBoard();
}

function createCardElement(title, description, labelColor = "") {
  const card = document.createElement("div");
  card.className = "card";

  const cardTitle = document.createElement("strong");
  cardTitle.innerText = title;

  const cardDesc = document.createElement("p");
  cardDesc.innerText = description;

  // Label element
  let label = null;
  if (["red", "green", "blue", "yellow", "purple"].includes(labelColor)) {
    label = document.createElement("span");
    label.className = `label ${labelColor}`;
    label.innerText = labelColor;
  }

  const buttons = document.createElement("div");
  buttons.className = "card-buttons";

  const editBtn = document.createElement("button");
  editBtn.innerText = "Edit";
  editBtn.onclick = () => {
    const newTitle = prompt("Edit title:", cardTitle.innerText);
    if (newTitle) cardTitle.innerText = newTitle;

    const newDesc = prompt("Edit description:", cardDesc.innerText);
    if (newDesc !== null) cardDesc.innerText = newDesc;

    const newLabelColor = prompt(
      "Edit label color: red, green, blue, yellow, purple (optional):",
      labelColor
    ) || "";

    if (label) label.remove();
    if (["red","green","blue","yellow","purple"].includes(newLabelColor.toLowerCase())) {
      const newLabel = document.createElement("span");
      newLabel.className = `label ${newLabelColor.toLowerCase()}`;
      newLabel.innerText = newLabelColor.toLowerCase();
      card.insertBefore(newLabel, cardTitle);
    }

    saveBoard();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Delete";
  deleteBtn.onclick = () => {
    if (confirm("Delete this card?")) {
      card.remove();
      saveBoard();
    }
  };

  buttons.appendChild(editBtn);
  buttons.appendChild(deleteBtn);

  if (label) card.appendChild(label);
  card.appendChild(cardTitle);
  card.appendChild(cardDesc);
  card.appendChild(buttons);

  return card;
}

function saveBoard() {
  const boardData = {};
  document.querySelectorAll(".list").forEach(list => {
    const listId = list.id;
    boardData[listId] = [];
    list.querySelectorAll(".card").forEach(card => {
      const title = card.querySelector("strong").innerText;
      const description = card.querySelector("p").innerText;
      const labelEl = card.querySelector(".label");
      const label = labelEl ? labelEl.className.split(" ")[1] : "";
      boardData[listId].push({ title, description, label });
    });
  });
  localStorage.setItem("boardData", JSON.stringify(boardData));
}

function loadBoard() {
  const boardData = JSON.parse(localStorage.getItem("boardData") || "{}");
  for (let listId in boardData) {
    const listContainer = document.querySelector(`#${listId} .cards`);
    boardData[listId].forEach(cardData => {
      const card = createCardElement(cardData.title, cardData.description, cardData.label);
      listContainer.appendChild(card);
    });
  }
}

// Enable drag-and-drop
document.querySelectorAll(".cards").forEach(el => {
  new Sortable(el, {
    group: "shared",
    animation: 150,
    onEnd: saveBoard
  });
});

loadBoard();
