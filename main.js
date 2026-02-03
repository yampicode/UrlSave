/* Estado y utilidades */
const STORAGE_KEY = "bookmarks.v1";
let bookmarks = [];

/* Inicialización */
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  renderList();

  const form = document.getElementById("bookmark-form");
  form.addEventListener("submit", onSubmit);

  const list = document.getElementById("bookmark-list");
  list.addEventListener("click", onListClick);

  registerServiceWorker();
});

/* Handlers */
function onSubmit(e){
  e.preventDefault();
  const input = document.getElementById("url-input");
  const raw = input.value.trim();
  if(!raw) return;
  try{
    const { url, origin, hostname } = normalizeUrl(raw);
    const name = prettifyHost(hostname);
    const favicon = getFaviconUrl(origin);
    const item = { id: cryptoRandomId(), name, url, favicon };
    bookmarks.unshift(item);
    saveToStorage();
    renderList();
    input.value = "";
    input.focus();
  }catch(err){
    alert("URL inválida. Ejemplo: https://ejemplo.com");
  }
}

function onListClick(e){
  const btn = e.target.closest("button");
  if(!btn) return;
  const li = e.target.closest(".bookmark-item");
  const id = li?.dataset?.id;
  if(!id) return;

  const action = btn.dataset.action;
  if(action === "delete"){
    bookmarks = bookmarks.filter(b => b.id !== id);
    saveToStorage();
    renderList();
  }else if(action === "edit"){
    openEditDialog(id);
  }
}

/* Edición */
function openEditDialog(id){
  const item = bookmarks.find(b => b.id === id);
  if(!item) return;
  const dialog = document.getElementById("edit-dialog");
  const form = document.getElementById("edit-form");
  const nameInput = document.getElementById("edit-name");
  const urlInput = document.getElementById("edit-url");

  nameInput.value = item.name;
  urlInput.value = item.url;

  dialog.showModal();

  form.onclose = null;
  form.onsubmit = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // dialog returns value via button value attr, but we just save directly
    const newName = nameInput.value.trim();
    const newUrlRaw = urlInput.value.trim();
    try{
      const { url, origin } = normalizeUrl(newUrlRaw);
      item.name = newName || item.name;
      item.url = url;
      item.favicon = getFaviconUrl(origin);
      saveToStorage();
      renderList();
      dialog.close();
    }catch(err){
      alert("URL inválida al editar. Verifica el formato.");
    }
  });
}

/* Render */
function renderList(){
  const list = document.getElementById("bookmark-list");
  list.innerHTML = "";
  const tpl = document.getElementById("bookmark-item-template");

  bookmarks.forEach(item => {
    const node = tpl.content.cloneNode(true);
    const li = node.querySelector(".bookmark-item");
    const a = node.querySelector(".bookmark-link");
    const img = node.querySelector(".favicon");
    const name = node.querySelector(".name");
    const url = node.querySelector(".url");

    li.dataset.id = item.id;
    a.href = item.url;
    img.src = item.favicon;
    img.alt = `Favicon de ${item.name}`;
    name.textContent = item.name;
    url.textContent = item.url;

    list.appendChild(node);
  });
}

/* Storage */
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    bookmarks = raw ? JSON.parse(raw) : [];
  }catch{
    bookmarks = [];
  }
}
function saveToStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

/* Helpers */
function normalizeUrl(raw){
  // Si falta protocolo, asumimos https
  let urlStr = raw;
  if(!/^https?:\/\//i.test(urlStr)){
    urlStr = "https://" + urlStr;
  }
  const u = new URL(urlStr);
  return { url: u.href, origin: u.origin, hostname: u.hostname };
}
function prettifyHost(hostname){
  // Convierte "www.ejemplo.com" -> "Ejemplo"
  const parts = hostname.replace(/^www\./i,"").split(".");
  const base = parts[0] || hostname;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
function getFaviconUrl(origin){
  // Servicio de favicons de Google: soporta la mayoría de dominios
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=64`;
}
function cryptoRandomId(){
  // ID simple
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* PWA */
function registerServiceWorker(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
}