document.addEventListener("DOMContentLoaded", () => {
  const boardContainer = document.getElementById("board-container");
  const addListBtn = document.getElementById("add-list-btn");

  // Modal elements
  const modal = document.getElementById("card-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalLabel = document.getElementById("modal-label");
  const closeModal = document.getElementById("close-modal");
  const modalArchive = document.getElementById("modal-archive");
  const modalDelete = document.getElementById("modal-delete");
  const modalSave = document.getElementById("modal-save");
  const historyList = document.getElementById("history-list");
  let currentCard = null;

  // Archive Panel
  const archivePanel = document.getElementById("archive-panel");
  const openArchiveBtn = document.getElementById("open-archive");
  const closeArchiveBtn = document.getElementById("close-archive");
  const archivedCardsContainer = document.getElementById("archived-cards");

  // Load board from localStorage
  loadBoard();

  // Add new list
  addListBtn.addEventListener("click", () => {
    createList();
    saveBoard();
  });

  // Functions
  function createList(title = "New List") {
    const list = document.createElement("div");
    list.className = "list";

    // Header
    const header = document.createElement("div");
    header.className = "list-header";

    const h3 = document.createElement("h3");
    h3.innerText = title;

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "×";
    deleteBtn.onclick = () => {
      if (confirm("Delete this list?")) {
        list.remove();
        saveBoard();
      }
    };

    header.append(h3, deleteBtn);
    list.appendChild(header);

    // Cards container
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards";
    list.appendChild(cardsContainer);

    // Inline add card input
    const addCardInput = document.createElement("input");
    addCardInput.className = "add-card-input";
    addCardInput.placeholder = "+ Add a card...";
    addCardInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && addCardInput.value.trim() !== "") {
        const card = createCard(addCardInput.value.trim());
        cardsContainer.appendChild(card);
        addCardInput.value = "";
        saveBoard();
      }
    });
    list.appendChild(addCardInput);

    // Make cards sortable
    new Sortable(cardsContainer, {
      group: "shared-cards",
      animation: 200,
      onEnd: saveBoard
    });

    // Add list to board
    boardContainer.appendChild(list);

    // Make lists sortable horizontally
    new Sortable(boardContainer, {
      animation: 200,
      onEnd: saveBoard
    });

    return list;
  }

  function createCard(title, desc = "", label = "", history = []) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.archived = "false";
    card.dataset.history = JSON.stringify(history);

    // Label badge
    let labelBadge = null;
    if (label) {
      labelBadge = document.createElement("span");
      labelBadge.className = `label ${label}`;
      labelBadge.innerText = label;
      card.appendChild(labelBadge);
    }

    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";
    cardTitle.innerText = title;

    const cardDesc = document.createElement("div");
    cardDesc.className = "card-desc";
    cardDesc.innerText = desc;

    // Label selector inline
    const labelSelector = document.createElement("select");
    ["","red","green","blue","yellow","purple"].forEach(c=>{
      const opt = document.createElement("option");
      opt.value = c;
      opt.innerText = c === "" ? "No label" : c;
      if (c === label) opt.selected = true;
      labelSelector.appendChild(opt);
    });
    labelSelector.addEventListener("change", ()=>{
      if(labelBadge) labelBadge.remove();
      if(labelSelector.value){
        labelBadge = document.createElement("span");
        labelBadge.className = `label ${labelSelector.value}`;
        labelBadge.innerText = labelSelector.value;
        card.insertBefore(labelBadge, cardTitle);
      } else {
        labelBadge = null;
      }
      saveBoard();
    });

    // Card buttons
    const buttons = document.createElement("div");
    buttons.className = "card-buttons";
    const editBtn = document.createElement("button"); editBtn.innerText="Edit";
    const archiveBtn = document.createElement("button"); archiveBtn.innerText="Archive";
    const deleteBtn = document.createElement("button"); deleteBtn.innerText="Delete";

    editBtn.onclick = (e)=>{
      e.stopPropagation();
      openModal(card);
    };
    archiveBtn.onclick = (e)=>{
      e.stopPropagation();
      archiveCard(card);
    };
    deleteBtn.onclick = (e)=>{
      e.stopPropagation();
      if(confirm("Delete permanently?")){ card.remove(); saveBoard(); }
    };

    buttons.append(editBtn, archiveBtn, deleteBtn);

    card.append(labelBadge, cardTitle, cardDesc, labelSelector, buttons);

    // Click card to open modal
    card.addEventListener("click", (e)=>{
      if(!e.target.closest("button") && !e.target.closest("select")){
        openModal(card);
      }
    });

    return card;
  }

  // Modal functions
  function openModal(card){
    currentCard = card;
    modal.style.display = "flex";
    modalTitle.value = card.querySelector(".card-title").innerText;
    modalDesc.value = card.querySelector(".card-desc").innerText;
    const labelEl = card.querySelector(".label");
    modalLabel.value = labelEl ? labelEl.className.split(" ")[1] : "";

    // Load edit history
    historyList.innerHTML = "";
    const hist = JSON.parse(card.dataset.history || "[]");
    hist.forEach(entry=>{
      const li = document.createElement("li");
      li.innerText = entry;
      historyList.appendChild(li);
    });
  }

  closeModal.onclick = ()=>{ modal.style.display="none"; };
  window.onclick = e=>{ if(e.target===modal) modal.style.display="none"; };

  modalSave.onclick = ()=>{
    const oldTitle = currentCard.querySelector(".card-title").innerText;
    const oldDesc = currentCard.querySelector(".card-desc").innerText;
    const oldLabel = currentCard.querySelector(".label")?.className.split(" ")[1] || "";

    const newTitle = modalTitle.value;
    const newDesc = modalDesc.value;
    const newLabel = modalLabel.value;

    // Update card content
    currentCard.querySelector(".card-title").innerText = newTitle;
    currentCard.querySelector(".card-desc").innerText = newDesc;

    // Update label
    let labelEl = currentCard.querySelector(".label");
    if(labelEl) labelEl.remove();
    if(newLabel){
      const l = document.createElement("span");
      l.className = `label ${newLabel}`;
      l.innerText = newLabel;
      currentCard.insertBefore(l, currentCard.querySelector(".card-title"));
    }

    // Update edit history
    const hist = JSON.parse(currentCard.dataset.history || "[]");
    const timestamp = new Date().toLocaleString();
    hist.push(`${timestamp}: "${oldTitle}"->"${newTitle}", "${oldDesc}"->"${newDesc}", label "${oldLabel}"->"${newLabel}"`);
    currentCard.dataset.history = JSON.stringify(hist);

    modal.style.display = "none";
    saveBoard();
  };

  modalArchive.onclick = ()=>{
    archiveCard(currentCard);
    modal.style.display = "none";
  };

  modalDelete.onclick = ()=>{
    if(confirm("Delete permanently?")){ currentCard.remove(); modal.style.display="none"; saveBoard(); }
  };

  function archiveCard(card){
    card.dataset.archived = "true";
    card.style.display = "none";
    saveBoard();
    renderArchivePanel();
  }

  // Archive panel
  openArchiveBtn.onclick = ()=>{ archivePanel.style.display="block"; renderArchivePanel(); };
  closeArchiveBtn.onclick = ()=>{ archivePanel.style.display="none"; };

  function renderArchivePanel(){
    archivedCardsContainer.innerHTML = "";
    document.querySelectorAll(".card").forEach(card=>{
      if(card.dataset.archived==="true"){
        const clone = card.cloneNode(true);
        clone.style.display="flex";
        clone.querySelector(".card-buttons").remove();
        const restoreBtn = document.createElement("button");
        restoreBtn.innerText="Restore";
        restoreBtn.onclick = ()=>{
          card.dataset.archived="false";
          card.style.display="flex";
          saveBoard();
          renderArchivePanel();
        };
        clone.appendChild(restoreBtn);
        archivedCardsContainer.appendChild(clone);
      }
    });
  }

  // Persistence
  function saveBoard(){
    const data=[];
    document.querySelectorAll(".list").forEach(l=>{
      const listTitle = l.querySelector("h3").innerText;
      const cardsData=[];
      l.querySelectorAll(".card").forEach(c=>{
        const title = c.querySelector(".card-title").innerText;
        const desc = c.querySelector(".card-desc").innerText;
        const label = c.querySelector(".label")?.className.split(" ")[1] || "";
        const archived = c.dataset.archived==="true";
        const history = JSON.parse(c.dataset.history || "[]");
        cardsData.push({title,desc,label,archived,history});
      });
      data.push({listTitle,cards:cardsData});
    });
    localStorage.setItem("ellaBoard",JSON.stringify(data));
  }

  function loadBoard(){
    const data = JSON.parse(localStorage.getItem("ellaBoard") || "[]");
    data.forEach(l=>{
      const list = createList(l.listTitle);
      const cardsContainer = list.querySelector(".cards");
      l.cards.forEach(c=>{
        const card = createCard(c.title,c.desc,c.label,c.history);
        if(c.archived){ card.dataset.archived="true"; card.style.display="none"; }
        cardsContainer.appendChild(card);
      });
    });
  }
});
