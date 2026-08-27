import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import AddCartao from "./AddCartao";
import RemoverCartao from "./RemoverCartao";
import React from "react";
import CambioChart from "./CambioChart";
import FinanceChart from "./FinanceChart";
import API_URL from "./config";
import Auth from "./Auth";
import { apiFetch } from "./config";
import LoadingOverlay from "./LoadingOverlay";
import OnboardingOverlay from "./OnboardingOverlay";

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizarMoeda(moeda) {
  if (moeda === "R$") return "BRL";
  if (moeda === "$")  return "USD";
  if (moeda === "€")  return "EUR";
  return moeda;
}

function formatarMoeda(valor, moeda) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
  }).format(valor || 0);
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

const CATEGORIAS_FIXAS = [
  "Moradia", "Mercado", "Restaurante", "Transporte",
  "Saúde", "Assinaturas", "Compras", "Passeio", "Salário", "Adiantamento", "Transferencia", "Outros",
];

const FORM_VAZIO = {
  data: "", descricao: "", valor: "",
  categoria: "", status: "receita", cartoesId: "",
};

const ITENS_POR_PAGINA = 20;

// ─── cor do cartão → HSL ─────────────────────────────────────────────────────

function hexToHsl(hex) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      default: h = ((rn - gn) / d + 4) / 6;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function isBgLight(l) { return l > 40; }

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ mensagem, tipo = "sucesso", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);

  const cores = {
    sucesso: { bg: "rgba(46,125,50,0.93)",  border: "rgba(76,175,80,0.45)",  icon: "✓" },
    erro:    { bg: "rgba(183,28,28,0.93)",  border: "rgba(244,67,54,0.45)",  icon: "✕" },
    info:    { bg: "rgba(21,101,192,0.93)", border: "rgba(33,150,243,0.45)", icon: "ℹ" },
  };
  const c = cores[tipo] || cores.sucesso;

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "13px 18px", borderRadius: 14,
      background: c.bg, border: `1px solid ${c.border}`,
      backdropFilter: "blur(14px)", boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      color: "#fff", fontFamily: "var(--font)", fontSize: "var(--font-md)",
      fontWeight: 600, minWidth: 200, maxWidth: 340,
    }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.18)", fontSize: 13, flexShrink: 0 }}>
        {c.icon}
      </span>
      <span style={{ flex: 1 }}>{mensagem}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
    </div>
  );
}

// ─── Paginação ────────────────────────────────────────────────────────────────

function Paginacao({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null;

  const inicio   = Math.max(1, pagina - 2);
  const fim      = Math.min(totalPaginas, pagina + 2);
  const visiveis = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);

  const btnBase = {
    height: "var(--btn-h)", minWidth: 36, padding: "0 10px",
    borderRadius: "var(--btn-radius)", border: "1px solid transparent",
    background: "transparent", color: "var(--color-text)",
    fontFamily: "var(--font)", fontSize: "var(--font-sm)", fontWeight: 600,
    cursor: "pointer", transition: "background 0.15s, border 0.15s",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 5, marginTop: 20, flexWrap: "wrap", padding: "4px",
      borderRadius: "var(--btn-radius)", border: "var(--glass-border)",
      background: "rgba(255,255,255,0.04)", backdropFilter: "var(--glass-blur)",
      boxShadow: "var(--glass-shadow-in)", width: "fit-content",
      marginLeft: "auto", marginRight: "auto",
    }}>
      <button style={{ ...btnBase, opacity: pagina === 1 ? 0.3 : 1, cursor: pagina === 1 ? "not-allowed" : "pointer" }}
        disabled={pagina === 1} onClick={() => onChange(pagina - 1)}
        onMouseEnter={e => { if (pagina !== 1) e.currentTarget.style.background = "var(--btn-hover-bg)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >‹</button>

      {inicio > 1 && (
        <>
          <button style={btnBase} onClick={() => onChange(1)}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--btn-hover-bg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >1</button>
          {inicio > 2 && <span style={{ color: "var(--color-muted)", fontSize: "var(--font-sm)", padding: "0 2px" }}>…</span>}
        </>
      )}

      {visiveis.map((p) => (
        <button key={p}
          style={{ ...btnBase, background: p === pagina ? "var(--btn-active-bg)" : "transparent", border: p === pagina ? "var(--btn-active-border)" : "1px solid transparent" }}
          onClick={() => onChange(p)}
          onMouseEnter={e => { if (p !== pagina) e.currentTarget.style.background = "var(--btn-hover-bg)"; }}
          onMouseLeave={e => { if (p !== pagina) e.currentTarget.style.background = "transparent"; }}
        >{p}</button>
      ))}

      {fim < totalPaginas && (
        <>
          {fim < totalPaginas - 1 && <span style={{ color: "var(--color-muted)", fontSize: "var(--font-sm)", padding: "0 2px" }}>…</span>}
          <button style={btnBase} onClick={() => onChange(totalPaginas)}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--btn-hover-bg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >{totalPaginas}</button>
        </>
      )}

      <button style={{ ...btnBase, opacity: pagina === totalPaginas ? 0.3 : 1, cursor: pagina === totalPaginas ? "not-allowed" : "pointer" }}
        disabled={pagina === totalPaginas} onClick={() => onChange(pagina + 1)}
        onMouseEnter={e => { if (pagina !== totalPaginas) e.currentTarget.style.background = "var(--btn-hover-bg)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >›</button>

      <span style={{ color: "var(--color-muted)", fontSize: "var(--font-sm)", padding: "0 6px", borderLeft: "1px solid rgba(255,255,255,0.1)", marginLeft: 2, whiteSpace: "nowrap" }}>
        {pagina} / {totalPaginas}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function App() {
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [usuario, setUsuario]               = useState(null);
  const [dados, setDados]                   = useState([]);
  const [cartoes, setCartoes]               = useState([]);
  const [cartaoAtivo, setCartaoAtivo]       = useState(null);
  const [taxas, setTaxas]                   = useState({});
  const [moedaGlobal, setMoedaGlobal]       = useState("BRL");
  const [busca, setBusca]                   = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  // UI toggles
  const [mostrarCartao,       setMostrarCartao]       = useState(false);
  const [mostrarRemover,      setMostrarRemover]      = useState(false);
  const [mostrarForm,         setMostrarForm]         = useState(false);
  const [mostrarCambio,       setMostrarCambio]       = useState(false);
  const tabelaRef                                     = useRef(null);
  const [mostrarHeaderTabela, setMostrarHeaderTabela] = useState(false);

  // ── onboarding ─────────────────────────────────────────────────────────────
  //
  // stepOnboarding:
  //   null → desativado (app rodando normalmente)
  //   1    → spotlight no botão "Adicionar" do header (cartão)
  //   2    → frame sobre o modal AddCartao aberto
  //   3    → spotlight no botão "Adicionar" de lançamento
  //   4    → frame sobre o formulário de lançamento aberto
  //
  const [stepOnboarding, setStepOnboarding] = useState(null);

  // refs dos elementos destacados
  const btnAdicionarCartaoRef = useRef(null); // botão "Adicionar" no header     (step 1)
  const modalAddCartaoRef     = useRef(null); // container do modal AddCartao     (step 2)
  const btnAdicionarLancRef   = useRef(null); // botão "Adicionar" lançamentos    (step 3)
  const formLancamentoRef     = useRef(null); // container do form lançamento     (step 4)

  // qual ref usar no overlay, por step
  const onboardingTargetRef = {
    1: btnAdicionarCartaoRef,
    2: modalAddCartaoRef,
    3: btnAdicionarLancRef,
    4: formLancamentoRef,
  }[stepOnboarding] ?? null;

  // toast
  const [toast, setToast] = useState(null);
  const dispararToast = useCallback((mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });
  }, []);

  // paginação
  const [paginaAtual, setPaginaAtual] = useState(1);

  // seleção / edição
  const [modoSelecao,  setModoSelecao]  = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [modoEdicao,   setModoEdicao]   = useState(false);
  const [idEditando,   setIdEditando]   = useState(null);

  // form
  const [form, setForm] = useState(FORM_VAZIO);
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // datas / período
  const hoje = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);
  const [semestre, setSemestre]             = useState(1);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── fundo dinâmico ────────────────────────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (!cartaoAtivo || cartaoAtivo === "todos") {
      root.style.setProperty("--card-color-h", "220");
      root.style.setProperty("--card-color-s", "20%");
      root.style.setProperty("--card-color-l", "10%");
      body.classList.remove("theme-light");
      return;
    }
    const cartao = cartoes.find((c) => c.id === cartaoAtivo);
    if (!cartao?.cor) {
      root.style.setProperty("--card-color-h", "220");
      root.style.setProperty("--card-color-s", "20%");
      root.style.setProperty("--card-color-l", "10%");
      body.classList.remove("theme-light");
      return;
    }
    try {
      const { h, s, l } = hexToHsl(cartao.cor);
      const lFundo = Math.min(l, 30);
      root.style.setProperty("--card-color-h", String(h));
      root.style.setProperty("--card-color-s", `${Math.max(s, 25)}%`);
      root.style.setProperty("--card-color-l", `${lFundo}%`);
      isBgLight(lFundo) ? body.classList.add("theme-light") : body.classList.remove("theme-light");
    } catch {
      root.style.setProperty("--card-color-h", "220");
      root.style.setProperty("--card-color-s", "20%");
      root.style.setProperty("--card-color-l", "10%");
      body.classList.remove("theme-light");
    }
  }, [cartaoAtivo, cartoes]);

  // ── auth ──────────────────────────────────────────────────────────────────

  function handleLogout() {
    localStorage.removeItem("token");
    setUsuario(null);
    setDados([]);
    setCartoes([]);
    setCartaoAtivo(null);
    setStepOnboarding(null);
  }

  // ── API: taxas de câmbio ──────────────────────────────────────────────────

  useEffect(() => {
    async function carregarTaxas() {
      try {
        const hoje    = new Date();
        const passado = new Date();
        passado.setDate(hoje.getDate() - 3);
        const fmt = (d) => d.toISOString().split("T")[0];
        const res  = await fetch(`https://api.frankfurter.dev/v1/${fmt(passado)}..${fmt(hoje)}?from=EUR&to=BRL,USD`);
        const data = await res.json();
        const ultima = Object.keys(data.rates).pop();
        const rates  = data.rates[ultima];
        setTaxas({ EUR: 1, BRL: rates.BRL, USD: rates.USD });
      } catch (err) { console.error(err); }
    }
    carregarTaxas();
  }, []);

  // ── API: dados ────────────────────────────────────────────────────────────

  const carregarDados = useCallback(async () => {
    try {
      let url = `${API_URL}/lancamentos`;
      if (cartaoAtivo !== "todos") url += `?cartoes=${cartaoAtivo}`;
      const res  = await apiFetch(url);
      const data = await res.json();
      setDados(data.dados || []);
      setPaginaAtual(1);
    } catch (err) { console.error(err); }
  }, [cartaoAtivo]);

  const carregarCartoes = useCallback(async () => {
    try {
      const res  = await apiFetch(`${API_URL}/cartoes`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setCartoes(lista);
      if (lista.length > 0 && cartaoAtivo !== "todos") {
        const existe = lista.find((c) => c.id === cartaoAtivo);
        if (!existe) setCartaoAtivo(lista[0].id);
      }
      return lista;
    } catch (err) {
      console.error(err);
      setCartoes([]);
      return [];
    }
  }, [cartaoAtivo]);

  // carregamento inicial após login
  useEffect(() => {
    if (!usuario) return;
    async function carregarTudo() {
      const tempoMinimo = new Promise((r) => setTimeout(r, 20000));
      const [lista] = await Promise.all([carregarCartoes(), carregarDados(), tempoMinimo]);
      setLoadingInicial(false);

      const listaFinal = Array.isArray(lista) ? lista : [];
      if (listaFinal.length === 0) {
        // Novo usuário sem cartão → começa no step 1
        setStepOnboarding(1);
      }
    }
    carregarTudo();
  }, [usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  // Se tem cartão mas sem lançamentos e onboarding ativo → step 3
  useEffect(() => {
    if (loadingInicial) return;
    if (cartoes.length > 0 && dados.length === 0 && stepOnboarding !== null && stepOnboarding < 3) {
      setStepOnboarding(3);
    }
  }, [cartoes, dados, loadingInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { carregarCartoes(); }, [carregarCartoes]);

  useEffect(() => {
    if (cartaoAtivo) carregarDados();
  }, [cartaoAtivo, carregarDados]);

  // ── conversão ─────────────────────────────────────────────────────────────

  const converter = useCallback(
    (valor, origem, destino) => {
      if (!taxas[origem] || !taxas[destino] || origem === destino) return valor;
      const emEUR = origem === "EUR" ? valor : valor / taxas[origem];
      return destino === "EUR" ? emEUR : emEUR * taxas[destino];
    },
    [taxas]
  );

  const dadosConvertidos = useMemo(() => {
    if (!taxas || !Object.keys(taxas).length) return dados;
    return dados.map((item) => {
      const cartao      = cartoes.find((c) => c.id === item.cartoesId);
      const moedaOrigem = normalizarMoeda(cartao?.moeda || "BRL");
      const valorNum    =
        typeof item.valor === "number"
          ? item.valor
          : Number(
              String(item.valor).includes(",")
                ? String(item.valor).replace(/\./g, "").replace(",", ".")
                : item.valor
            ) || 0;
      return {
        ...item,
        valorConvertido:
          moedaOrigem === moedaGlobal
            ? valorNum
            : converter(valorNum, moedaOrigem, moedaGlobal),
      };
    });
  }, [dados, cartoes, moedaGlobal, taxas, converter]);

  // ── filtros / agregações ──────────────────────────────────────────────────

  const dadosFiltradosPeriodo = dadosConvertidos.filter((item) => {
    if (!item.data) return false;
    const [ano, mes] = item.data.split("T")[0].split("-");
    return Number(ano) === anoSelecionado && Number(mes) === mesSelecionado;
  });

  const receitasConvertidas = dadosFiltradosPeriodo
    .filter((i) => i.status === "receita" && i.categoria !== "Adiantamento" && i.categoria !== "Transferencia")
    .reduce((acc, i) => acc + Number(i.valorConvertido), 0);

  const despesasConvertidas = dadosFiltradosPeriodo
    .filter((i) => i.status === "despesa" && i.categoria !== "Adiantamento" && i.categoria !== "Transferencia")
    .reduce((acc, i) => acc + Number(i.valorConvertido), 0);

  const saldoTotal = dadosConvertidos.reduce((acc, i) => {

    // ignora adiantamentos
    //if (i.categoria === "Adiantamento") {
    //  return acc;
    //}

    if (i.status === "receita") {
      return acc + Number(i.valorConvertido);
    }

    if (i.status === "despesa") {
      return acc - Number(i.valorConvertido);
    }

    return acc;

  }, 0);


  const saldoAdiantamento = dadosConvertidos.reduce((acc, i) => {

    // considera somente adiantamentos
    if (i.categoria !== "Adiantamento") {
      return acc;
    }

    if (i.status === "receita") {
      return acc - Number(i.valorConvertido);
    }

    if (i.status === "despesa") {
      return acc + Number(i.valorConvertido);
    }

    return acc;

  }, 0);

  const dadosFiltrados = dadosConvertidos.filter((item) => {
    const correspondeBusca     = item.descricao?.toLowerCase().includes(busca.toLowerCase());
    const correspondeCategoria = categoriaFiltro === "todas" || item.categoria === categoriaFiltro;
    return correspondeBusca && correspondeCategoria;
  });

  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const dadosPagina  = dadosFiltrados.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA,
    paginaSegura * ITENS_POR_PAGINA
  );

  useEffect(() => { setPaginaAtual(1); }, [busca, categoriaFiltro]);

  const dadosDoAno = dadosConvertidos.filter((item) => {
    if (!item.data) return false;
    return Number(item.data.split("T")[0].split("-")[0]) === anoSelecionado;
  });

  const resumoCategorias = useMemo(() => {
    const res = {};
    CATEGORIAS_FIXAS.forEach((c) => { res[c] = 0; });
    dadosFiltradosPeriodo.forEach((item) => {
      if (!item.categoria) return;
      const v = Number(item.valorConvertido) || 0;
      res[item.categoria] = (res[item.categoria] || 0) + (item.status === "receita" ? v : -v);
    });
    return res;
  }, [dadosFiltradosPeriodo]);

  const anosDisponiveis = useMemo(() =>
    [...new Set(
      dados.filter((i) => i.data).map((i) => Number(i.data.split("T")[0].split("-")[0]))
    )].sort((a, b) => b - a),
    [dados]
  );

  useEffect(() => {
    if (anosDisponiveis.length && !anosDisponiveis.includes(anoSelecionado)) {
      setAnoSelecionado(anosDisponiveis[0]);
    }
  }, [anosDisponiveis, anoSelecionado]);

  useEffect(() => {
    const element = tabelaRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setMostrarHeaderTabela(entry.isIntersecting); },
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => { observer.unobserve(element); };
  }, []);

  // ── formulário ───────────────────────────────────────────────────────────

  function abrirFormNovo() {
    setModoEdicao(false);
    setIdEditando(null);
    setForm(FORM_VAZIO);
    setMostrarForm((v) => !v);
  }

  function fecharForm() {
    setMostrarForm(false);
    setModoEdicao(false);
    setIdEditando(null);
    setForm(FORM_VAZIO);
  }

  function abrirFormEdicao() {
    const id   = selecionados[0];
    const item = dados.find((i) => i.id === id);
    if (!item) return;
    setModoEdicao(true);
    setIdEditando(id);
    setForm({
      data:      item.data?.split("T")[0] || "",
      descricao: item.descricao,
      valor:     item.valor,
      categoria: item.categoria,
      status:    item.status,
      cartoesId: item.cartoesId,
    });
    setMostrarForm(true);
  }

  async function cadastrar(e) {
    e.preventDefault();
    if (!form.cartoesId) { alert("Selecione um cartão!"); return; }
    try {
      const url    = modoEdicao ? `${API_URL}/lancamentos/${idEditando}` : `${API_URL}/lancamentos`;
      const method = modoEdicao ? "PUT" : "POST";
      const res    = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cartoesId: Number(form.cartoesId) }),
      });
      if (!res.ok) { const erro = await res.json(); alert(erro.error); return; }
      fecharForm();
      setSelecionados([]);
      setModoSelecao(false);
      carregarDados();
      dispararToast(modoEdicao ? "Lançamento atualizado!" : "Lançamento salvo!");
      // Conclui onboarding ao salvar o primeiro lançamento
      if (stepOnboarding === 4 || stepOnboarding === 3) setStepOnboarding(null);
    } catch (err) {
      console.error(err);
      dispararToast("Erro ao salvar lançamento.", "erro");
    }
  }

  async function excluirSelecionados() {
    if (!window.confirm("Excluir selecionados?")) return;
    const qtd = selecionados.length;
    try {
      await Promise.all(
        selecionados.map((id) =>
          apiFetch(`${API_URL}/lancamentos/${id}`, { method: "DELETE" })
        )
      );
      setSelecionados([]);
      setModoSelecao(false);
      carregarDados();
      dispararToast(`${qtd} lançamento${qtd !== 1 ? "s" : ""} excluído${qtd !== 1 ? "s" : ""}!`, "info");
    } catch (err) {
      console.error(err);
      dispararToast("Erro ao excluir.", "erro");
    }
  }

  // ── handlers onboarding ──────────────────────────────────────────────────

  // Clicou no spotlight ou no botão de ação principal do balão
  function handleOnboardingDismiss() {
    if (stepOnboarding === 1) {
      // Abre o modal de criar cartão → avança para step 2
      if (cartoes.length >= 3) { alert("Limite de 3 cartões atingido."); return; }
      setMostrarCartao(true);
      setStepOnboarding(2);
    } else if (stepOnboarding === 3) {
      // Abre o formulário de lançamento → avança para step 4
      setMostrarForm(true);
      setStepOnboarding(4);
      setTimeout(() => {
        tabelaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  // Clicou em "Mais tarde" (steps 1 e 3)
  function handleOnboardingSkip() {
    setStepOnboarding(null);
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (!usuario) return <Auth onLogin={setUsuario} />;

  return (
    <>
      {loadingInicial && <LoadingOverlay nome={usuario?.nome} />}

      {/* ── ONBOARDING ── */}
      {!loadingInicial && stepOnboarding !== null && onboardingTargetRef && (
        <OnboardingOverlay
          step={stepOnboarding}
          targetRef={onboardingTargetRef}
          onDismiss={handleOnboardingDismiss}
          onSkip={handleOnboardingSkip}
        />
      )}

      {toast && (
        <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />
      )}

      <div>
        {/* ── HEADER ── */}
        <header className={`header ${mostrarHeaderTabela ? "hidden" : ""}`}>

          {!isMobile && (
            <div className="header-left">
              <div className="currency-buttons">
                {["BRL", "USD", "EUR"].map((m) => (
                  <button key={m} className={moedaGlobal === m ? "active" : ""} onClick={() => setMoedaGlobal(m)}>
                    {m === "BRL" ? "Real" : m === "USD" ? "Dollar" : "Euro"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <nav className="header-center">
            {!isMobile ? (
              <ul>
                <li>
                  <button className={cartaoAtivo === "todos" ? "active" : ""} onClick={() => setCartaoAtivo("todos")}>
                    Consolidado
                  </button>
                </li>

                {cartoes.map((c) => (
                  <li key={c.id}>
                    <button
                      className={cartaoAtivo === c.id ? "active" : ""}
                      onClick={() => setCartaoAtivo(c.id)}
                      style={cartaoAtivo === c.id && c.cor
                        ? { borderColor: `${c.cor}55`, background: `${c.cor}22`, boxShadow: `0 0 10px ${c.cor}44` }
                        : {}
                      }
                    >
                      {c.cor && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c.cor, marginRight: 6, flexShrink: 0 }} />}
                      {c.nome}
                    </button>
                  </li>
                ))}

                {/* ← ref step 1: spotlight aqui */}
                <li>
                  <button
                    ref={btnAdicionarCartaoRef}
                    className="action-btn"
                    onClick={() => {
                      if (cartoes.length >= 3) { alert("Limite de 3 cartões atingido."); return; }
                      setMostrarCartao(true);
                      if (stepOnboarding === 1) setStepOnboarding(2);
                    }}
                  >
                    Adicionar
                  </button>
                </li>

                <li>
                  <button className="action-btn" onClick={() => setMostrarRemover(true)}>Remover</button>
                </li>
              </ul>
            ) : (
              <div className="button-mm-yy">
                <select
                  value={cartaoAtivo || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCartaoAtivo(v === "todos" ? "todos" : Number(v));
                  }}
                >
                  <option value="todos">Consolidado</option>
                  {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <ul>
                  <li>
                    <button
                      ref={stepOnboarding === 1 ? btnAdicionarCartaoRef : undefined}
                      className="action-btn"
                      onClick={() => {
                        if (cartoes.length >= 3) { alert("Limite de 3 cartões atingido."); return; }
                        setMostrarCartao(true);
                        if (stepOnboarding === 1) setStepOnboarding(2);
                      }}
                    >Adicionar</button>
                  </li>
                  <li>
                    <button className="action-btn" onClick={() => setMostrarRemover(true)}>Remover</button>
                  </li>
                </ul>
              </div>
            )}
          </nav>

          <div className="header-right">
            <button className="btn-logout" onClick={handleLogout}>Sair</button>
          </div>
        </header>

        {isMobile && (
          <div className="mobile-currency-wrapper">
            <div className="currency-buttons">
              {["BRL", "USD", "EUR"].map((m) => (
                <button key={m} className={moedaGlobal === m ? "active" : ""} onClick={() => setMoedaGlobal(m)}>
                  {m === "BRL" ? "Real" : m === "USD" ? "Dollar" : "Euro"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="main-box">
          <div className="layout">

            {/* cards */}
            <div className="left">

              <div className="box saldo">
                <strong>Saldo</strong>
                <span>{formatarMoeda(saldoTotal, moedaGlobal)}</span>
              </div>

              <div className="box-adiantamento">
                <strong>Adiantamento</strong>
                <span>
                  {formatarMoeda(saldoAdiantamento, moedaGlobal)}
                </span>
              </div>

              <div className="box receita">
                <strong>Receitas</strong>
                <span>{formatarMoeda(receitasConvertidas, moedaGlobal)}</span>
              </div>

              <div className="box despesa">
                <strong>Despesas</strong>
                <span>{formatarMoeda(Math.abs(despesasConvertidas), moedaGlobal)}</span>
              </div>

            </div>
            {/* gráficos */}
            <div className="right">
              <div className="top">
                <div className="top-bar">
                  <div className="actions-buttons">
                    <button className={!mostrarCambio ? "active" : ""} onClick={() => setMostrarCambio(false)}>Mensal</button>
                    <button className={mostrarCambio ? "active" : ""} onClick={() => setMostrarCambio(true)}>Câmbio</button>
                  </div>
                  {!mostrarCambio && (
                    <div className="button-mm-yy">
                      <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))}>
                        {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      {isMobile && (
                        <select value={semestre} onChange={(e) => setSemestre(Number(e.target.value))}>
                          <option value={1}>Jan - Jun</option>
                          <option value={2}>Jul - Dez</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
                {mostrarCambio
                  ? <CambioChart />
                  : <FinanceChart dados={dadosDoAno} moeda={moedaGlobal} isMobile={isMobile} semestre={semestre} />
                }
              </div>
            </div>
          </div>

          {/* tabela categorias */}
          <div className="main-tab-categorias">
            <div className="button-mm-yy">
              <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))}>
                {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))}>
                {["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((nome, i) => (
                  <option key={i + 1} value={i + 1}>{nome}</option>
                ))}
              </select>
            </div>

            <table className="tabela-categorias">
              <thead>
                <tr>
                  <th>Categoria</th><th>Total</th>
                  {!isMobile && <><th>Categoria</th><th>Total</th></>}
                </tr>
              </thead>
              <tbody>
                {isMobile ? (
                  Object.entries(resumoCategorias).map(([cat, val], i) => (
                    <tr key={i}>
                      <td>{cat}</td>
                      <td style={{ color: val >= 0 ? "var(--color-receita)" : "var(--color-despesa)", fontWeight: 700 }}>
                        {formatarMoeda(Math.abs(val), moedaGlobal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  Object.entries(resumoCategorias)
                    .reduce((acc, curr, i, arr) => { if (i % 2 === 0) acc.push([curr, arr[i + 1]]); return acc; }, [])
                    .map((par, i) => (
                      <tr key={i}>
                        <td>{par[0][0]}</td>
                        <td style={{ color: par[0][1] >= 0 ? "var(--color-receita)" : "var(--color-despesa)", fontWeight: 700 }}>
                          {formatarMoeda(Math.abs(par[0][1]), moedaGlobal)}
                        </td>
                        {par[1] ? (
                          <>
                            <td>{par[1][0]}</td>
                            <td style={{ color: par[1][1] >= 0 ? "var(--color-receita)" : "var(--color-despesa)", fontWeight: 700 }}>
                              {formatarMoeda(Math.abs(par[1][1]), moedaGlobal)}
                            </td>
                          </>
                        ) : <><td /><td /></>}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* lançamentos */}
          <div className="box-tabela-search" ref={tabelaRef}>

            <div className="dvSearch">
              <div className="dvSearch-filtros">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <div className="button-mm-yy categoria-filtro">
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    aria-label="Filtrar por categoria"
                  >
                    <option value="todas">Todas as categorias</option>
                    {CATEGORIAS_FIXAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="actions-buttons">
                {/* ← ref step 3: spotlight aqui */}
                <button
                  ref={btnAdicionarLancRef}
                  onClick={() => {
                    abrirFormNovo();
                    // Se estava no step 3, avança para step 4 ao abrir o form
                    if (stepOnboarding === 3) {
                      setStepOnboarding(4);
                    }
                  }}
                >
                  {mostrarForm && !modoEdicao ? "Fechar" : "Adicionar"}
                </button>
                <button
                  className={modoSelecao ? "active" : ""}
                  onClick={() => { setModoSelecao((v) => !v); setSelecionados([]); }}
                >
                  {modoSelecao ? "Cancelar" : "Selecionar"}
                </button>
                <button disabled={selecionados.length !== 1} onClick={abrirFormEdicao}>Editar</button>
                <button disabled={selecionados.length === 0} onClick={excluirSelecionados}>Excluir</button>
              </div>
            </div>

            {/* ← ref step 4: frame ao redor do form */}
            {mostrarForm && (
              <div ref={formLancamentoRef} className="form-lancamento">
                <form onSubmit={cadastrar}>
                  <div className="form-lancamento-grid">
                    <div>
                      <label className="form-label">Data</label>
                      <input type="date" value={form.data} onChange={setField("data")} required />
                    </div>
                    <div>
                      <label className="form-label">Categoria</label>
                      <select value={form.categoria} onChange={setField("categoria")} required>
                        <option value="">Selecione...</option>
                        {CATEGORIAS_FIXAS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="span-2">
                      <label className="form-label">Descrição</label>
                      <input type="text" placeholder="Ex: Conta de luz" value={form.descricao} onChange={setField("descricao")} required />
                    </div>
                    <div>
                      <label className="form-label">Valor</label>
                      <input type="number" placeholder="0,00" step="0.01" value={form.valor} onChange={setField("valor")} required />
                    </div>
                    <div>
                      <label className="form-label">Cartão</label>
                      <select value={form.cartoesId} onChange={setField("cartoesId")} required>
                        <option value="">Selecione...</option>
                        {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Tipo</label>
                      <select value={form.status} onChange={setField("status")}>
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-lancamento-actions">
                    <button type="submit" className="btn-cadastrar">
                      {modoEdicao ? "Salvar alterações" : "Cadastrar"}
                    </button>
                    <button type="button" className="btn-cancelar" onClick={fecharForm}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            {mostrarHeaderTabela && (
              <div className="header-tabela-fixo">
                <div className="actions-buttons">
                  <button onClick={abrirFormNovo}>{mostrarForm && !modoEdicao ? "Fechar" : "Adicionar"}</button>
                  <button className={modoSelecao ? "active" : ""} onClick={() => { setModoSelecao((v) => !v); setSelecionados([]); }}>
                    {modoSelecao ? "Cancelar" : "Selecionar"}
                  </button>
                  <button disabled={selecionados.length !== 1} onClick={abrirFormEdicao}>Editar</button>
                  <button disabled={selecionados.length === 0} onClick={excluirSelecionados}>Excluir</button>
                </div>
              </div>
            )}

            {/* tabela */}
            <div className="table-wrapper">
              <table className="dvTabela">
                <thead>
                  <tr>
                    {modoSelecao && <th />}
                    <th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPagina.length === 0 ? (
                    <tr>
                      <td colSpan={modoSelecao ? 6 : 5} style={{ textAlign: "center", padding: "20px" }}>
                        Nenhuma informação encontrada...
                      </td>
                    </tr>
                  ) : (
                    dadosPagina.map((item) => (
                      <tr key={item.id} className={selecionados.includes(item.id) ? "selecionado" : ""}>
                        {modoSelecao && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selecionados.includes(item.id)}
                              onChange={(e) =>
                                setSelecionados((prev) =>
                                  e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                                )
                              }
                            />
                          </td>
                        )}
                        <td>{formatarData(item.data)}</td>
                        <td>{item.descricao}</td>
                        <td>{item.categoria}</td>
                        <td>{formatarMoeda(Number(item.valorConvertido), moedaGlobal)}</td>
                        <td>
                          <span className="badge" style={{
                            background: item.status === "receita" ? "rgba(76,175,80,0.18)" : "rgba(244,67,54,0.18)",
                            color:      item.status === "receita" ? "var(--color-receita)" : "var(--color-despesa)",
                          }}>
                            {item.status === "receita" ? "Receita" : "Despesa"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Paginacao
              pagina={paginaSegura}
              totalPaginas={totalPaginas}
              onChange={(p) => {
                setPaginaAtual(p);
                tabelaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />

            {dadosFiltrados.length > 0 && (
              <p style={{ textAlign: "center", marginTop: 8, fontSize: "var(--font-sm)", color: "var(--color-muted)" }}>
                {dadosFiltrados.length} lançamento{dadosFiltrados.length !== 1 ? "s" : ""} no total
              </p>
            )}
          </div>
        </div>

        {/* ← ref step 2: frame ao redor do modal AddCartao */}
        {mostrarCartao && (
          <div ref={modalAddCartaoRef} style={{ position: "fixed", inset: 0, zIndex: stepOnboarding === 2 ? 3500 : 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AddCartao
              onClose={() => {
                setMostrarCartao(false);
                // Se fechou sem criar → volta para step 1
                if (stepOnboarding === 2 && cartoes.length === 0) setStepOnboarding(1);
              }}
              onCreated={async () => {
                const lista = await carregarCartoes();
                setMostrarCartao(false);
                // Criou o primeiro cartão → avança para step 3
                if (stepOnboarding === 2 && lista && lista.length > 0) {
                  setStepOnboarding(3);
                  setTimeout(() => {
                    tabelaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 400);
                }
              }}
            />
          </div>
        )}

        {mostrarRemover && (
          <RemoverCartao
            onClose={() => setMostrarRemover(false)}
            cartoes={cartoes}
            onDeleted={() => { carregarCartoes(); carregarDados(); }}
          />
        )}
      </div>
    </>
  );
}

export default App;