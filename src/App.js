import { useEffect, useState, useCallback, useMemo } from "react";
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
  "Saúde", "Assinaturas", "Compras", "Passeio", "Salário", "Outros",
];
 
const FORM_VAZIO = {
  data: "", descricao: "", valor: "",
  categoria: "", status: "receita", cartoesId: "",
};
 
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
 
  // UI toggles
  const [mostrarCartao,  setMostrarCartao]  = useState(false);
  const [mostrarRemover, setMostrarRemover] = useState(false);
  const [mostrarForm,    setMostrarForm]    = useState(false);
  const [mostrarCambio,  setMostrarCambio]  = useState(false);
 
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
 
  // ── auth ──────────────────────────────────────────────────────────────────
 
  function handleLogout() {
    localStorage.removeItem("token");
    setUsuario(null);
    setDados([]);
    setCartoes([]);
    setCartaoAtivo(null);
  }
 
  // ── API: taxas de câmbio ──────────────────────────────────────────────────
 
  useEffect(() => {
    async function carregarTaxas() {
      try {
        const hoje     = new Date();
        const passado  = new Date();
        passado.setDate(hoje.getDate() - 3);
        const fmt = (d) => d.toISOString().split("T")[0];
        const res  = await fetch(
          `https://api.frankfurter.dev/v1/${fmt(passado)}..${fmt(hoje)}?from=EUR&to=BRL,USD`
        );
        const data = await res.json();
        const ultima = Object.keys(data.rates).pop();
        const rates  = data.rates[ultima];
        setTaxas({ EUR: 1, BRL: rates.BRL, USD: rates.USD });
      } catch (err) {
        console.error(err);
      }
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
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
      setCartoes([]);
    }
  }, [cartaoAtivo]);
 
  // carregamento inicial após login
  useEffect(() => {
    if (!usuario) return;
    async function carregarTudo() {
      const tempoMinimo = new Promise((r) => setTimeout(r, 20000));
      await Promise.all([tempoMinimo, carregarCartoes(), carregarDados()]);
      setLoadingInicial(false);
    }
    carregarTudo();
  }, [usuario]); // eslint-disable-line react-hooks/exhaustive-deps
 
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
 
  const receitasConvertidas  = dadosFiltradosPeriodo
    .filter((i) => i.status === "receita")
    .reduce((acc, i) => acc + Number(i.valorConvertido), 0);
 
  const despesasConvertidas  = dadosFiltradosPeriodo
    .filter((i) => i.status === "despesa")
    .reduce((acc, i) => acc + Number(i.valorConvertido), 0);
 
  const saldoTotal = dadosConvertidos.reduce(
    (acc, i) =>
      i.status === "receita"
        ? acc + Number(i.valorConvertido)
        : acc - Number(i.valorConvertido),
    0
  );
 
  const dadosFiltrados = dadosConvertidos.filter((item) =>
    item.descricao?.toLowerCase().includes(busca.toLowerCase())
  );
 
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
 
  // ── formulário de lançamento ──────────────────────────────────────────────
 
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
      data:       item.data?.split("T")[0] || "",
      descricao:  item.descricao,
      valor:      item.valor,
      categoria:  item.categoria,
      status:     item.status,
      cartoesId:  item.cartoesId,
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
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }
  }
 
  async function excluirSelecionados() {
    if (!window.confirm("Excluir selecionados?")) return;
    await Promise.all(
      selecionados.map((id) =>
        apiFetch(`${API_URL}/lancamentos/${id}`, { method: "DELETE" })
      )
    );
    setSelecionados([]);
    setModoSelecao(false);
    carregarDados();
  }
 
  // ── render ────────────────────────────────────────────────────────────────
 
  if (!usuario) return <Auth onLogin={setUsuario} />;
 
  return (
    <>
      {loadingInicial && <LoadingOverlay nome={usuario?.nome} />}
 
      <div>
        {/* ── HEADER ── */}
        <header className="header">
 
          {!isMobile && (
            <div className="header-left">
              <div className="currency-buttons">
                {["BRL", "USD", "EUR"].map((m) => (
                  <button
                    key={m}
                    className={moedaGlobal === m ? "active" : ""}
                    onClick={() => setMoedaGlobal(m)}
                  >
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
                  <button
                    className={cartaoAtivo === "todos" ? "active" : ""}
                    onClick={() => setCartaoAtivo("todos")}
                  >
                    Consolidado
                  </button>
                </li>
 
                {cartoes.map((c) => (
                  <li key={c.id}>
                    <button
                      className={cartaoAtivo === c.id ? "active" : ""}
                      onClick={() => setCartaoAtivo(c.id)}
                    >
                      {c.nome}
                    </button>
                  </li>
                ))}
 
                <li>
                  <button
                    className="action-btn"
                    onClick={() => {
                      if (cartoes.length >= 3) { alert("Limite de 3 cartões atingido."); return; }
                      setMostrarCartao(true);
                    }}
                  >
                    Adicionar
                  </button>
                </li>
 
                <li>
                  <button className="action-btn" onClick={() => setMostrarRemover(true)}>
                    Remover
                  </button>
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
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
 
                <ul>
                  <li>
                    <button
                      className="action-btn"
                      onClick={() => {
                        if (cartoes.length >= 3) { alert("Limite de 3 cartões atingido."); return; }
                        setMostrarCartao(true);
                      }}
                    >
                      Adicionar
                    </button>
                  </li>
                  <li>
                    <button className="action-btn" onClick={() => setMostrarRemover(true)}>
                      Remover
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </nav>
 
          <div className="header-right">
            <button className="btn-logout" onClick={handleLogout}>Sair</button>
          </div>
        </header>
 
        {/* moeda no mobile */}
        {isMobile && (
          <div className="mobile-currency-wrapper">
            <div className="currency-buttons">
              {["BRL", "USD", "EUR"].map((m) => (
                <button
                  key={m}
                  className={moedaGlobal === m ? "active" : ""}
                  onClick={() => setMoedaGlobal(m)}
                >
                  {m === "BRL" ? "Real" : m === "USD" ? "Dollar" : "Euro"}
                </button>
              ))}
            </div>
          </div>
        )}
 
        <div className="main-box">
 
          {/* ── LAYOUT PRINCIPAL ── */}
          <div className="layout">
 
            {/* ESQUERDA — cards */}
            <div className="left">
              <div className="box saldo">
                <strong>Saldo</strong>
                <span>{formatarMoeda(saldoTotal, moedaGlobal)}</span>
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
 
            {/* DIREITA — gráficos */}
            <div className="right">
              <div className="top">
                <div className="top-bar">
                  <div className="actions-buttons">
                    <button
                      className={!mostrarCambio ? "active" : ""}
                      onClick={() => setMostrarCambio(false)}
                    >
                      Mensal
                    </button>
                    <button
                      className={mostrarCambio ? "active" : ""}
                      onClick={() => setMostrarCambio(true)}
                    >
                      Câmbio
                    </button>
                  </div>
 
                  {!mostrarCambio && (
                    <div className="button-mm-yy">
                      <select
                        value={anoSelecionado}
                        onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                      >
                        {anosDisponiveis.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
 
                      {isMobile && (
                        <select
                          value={semestre}
                          onChange={(e) => setSemestre(Number(e.target.value))}
                        >
                          <option value={1}>Jan - Jun</option>
                          <option value={2}>Jul - Dez</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
 
                {mostrarCambio ? (
                  <CambioChart />
                ) : (
                  <FinanceChart
                    dados={dadosDoAno}
                    moeda={moedaGlobal}
                    isMobile={isMobile}
                    semestre={semestre}
                  />
                )}
              </div>
            </div>
          </div>
 
          {/* ── TABELA CATEGORIAS ── */}
          <div className="main-tab-categorias">
            <div className="button-mm-yy">
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              >
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
 
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(Number(e.target.value))}
              >
                {[
                  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
                ].map((nome, i) => (
                  <option key={i + 1} value={i + 1}>{nome}</option>
                ))}
              </select>
            </div>
 
            <table className="tabela-categorias">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Total</th>
                  {!isMobile && <th>Categoria</th>}
                  {!isMobile && <th>Total</th>}
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
                    .reduce((acc, curr, i, arr) => {
                      if (i % 2 === 0) acc.push([curr, arr[i + 1]]);
                      return acc;
                    }, [])
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
                        ) : (
                          <><td /><td /></>
                        )}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
 
          {/* ── LANÇAMENTOS ── */}
          <div className="box-tabela-search">
 
            {/* barra de busca + ações */}
            <div className="dvSearch">
              <input
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
 
              <div className="actions-buttons">
                <button onClick={abrirFormNovo}>
                  {mostrarForm && !modoEdicao ? "Fechar" : "Adicionar"}
                </button>
 
                <button
                  className={modoSelecao ? "active" : ""}
                  onClick={() => { setModoSelecao((v) => !v); setSelecionados([]); }}
                >
                  {modoSelecao ? "Cancelar" : "Selecionar"}
                </button>
 
                <button
                  disabled={selecionados.length !== 1}
                  onClick={abrirFormEdicao}
                >
                  Editar
                </button>
 
                <button
                  disabled={selecionados.length === 0}
                  onClick={excluirSelecionados}
                >
                  Excluir
                </button>
              </div>
            </div>
 
            {/* ── FORMULÁRIO SLIDEDOWN ── */}
            {mostrarForm && (
              <div className="form-lancamento">
                <form onSubmit={cadastrar}>
                  <div className="form-lancamento-grid">
 
                    <div>
                      <label className="form-label">Data</label>
                      <input
                        type="date"
                        value={form.data}
                        onChange={setField("data")}
                        required
                      />
                    </div>
 
                    <div>
                      <label className="form-label">Categoria</label>
                      <select
                        value={form.categoria}
                        onChange={setField("categoria")}
                        required
                      >
                        <option value="">Selecione...</option>
                        {CATEGORIAS_FIXAS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
 
                    <div className="span-2">
                      <label className="form-label">Descrição</label>
                      <input
                        type="text"
                        placeholder="Ex: Conta de luz"
                        value={form.descricao}
                        onChange={setField("descricao")}
                        required
                      />
                    </div>
 
                    <div>
                      <label className="form-label">Valor</label>
                      <input
                        type="number"
                        placeholder="0,00"
                        step="0.01"
                        value={form.valor}
                        onChange={setField("valor")}
                        required
                      />
                    </div>
 
                    <div>
                      <label className="form-label">Cartão</label>
                      <select
                        value={form.cartoesId}
                        onChange={setField("cartoesId")}
                        required
                      >
                        <option value="">Selecione...</option>
                        {cartoes.map((c) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
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
                    <button type="button" className="btn-cancelar" onClick={fecharForm}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
 
            {/* ── TABELA DE LANÇAMENTOS ── */}
            <div className="table-wrapper">
              <table className="dvTabela">
                <thead>
                  <tr>
                    {modoSelecao && <th />}
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
 
                <tbody>
                  {dadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={modoSelecao ? 6 : 5} style={{ textAlign: "center", padding: "20px" }}>
                        Nenhuma informação encontrada...
                      </td>
                    </tr>
                  ) : (
                    dadosFiltrados.map((item) => (
                      <tr
                        key={item.id}
                        className={selecionados.includes(item.id) ? "selecionado" : ""}
                      >
                        {modoSelecao && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selecionados.includes(item.id)}
                              onChange={(e) =>
                                setSelecionados((prev) =>
                                  e.target.checked
                                    ? [...prev, item.id]
                                    : prev.filter((id) => id !== item.id)
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
                          <span
                            className="badge"
                            style={{
                              background:
                                item.status === "receita"
                                  ? "rgba(76,175,80,0.18)"
                                  : "rgba(244,67,54,0.18)",
                              color:
                                item.status === "receita"
                                  ? "var(--color-receita)"
                                  : "var(--color-despesa)",
                            }}
                          >
                            {item.status === "receita" ? "Receita" : "Despesa"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
 
        {mostrarCartao && (
          <AddCartao
            onClose={() => setMostrarCartao(false)}
            onCreated={carregarCartoes}
          />
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