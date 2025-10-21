// script.js

const boardContainer = document.getElementById('board-container');
const addListBtn = document.getElementById('add-list-btn');
const cardModal = document.getElementById('card-modal');
const closeModal = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalLabel = document.getElementById('modal-label');
const modalSave = document.getElementById('modal-save');
const modalArchive = document.getElementById('modal-archive');
const modalDelete = document.getElementById('modal-delete');
const historyList = document.getElementById('history-list');

const archivePanel = document.getElementById('archive-panel');
const openArchive = document.getElementById('open-archive');
const closeArchive = document.getElementById('close-archive');
const archivedCardsDiv = document.getElementById('archived-cards');

let lists = [];
let archivedCards = [];
let currentCard = null;

// Helpers
function createList(title) {
  const list = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: title,
    cards: []
  };
  lists.push(list);
  renderLists();
}

function createCard(listId, title, desc, label) {
  const card = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: title,
    desc: desc,
    label: label,
    history: [`Created at ${new Date().toLocaleString()}`]
  };
  const list = lists.find(l => l.id === listId);
  if (!list) return;
  list.cards.push(card);
  renderLists();
}

// Rendering
function renderLists() {
  boardContainer.innerHTML = '';
  lists.forEach(list => {
    const listEl = document.createElement('div');
    listEl.className = 'list';

    const listHeader = document.createElement('div');
    listHeader.className = 'list-header';

    const listTitle = document.createElement('h3');
    listTitle.contentEditable = true;
    listTitle.textContent = list.title;
    listTitle.addEventListener('input', () => {
      list.title = listTitle.textContent;
    });

    const removeListBtn = document.createElement('button');
    removeListBtn.textContent = '×';
    removeListBtn.addEventListener('click', () => {
      lists = lists.filter(l => l.id !== list.id);
      renderLists();
    });

    listHeader.appendChild(listTitle);
    listHeader.appendChild(removeListBtn);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards';
    // attach list id so Sortable handlers can find the list
    cardsContainer.dataset.listId = list.id;

    list.cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'card-title';
      cardTitle.textContent = card.title;

      const cardDesc = document.createElement('div');
      cardDesc.className = 'card-desc';
      cardDesc.textContent = card.desc;

      const cardLabel = document.createElement('div');
      cardLabel.className = `label ${card.label || ''}`.trim();
      cardLabel.textContent = card.label || '';

      const cardButtons = document.createElement('div');
      cardButtons.className = 'card-buttons';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openCardModal(card));

      const archiveBtn = document.createElement('button');
      archiveBtn.textContent = 'Archive';
      archiveBtn.addEventListener('click', () => archiveCard(list.id, card.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        list.cards = list.cards.filter(c => c.id !== card.id);
        renderLists();
      });

      cardButtons.appendChild(editBtn);
      cardButtons.appendChild(archiveBtn);
      cardButtons.appendChild(deleteBtn);

      cardEl.appendChild(cardTitle);
      cardEl.appendChild(cardDesc);
      if (card.label) cardEl.appendChild(cardLabel);
      cardEl.appendChild(cardButtons);

      cardsContainer.appendChild(cardEl);
    });

    const addCardInput = document.createElement('input');
    addCardInput.className = 'add-card-input';
    addCardInput.placeholder = '+ Add a card';
    addCardInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && addCardInput.value.trim() !== '') {
        createCard(list.id, addCardInput.value.trim(), '', '');
        addCardInput.value = '';
      }
    });

    listEl.appendChild(listHeader);
    listEl.appendChild(cardsContainer);
    listEl.appendChild(addCardInput);
    boardContainer.appendChild(listEl);

    // Make cards sortable
    new Sortable(cardsContainer, {
      group: 'cards',
      animation: 150,
      onEnd: function (evt) {
        // determine source and target lists via dataset
        const fromId = parseInt(evt.from.dataset.listId, 10);
        const toId = parseInt(evt.to.dataset.listId, 10);
        const fromList = lists.find(l => l.id === fromId);
        const toList = lists.find(l => l.id === toId);

        // safety checks
        if (!fromList) return;
        if (!toList) return;

        // remove from source
        const movedCard = fromList.cards.splice(evt.oldIndex, 1)[0];
        if (!movedCard) return;

        // insert into target at newIndex
        toList.cards.splice(evt.newIndex, 0, movedCard);

        renderLists();
      }
    });
  });

  // Make lists sortable
  new Sortable(boardContainer, {
    animation: 150,
    onEnd: function(evt) {
      const movedList = lists.splice(evt.oldIndex, 1)[0];
      lists.splice(evt.newIndex, 0, movedList);
      renderLists();
    }
  });
}

// Card Modal
function openCardModal(card) {
  currentCard = card;
  modalTitle.value = card.title;
  modalDesc.value = card.desc;
  modalLabel.value = card.label || '';
  renderHistory();
  cardModal.style.display = 'flex';
}

function renderHistory() {
  historyList.innerHTML = '';
  if (!currentCard || !currentCard.history) return;
  currentCard.history.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

// Archive
function archiveCard(listId, cardId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;
  const card = list.cards.find(c => c.id === cardId);
  if (!card) return;
  archivedCards.push(card);
  list.cards = list.cards.filter(c => c.id !== cardId);
  renderLists();
  renderArchivedCards();
}

function archiveCardFromModal() {
  if (!currentCard) return;
  lists.forEach(list => {
    list.cards = list.cards.filter(c => c.id !== currentCard.id);
  });
  archivedCards.push(currentCard);
  renderLists();
  renderArchivedCards();
  cardModal.style.display = 'none';
}

function renderArchivedCards() {
  archivedCardsDiv.innerHTML = '';
  archivedCards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.textContent = card.title;
    archivedCardsDiv.appendChild(cardEl);
  });
}

// Event Listeners
modalSave.addEventListener('click', () => {
  if (!currentCard) return;
  // update title/desc/label
  currentCard.title = modalTitle.value.trim();
  currentCard.desc = modalDesc.value.trim();
  currentCard.label = modalLabel.value.trim();
  currentCard.history = currentCard.history || [];
  currentCard.history.push(`Edited at ${new Date().toLocaleString()}`);
  renderLists();
  cardModal.style.display = 'none';
});

modalArchive.addEventListener('click', () => {
  archiveCardFromModal();
});

modalDelete.addEventListener('click', () => {
  if (!currentCard) return;
  lists.forEach(list => {
    list.cards = list.cards.filter(c => c.id !== currentCard.id);
  });
  // also remove from archived if present
  archivedCards = archivedCards.filter(c => c.id !== currentCard.id);
  renderLists();
  renderArchivedCards();
  cardModal.style.display = 'none';
});

closeModal.addEventListener('click', () => {
  cardModal.style.display = 'none';
});

closeArchive.addEventListener('click', () => {
  archivePanel.style.display = 'none';
});

// Event listeners for list creation and archive panel
addListBtn.addEventListener('click', () => {
  const title = prompt('Enter list title:');
  if (title && title.trim() !== '') createList(title.trim());
});

openArchive.addEventListener('click', () => {
  archivePanel.style.display = 'block';
  renderArchivedCards();
});

// Initialize a default list
createList('To Do');
