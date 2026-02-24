// Sanatório Bukowski — Calculadora de Vendas
// Regras:
// - Itens com faixa (mín/máx): total mínimo usa MIN, total máximo usa MAX
// - Modo PISTA: itens com faixa são calculados no MAX (ou seja, o total mínimo vira igual ao máximo nesses itens)

const PRODUTOS = [
  { id: "colt45", nome: "Pistola Colt .45", min: 25000, max: 35000 },
  { id: "m1911", nome: "Pistola M1911", min: 35000, max: 45000 },
  { id: "skorpion", nome: "Sub Skorpion VZ61", min: 50000, max: 50000 },
  { id: "ap", nome: "Pistola AP", min: 50000, max: 50000 },
  { id: "uzi", nome: "Sub Uzi", min: 50000, max: 50000 },
  { id: "mtar21", nome: "Sub M-TAR 21", min: 70000, max: 70000 },
  { id: "ak103", nome: "Fuzil AK-103", min: 110000, max: 110000 },
  { id: "spas12", nome: "Escopeta SPAS-12", min: 120000, max: 120000 },
  { id: "g36c", nome: "Fuzil G36C", min: 140000, max: 140000 },
  { id: "parafal", nome: "Fuzil FN Parafal", min: 160000, max: 160000 },
];

let carrinho = load("sb_carrinho", {}); // { [id]: qtd }
let pista = load("sb_pista", false);

const elLista = document.getElementById("listaProdutos");
const elTotalMin = document.getElementById("totalMin");
const elTotalMax = document.getElementById("totalMax");
const elItens = document.getElementById("itensCarrinho");
const elVazio = document.getElementById("carrinhoVazio");
const elTogglePista = document.getElementById("togglePista");

const btnLimpar = document.getElementById("limparCarrinho");
const btnSalvar = document.getElementById("salvar");

const btnInfo = document.getElementById("btnInfo");
const modalInfo = document.getElementById("modalInfo");
const fecharInfo = document.getElementById("fecharInfo");

// init
elTogglePista.checked = !!pista;
renderProdutos();
renderTudo();

// events
elTogglePista.addEventListener("change", () => {
  pista = elTogglePista.checked;
  save("sb_pista", pista);
  renderTudo();
});

btnLimpar.addEventListener("click", () => {
  carrinho = {};
  save("sb_carrinho", carrinho);
  renderTudo();
});

btnSalvar.addEventListener("click", () => {
  save("sb_carrinho", carrinho);
  alert("✅ Salvo!");
});

btnInfo.addEventListener("click", () => modalInfo.showModal());
fecharInfo.addEventListener("click", () => modalInfo.close());

function renderProdutos(){
  elLista.innerHTML = "";
  for (const p of PRODUTOS){
    const qtd = carrinho[p.id] ?? 0;

    const faixa = (p.min !== p.max)
      ? `Faixa: <strong>${fmtBRL(p.min)}</strong> — <strong>${fmtBRL(p.max)}</strong>`
      : `Preço: <strong>${fmtBRL(p.max)}</strong>`;

    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <div class="left">
        <div class="name">${p.nome}</div>
        <div class="meta">${faixa}</div>
      </div>

      <div class="qty">
        <button data-act="minus" data-id="${p.id}">−</button>
        <input data-act="input" data-id="${p.id}" inputmode="numeric" value="${qtd}" />
        <button data-act="plus" data-id="${p.id}">+</button>
      </div>
    `;
    elLista.appendChild(div);
  }

  elLista.querySelectorAll("button, input").forEach(el => {
    const id = el.getAttribute("data-id");
    const act = el.getAttribute("data-act");

    if (act === "plus") el.addEventListener("click", () => setQtd(id, (carrinho[id] ?? 0) + 1));
    if (act === "minus") el.addEventListener("click", () => setQtd(id, Math.max(0, (carrinho[id] ?? 0) - 1)));
    if (act === "input"){
      el.addEventListener("input", (e) => {
        const n = Number(String(e.target.value).replace(/\D/g, "")) || 0;
        setQtd(id, n);
      });
    }
  });
}

function renderTudo(){
  const resumo = calcular();
  elTotalMin.textContent = fmtBRL(resumo.totalMin);
  elTotalMax.textContent = fmtBRL(resumo.totalMax);
  renderCarrinho(resumo.itens);
  renderProdutos();
}

function renderCarrinho(itens){
  elItens.innerHTML = "";
  if (!itens.length){
    elVazio.style.display = "block";
    return;
  }
  elVazio.style.display = "none";

  for (const it of itens){
    const row = document.createElement("div");
    row.className = "cart-item";

    const faixaTxt = (it.min !== it.max)
      ? `${fmtBRL(it.min)} — ${fmtBRL(it.max)}`
      : `${fmtBRL(it.max)}`;

    row.innerHTML = `
      <div>
        <div><strong>${it.nome}</strong> × ${it.qtd}</div>
        <div class="muted" style="font-size:12px;">${faixaTxt}</div>
      </div>
      <div style="text-align:right;">
        <div><strong>${fmtBRL(it.subMin)}</strong></div>
        <div class="muted" style="font-size:12px;">Máx: ${fmtBRL(it.subMax)}</div>
      </div>
    `;
    elItens.appendChild(row);
  }
}

function calcular(){
  let totalMin = 0;
  let totalMax = 0;
  const itens = [];

  for (const p of PRODUTOS){
    const qtd = carrinho[p.id] ?? 0;
    if (!qtd) continue;

    const useMin = (p.min !== p.max) ? p.min : p.max;
    const useMax = p.max;

    // Se pista, o mínimo vira máximo para itens com faixa
    const precoMinCalculado = (pista && p.min !== p.max) ? p.max : useMin;

    const subMin = precoMinCalculado * qtd;
    const subMax = useMax * qtd;

    totalMin += subMin;
    totalMax += subMax;

    itens.push({
      id: p.id, nome: p.nome, qtd,
      min: useMin, max: useMax,
      subMin, subMax
    });
  }

  return { totalMin, totalMax, itens };
}

function setQtd(id, qtd){
  carrinho[id] = qtd;
  if (carrinho[id] <= 0) delete carrinho[id];
  save("sb_carrinho", carrinho);
  renderTudo();
}

function fmtBRL(v){
  return (v || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}
