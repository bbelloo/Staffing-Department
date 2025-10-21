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
  let currentCard = null;

  loadBoard();

  addListBtn.addEventListener("click", () => {
    const name = prompt("List name:");
    if (!name) return;
    const list = createList(name);
    boardContainer.appendChild(list);
    saveBoard();
  });

  function createList(title) {
    const list = document.createElement("div");
    list.className = "list";

    const header = document.createElement("div");
    header.className = "list-header";

    const h3 = document.createElement("h3"); h3.innerText = title;
    const delBtn = document.createElement("button"); delBtn.innerText = "×";
    delBtn.onclick = () => { if(confirm("Delete list?")) { list.remove(); saveBoard(); } };
    
    const showArchivedBtn = document.createElement("button");
    showArchivedBtn.innerText = "Show Archived";
    let showingArchived = false;
    showArchivedBtn.onclick = () => {
      showingArchived = !showingArchived;
      list.querySelectorAll(".card").forEach(card=>{
        if(card.dataset.archived==="true"){
          card.style.display = showingArchived ? "flex" : "none";
        }
      });
      showArchivedBtn.innerText = showingArchived ? "Hide Archived" : "Show Archived";
    };

    header.append(h3, delBtn, showArchivedBtn);
    list.appendChild(header);

    const cards = document.createElement("div"); cards.className="cards";
    list.appendChild(cards);

    const input = document.createElement("input");
    input.placeholder="+ Add a card..."; input.className="add-card-input";
    input.addEventListener("keypress", e => {
      if(e.key==="Enter" && input.value.trim()!==""){
        const card=createCard(input.value.trim());
        cards.appendChild(card); input.value="";
        saveBoard();
      }
    });
    list.appendChild(input);

    new Sortable(cards,{ group:"shared", animation:200, onEnd:saveBoard });

    return list;
  }

  function createCard(title, desc="", labelColor=""){
    const card = document.createElement("div"); card.className="card"; card.dataset.archived="false";
    const cardTitle = document.createElement("div"); cardTitle.className="card-title"; cardTitle.innerText=title;
    const cardDesc = document.createElement("div"); cardDesc.className="card-desc"; cardDesc.innerText=desc;

    let label=null;
    if(["red","green","blue","yellow","purple"].includes(labelColor)){
      label=document.createElement("span"); label.className=`label ${labelColor}`; label.innerText=labelColor;
    }

    const picker=document.createElement("select"); picker.className="label-picker";
    ["","red","green","blue","yellow","purple"].forEach(c=>{
      const opt=document.createElement("option"); opt.value=c; opt.innerText=c===""?"No label":c;
      if(c===labelColor) opt.selected=true; picker.appendChild(opt);
    });
    picker.addEventListener("change", ()=>{
      if(label) label.remove();
      if(picker.value){ const l=document.createElement("span"); l.className=`label ${picker.value}`; l.innerText=picker.value; card.insertBefore(l, cardTitle); label=l; } else label=null;
      saveBoard();
    });

    const buttons=document.createElement("div"); buttons.className="card-buttons";
    const edit=document.createElement("button"); edit.innerText="Edit";
    edit.onclick=()=>openModal(card);
    const archive=document.createElement("button"); archive.innerText="Archive";
    archive.onclick=()=>{ card.style.display="none"; card.dataset.archived="true"; saveBoard(); };
    const del=document.createElement("button"); del.innerText="Delete";
    del.onclick=()=>{ if(confirm("Delete permanently?")){ card.remove(); saveBoard(); } };
    buttons.append(edit,archive,del);

    if(label) card.appendChild(label);
    card.append(cardTitle,cardDesc,picker,buttons);

    attachModal(card);
    return card;
  }

  function attachModal(card){
    card.onclick=e=>{
      if(!e.target.closest("button") && !e.target.closest("select")) openModal(card);
    };
  }

  function openModal(card){
    currentCard=card; modal.style.display="flex";
    modalTitle.value=card.querySelector(".card-title").innerText;
    modalDesc.value=card.querySelector(".card-desc").innerText;
    const labelEl=card.querySelector(".label");
    modalLabel.value = labelEl ? labelEl.className.split(" ")[1] : "";
  }

  closeModal.onclick = ()=> modal.style.display="none";
  window.onclick = e=>{ if(e.target===modal) modal.style.display="none"; };

  modalSave.onclick = ()=>{
    currentCard.querySelector(".card-title").innerText=modalTitle.value;
    currentCard.querySelector(".card-desc").innerText=modalDesc.value;
    let labelEl=currentCard.querySelector(".label"); if(labelEl) labelEl.remove();
    if(modalLabel.value){ const l=document.createElement("span"); l.className=`label ${modalLabel.value}`; l.innerText=modalLabel.value; currentCard.insertBefore(l,currentCard.querySelector(".card-title")); }
    saveBoard(); modal.style.display="none";
  };
  modalArchive.onclick=()=>{
    currentCard.style.display="none"; currentCard.dataset.archived="true"; saveBoard(); modal.style.display="none";
  };
  modalDelete.onclick=()=>{
    if(confirm("Delete permanently?")){ currentCard.remove(); saveBoard(); modal.style.display="none"; }
  };

  function saveBoard(){
    const data=[];
    document.querySelectorAll(".list").forEach(l=>{
      const listTitle=l.querySelector("h3").innerText;
      const cardsData=[];
      l.querySelectorAll(".card").forEach(c=>{
        const title=c.querySelector(".card-title").innerText;
        const desc=c.querySelector(".card-desc").innerText;
        const labelEl=c.querySelector(".label");
        const label=labelEl?labelEl.className.split(" ")[1]:"";
        const archived=c.dataset.archived==="true";
        cardsData.push({title,desc,label,archived});
      });
      data.push({listTitle,cards:cardsData});
    });
    localStorage.setItem("ultraBoard",JSON.stringify(data));
  }

  function loadBoard(){
    const data=JSON.parse(localStorage.getItem("ultraBoard")||"[]");
    data.forEach(l=>{
      const list=createList(l.listTitle);
      boardContainer.appendChild(list);
      l.cards.forEach(c=>{
        const card=createCard(c.title,c.desc,c.label);
        if(c.archived){ card.style.display="none"; card.dataset.archived="true"; }
        list.querySelector(".cards").appendChild(card);
      });
    });
  }
});
