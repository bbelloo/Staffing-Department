// -------------------------------
// Ella's Last Brain Cell - Script
// Single Global Board Version
// -------------------------------

// DOM Elements
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
const archivedCardsContainer = document.getElementById('archived-cards');

// -------------------------------
// Data
// -------------------------------
let boardData = JSON.parse(localStorage.getItem('boardData')) || [];
boardData = boardData.map(list => ({
  name: list.name || 'Untitled List',
  cards: Array.isArray(list.cards) ? list.cards : []
}));

let archivedCards = JSON.parse(localStorage.getItem('archivedCards')) || [];
let currentEdit = null;

// -------------------------------
// Save Data
// -------------------------------
function saveData() {
  localStorage.setItem('boardData', JSON.stringify(boardData));
  localStorage.setItem('archivedCards', JSON.stringify(archivedCards));
}

// -------------------------------
// Render Board
// -------------------------------
function renderBoard() {
  boardContainer.innerHTML = '';

  boardData.forEach((list, listIndex) => {
    const listEl = document.createElement('div');
    listEl.classList.add('list');

    // Header
    const header = document.createElement('div');
    header.classList.add('list-header');
    const titleEl = document.createElement('h3');
    titleEl.textContent = list.name;
    titleEl.contentEditable = true;
    titleEl.addEventListener('blur', () => {
      list.name = titleEl.textContent.trim() || 'Untitled List';
      saveData();
    });
    header.appendChild(titleEl);

    const deleteListBtn = document.createElement('button');
    deleteListBtn.textContent = '×';
    deleteListBtn.addEventListener('click', () => deleteList(listIndex));
    header.appendChild(deleteListBtn);
    listEl.appendChild(header);

    // Cards Container
    const cardsEl = document.createElement('div');
    cardsEl.classList.add('cards');
    list.cards.forEach((card, cardIndex) => {
      cardsEl.appendChild(createCardElement(card, listIndex, cardIndex));
    });
    listEl.appendChild(cardsEl);

    // Add Card Input
    const addCardInput = document.createElement('input');
    addCardInput.classList.add('add-card-input');
    addCardInput.placeholder = '+ Add a card';
    addCardInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter' && addCardInput.value.trim() !== ''){
        list.cards.push({title: addCardInput.value.trim(), desc:'', label:'', history:[]});
        addCardInput.value = '';
        saveData();
        renderBoard();
      }
    });
    listEl.appendChild(addCardInput);

    boardContainer.appendChild(listEl);

    // Drag-and-drop cards
    new Sortable(cardsEl, {
      group: 'shared',
      animation: 150,
      onEnd: saveData
    });
  });

  // Drag-and-drop lists
  new Sortable(boardContainer, {
    animation: 150,
    onEnd: saveData
  });
}

// -------------------------------
// Card Functions
// -------------------------------
function createCardElement(card, listIndex, cardIndex) {
  const cardEl = document.createElement('div');
  cardEl.classList.add('card');

  const titleEl = document.createElement('div');
  titleEl.classList.add('card-title');
  titleEl.textContent = card.title || 'Untitled Card';
  cardEl.appendChild(titleEl);

  if(card.label){
    const labelEl = document.createElement('div');
    labelEl.classList.add('label', card.label);
    labelEl.textContent = card.label;
    cardEl.appendChild(labelEl);
  }

  if(card.desc){
    const descEl = document.createElement('div');
    descEl.classList.add('card-desc');
    descEl.textContent = card.desc;
    cardEl.appendChild(descEl);
  }

  const btnContainer = document.createElement('div');
  btnContainer.classList.add('card-buttons');

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', ()=> openCardModal(listIndex, cardIndex));

  const archiveBtn = document.createElement('button');
  archiveBtn.textContent = 'Archive';
  archiveBtn.addEventListener('click', ()=> archiveCard(listIndex, cardIndex));

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', ()=> deleteCard(listIndex, cardIndex));

  btnContainer.append(editBtn, archiveBtn, deleteBtn);
  cardEl.appendChild(btnContainer);

  return cardEl;
}

// -------------------------------
// Modal Functions
// -------------------------------
function openCardModal(listIndex, cardIndex){
  currentEdit = {listIndex, cardIndex};
  const card = boardData[listIndex].cards[cardIndex];
  modalTitle.value = card.title || '';
  modalDesc.value = card.desc || '';
  modalLabel.value = card.label || '';
  renderHistory(card);
  cardModal.style.display = 'flex';
}

function closeCardModal(){
  currentEdit = null;
  cardModal.style.display = 'none';
}

function renderHistory(card){
  historyList.innerHTML = '';
  if(!card.history) card.history = [];
  card.history.forEach(item=>{
    const li = document.createElement('li');
    li.textContent = item;
    historyList.appendChild(li);
  });
}

// -------------------------------
// Modal Buttons
// -------------------------------
modalSave.addEventListener('click', ()=>{
  if(currentEdit){
    const {listIndex, cardIndex} = currentEdit;
    const card = boardData[listIndex].cards[cardIndex];

    if(modalDesc.value !== card.desc) card.history.push(`Desc updated: ${modalDesc.value}`);
    if(modalLabel.value !== card.label) card.history.push(`Label updated: ${modalLabel.value}`);

    card.title = modalTitle.value.trim() || 'Untitled Card';
    card.desc = modalDesc.value;
    card.label = modalLabel.value;
    saveData();
    renderBoard();
    closeCardModal();
  }
});

modalArchive.addEventListener('click', ()=>{
  if(currentEdit){
    const {listIndex, cardIndex} = currentEdit;
    archiveCard(listIndex, cardIndex);
    closeCardModal();
  }
});

modalDelete.addEventListener('click', ()=>{
  if(currentEdit){
    const {listIndex, cardIndex} = currentEdit;
    deleteCard(listIndex, cardIndex);
    closeCardModal();
  }
});

closeModal.addEventListener('click', closeCardModal);
window.addEventListener('click', (e)=> { if(e.target === cardModal) closeCardModal(); });

// -------------------------------
// Archive
// -------------------------------
function archiveCard(listIndex, cardIndex){
  const card = boardData[listIndex].cards.splice(cardIndex,1)[0];
  archivedCards.push(card);
  saveData();
  renderBoard();
  renderArchived();
}

function renderArchived(){
  archivedCardsContainer.innerHTML = '';
  archivedCards.forEach(card=>{
    const el = document.createElement('div');
    el.classList.add('card');
    el.textContent = card.title || 'Untitled';
    archivedCardsContainer.appendChild(el);
  });
}

openArchive.addEventListener('click', ()=> archivePanel.style.display='block');
closeArchive.addEventListener('click', ()=> archivePanel.style.display='none');

// -------------------------------
// List Functions
// -------------------------------
addListBtn.addEventListener('click', ()=>{
  const name = prompt('Enter list name:');
  if(name && name.trim() !== ''){
    boardData.push({name: name.trim(), cards: []});
    saveData();
    renderBoard();
  }
});

function deleteList(listIndex){
  if(confirm('Delete this list?')){
    boardData.splice(listIndex,1);
    saveData();
    renderBoard();
  }
}

// -------------------------------
// Initial Render
// -------------------------------
renderBoard();
renderArchived();
