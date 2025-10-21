document.addEventListener("DOMContentLoaded", () => {
  const boardContainer = document.getElementById("board-container");
  const addListBtn = document.getElementById("add-list-btn");

  loadBoard();

  addListBtn.addEventListener("click", () => {
    const listName = prompt("Enter list name:");
    if (!listName) return;
    const list = createListElement(listName);
    boardContainer.insertBefore(list, addListBtn);
    saveBoard();
  });

  function createListElement(title) {
    const list = document.createElement("div");
    list.className = "list";

    const header = document.createElement("h3");
    header.innerHTML = `<span class="list-title">${title}</span>`;
    const deleteListBtn = document.createElement("button");
    deleteListBtn.innerText = "×";
    deleteListBtn.onclick = () => {
      if (confirm("Delete this list?")) {
        list.remove();
        saveBoard();
      }
    };
    header.appendChild(deleteListBtn);
    list.appendChild(header);

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards";
    list.appendChild(cardsContainer);

    const addCardInput = document.createElement("input");
    addCardInput.placeholder = "+ Add a card...";
    list.appendChild(addCardInput);

    addCardInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && addCardInput.value.trim() !== "") {
        const card = createCardElement(addCardInput.value.trim());
        cardsContainer.appendChild(card);
        addCardInput.value = "";
        saveBoard();
      }
    });

    new Sortable(cardsContainer, {
      group: "shared",
      animation: 150,
      onEnd: saveBoard
    });

    return list;
  }

  function createCardElement(title, description = "", labelColor = "") {
    const card = document.createElement("div");
    card.className = "card";

    const cardTitle = document.createElement("strong");
    cardTitle.innerText = title;
    const cardDesc = document.createElement("p");
    cardDesc.innerText = description;

    let label = null;
    if (["red","green","blue","yellow","purple"].includes(labelColor)) {
      label = document.createElement("span");
      label.className = `label ${labelColor}`;
      label.innerText = labelColor;
    }

    const labelPicker = document.createElement("select");
    labelPicker.className = "label-picker";
    ["", "red","green","blue","yellow","purple"].forEach(color => {
      const option = document.createElement("option");
      option.value = color;
      option.innerText = color === "" ? "No label" : color;
      if (color === labelColor) option.selected = true;
      labelPicker.appendChild(option);
    });

    labelPicker.addEventListener("change", () => {
      if (label) label.remove();
      if (labelPicker.value) {
        const newLabel = document.createElement("span");
        newLabel.className = `label ${labelPicker.value}`;
        newLabel.innerText = labelPicker.value;
        card.insertBefore(newLabel, cardTitle);
        label = newLabel;
      } else {
        label = null;
      }
      saveBoard();
    });

    const buttons = document.createElement("div");
    buttons.className = "card-buttons";

    const editBtn = document.createElement("button");
    editBtn.innerText = "Edit";
    editBtn.onclick = () => {
      const newTitle = prompt("Edit title:", cardTitle.innerText);
      if (newTitle) cardTitle.innerText = newTitle;

      const newDesc = prompt("Edit description:", cardDesc.innerText);
      if (newDesc !== null) cardDesc.innerText = newDesc;

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
    card.appendChild(labelPicker);
    card.appendChild(buttons);

    return card;
  }

  function saveBoard() {
    const boardData = [];
    document.querySelectorAll(".list").forEach(list => {
      const listTitle = list.querySelector(".list-title").innerText;
      const cardsData = [];
      list.querySelectorAll(".card").forEach(card => {
        const title = card.querySelector("strong").innerText;
        const description = card.querySelector("p").innerText;
        const labelEl = card.querySelector(".label");
        const label = labelEl ? labelEl.className.split(" ")[1] : "";
        cardsData.push({ title, description, label });
      });
      boardData.push({ listTitle, cards: cardsData });
    });
    localStorage.setItem("trelloBoard", JSON.stringify(boardData));
  }

  function loadBoard() {
    const data = JSON.parse(localStorage.getItem("trelloBoard") || "[]");
    data.forEach(listData => {
      const list = createListElement(listData.listTitle);
      boardContainer.insertBefore(list, addListBtn);
      listData.cards.forEach(cardData => {
        const card = createCardElement(cardData.title, cardData.description, cardData.label);
        list.querySelector(".cards").appendChild(card);
      });
    });
  }
});
