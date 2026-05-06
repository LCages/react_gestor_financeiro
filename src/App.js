import { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import AddCartao from "./AddCartao";
import RemoverCartao from "./RemoverCartao";
import React from "react";
import CambioChart from "./CambioChart";
import FinanceChart from "./FinanceChart";
import { useMemo } from "react";
import API_URL from "./config";
import Auth from "./Auth";
import { apiFetch } from "./config";
import LoadingOverlay from "./LoadingOverlay";

function App() {
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [semestre, setSemestre] = useState(1); // 1 = Jan-Jun | 2 = Jul-Dez
  const [dados, setDados] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [cartaoAtivo, setCartaoAtivo] = useState(null);

  const [mostrarCartao, setMostrarCartao] = useState(false);
  const [mostrarRemover, setMostrarRemover] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [busca, setBusca] = useState("");

  // FORM
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("receita");
  const [cartoesId, setCartoesId] = useState("");


  const [mostrarCambio, setMostrarCambio] = useState(false);
  const hoje = new Date();

  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);

  const [selecionados, setSelecionados] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false);

  const [moedaGlobal, setMoedaGlobal] = useState("BRL");
  const [taxas, setTaxas] = useState({});

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    if (!usuario) return;

    async function carregarTudo() {
      const tempoMinimo = new Promise((resolve) =>
        setTimeout(resolve, 20000)
      );

      const carregarAPI = Promise.all([
        carregarCartoes(),
        carregarDados()
      ]);

      await Promise.all([tempoMinimo, carregarAPI]);

      setLoadingInicial(false);
    }

    carregarTudo();
  }, [usuario, carregarCartoes, carregarDados]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔥 LOGOUT
  function handleLogout() {
    localStorage.removeItem("token");
    setUsuario(null);
    setDados([]);
    setCartoes([]);
    setCartaoAtivo(null);
  }

  function normalizarMoeda(moeda) {
    if (moeda === "R$") return "BRL";
    if (moeda === "$") return "USD";
    if (moeda === "€") return "EUR";
    return moeda;
  }

  function formatarMoeda(valor, moeda) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: moeda,
    }).format(valor || 0);
  }

  const simboloMoeda = moedaGlobal;

  // 🔥 carregar lançamentos
  const carregarDados = useCallback(async () => {
    try {
      let url = `${API_URL}/lancamentos`;

      if (cartaoAtivo !== "todos") {
        url += `?cartoes=${cartaoAtivo}`;
      }

      const response = await apiFetch(url);
      const data = await response.json();

      setDados(data.dados || []);

    } catch (error) {
      console.error(error);
    }
  }, [cartaoAtivo]);

  // 🔥 carregar cartões
  const carregarCartoes = useCallback(async () => {
  try {
    const res = await apiFetch(`${API_URL}/cartoes`);
    const data = await res.json();

    // 🔥 proteção correta
    const lista = Array.isArray(data) ? data : [];
    setCartoes(lista);

    if (lista.length > 0) {
      if (cartaoAtivo === "todos") return;
      const existe = lista.find(c => c.id === cartaoAtivo);
      if (!existe) setCartaoAtivo(lista[0].id);
    }
  } catch (error) {
    console.error(error);
    setCartoes([]); // 🔥 garante array mesmo em erro de rede
  }
}, [cartaoAtivo]);

  function formatarData(dataISO) {
    if (!dataISO) return "";

    const dataLimpa = dataISO.split("T")[0]; // remove hora
    const [ano, mes, dia] = dataLimpa.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  useEffect(() => {
    carregarCartoes();
  }, [carregarCartoes]);

  useEffect(() => {
    if (cartaoAtivo) {
      carregarDados();
    } 
  }, [cartaoAtivo, carregarDados]);

  // 🔥 cadastrar lançamento
  async function cadastrar(e) {
    e.preventDefault();

    if (!cartoesId) {
      alert("Selecione um cartão!");
      return;
    }

    try {
      let url = `${API_URL}/lancamentos`;
      let method = "POST";

      if (modoEdicao) {
        url += `/${idEditando}`;
        method = "PUT";
      }

      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          descricao,
          valor,
          categoria,
          status,
          cartoesId: Number(cartoesId),
        }),
      });

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.error);
        return;
      }

      // 🔥 reset
      setDescricao("");
      setValor("");
      setCategoria("");
      setStatus("receita");
      setCartoesId("");
      setMostrarForm(false);

      setModoEdicao(false);
      setIdEditando(null);
      setSelecionados([]);

      carregarDados();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }
  }

    const converter = useCallback((valor, moedaOrigem, moedaDestino) => {
    if (!taxas || !taxas[moedaOrigem] || !taxas[moedaDestino]) {
      return valor;
    }

    if (moedaOrigem === moedaDestino) return valor;

    let emEUR = moedaOrigem === "EUR"
      ? valor
      : valor / taxas[moedaOrigem];

    return moedaDestino === "EUR"
      ? emEUR
      : emEUR * taxas[moedaDestino];
  }, [taxas]);

  const dadosConvertidos = useMemo(() => {

    if (!taxas || Object.keys(taxas).length === 0) return dados;

    return dados.map(item => {
      const cartao = cartoes.find(c => c.id === item.cartoesId);
      const moedaOrigem = normalizarMoeda(cartao?.moeda || "BRL");

      const valorNumerico =
        typeof item.valor === "number"
          ? item.valor
          : Number(
              String(item.valor).includes(",")
                ? String(item.valor)
                    .replace(/\./g, "") // milhar
                    .replace(",", ".")  // decimal BR
                : item.valor // já está correto (ex: 24.00)
            ) || 0;

      const valorConvertido =
        moedaOrigem === moedaGlobal
          ? valorNumerico
          : converter(valorNumerico, moedaOrigem, moedaGlobal);

      return {
        ...item,
        valorConvertido
      };
    });

  }, [dados, cartoes, moedaGlobal, taxas, converter]);

  const dadosFiltradosPeriodo = dadosConvertidos.filter(item => {
    if (!item.data) return false;

    const [ano, mes] = item.data.split("T")[0].split("-");

    return (
      Number(ano) === anoSelecionado &&
      Number(mes) === mesSelecionado
    );
  });

  const receitasConvertidas = dadosFiltradosPeriodo
    .filter(i => i.status === "receita")
    .reduce((acc, i) =>
      acc + Number(i.valorConvertido), 0
    );

  const despesasConvertidas = dadosFiltradosPeriodo
    .filter(i => i.status === "despesa")
    .reduce((acc, i) =>
      acc + Number(i.valorConvertido), 0
    );

  const saldoTotal = dadosConvertidos.reduce((acc, item) => {
    const valor = Number(item.valorConvertido) || 0;

    if (item.status === "receita") {
      return acc + valor;
    } else {
      return acc - valor;
    }
  }, 0);

  // 🔥 filtro busca (seguro)
  const dadosFiltrados = (dadosConvertidos || []).filter((item) =>
    item.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const dadosDoAno = dadosConvertidos.filter(item => {
    if (!item.data) return false;

    const dataLimpa = item.data.split("T")[0];
    const [ano] = dataLimpa.split("-");

    return Number(ano) === anoSelecionado;
  });

  const categoriasFixas = [
    'Moradia',
    'Mercado',
    'Restaurante',
    'Transporte',
    'Saúde',
    'Assinaturas',
    'Compras',
    'Passeio',
    'Salário',
    'Outros'
  ];

  const resumoCategorias = {};

  // 🔥 inicia todas com 0
  categoriasFixas.forEach(cat => {
    resumoCategorias[cat] = 0;
  });

  // 🔥 soma os dados reais
  dadosFiltradosPeriodo.forEach((item) => {
    if (!item.categoria) return;

    const valor = Number(item.valorConvertido) || 0;

    if (item.status === "receita") {
      resumoCategorias[item.categoria] += valor;
    } else {
      resumoCategorias[item.categoria] -= valor;
    }
  
  });

  const anosDisponiveis = [
    ...new Set(
      dados
        .filter(item => item.data)
        .map(item => Number(item.data.split("T")[0].split("-")[0]))
    )
  ].sort((a, b) => b - a);

  useEffect(() => {
    if (anosDisponiveis.length === 0) return;

    if (!anosDisponiveis.includes(anoSelecionado)) {
      setAnoSelecionado(anosDisponiveis[0]);
    }
  }, [anosDisponiveis, anoSelecionado]);

  useEffect(() => {
    async function carregarTaxas() {
    try {
      const hoje = new Date();
      const passado = new Date();
      passado.setDate(hoje.getDate() - 3); // últimos 3 dias bastam

      const formatar = (d) => d.toISOString().split("T")[0];

      const url = `https://api.frankfurter.dev/v1/${formatar(passado)}..${formatar(hoje)}?from=EUR&to=BRL,USD`;

      const res = await fetch(url); // 🔥 direto
      const data = await res.json();

      const ultimaData = Object.keys(data.rates).pop();
      const rates = data.rates[ultimaData];

      setTaxas({
        EUR: 1,
        BRL: rates.BRL,
        USD: rates.USD
      });

    } catch (err) {
      console.error(err);
    }
  }

  carregarTaxas();
  }, []);

  if (!usuario) {
    return <Auth onLogin={setUsuario} />;
  }
  
  return (
    <>
      {loadingInicial && (
        <LoadingOverlay nome={usuario?.nome} />
      )}
      <div>

        {/* HEADER */}
        <header className="header">

          {/* 🔥 ESQUERDA (moeda) */}
          {!isMobile && (
            <div className="header-left">
              <div className="currency-buttons">
                <button
                  className={moedaGlobal === "BRL" ? "active" : ""}
                  onClick={() => setMoedaGlobal("BRL")}
                >
                  Real
                </button>

                <button
                  className={moedaGlobal === "USD" ? "active" : ""}
                  onClick={() => setMoedaGlobal("USD")}
                >
                  Dollar
                </button>

                <button
                  className={moedaGlobal === "EUR" ? "active" : ""}
                  onClick={() => setMoedaGlobal("EUR")}
                >
                  Euro
                </button>
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
                    className="action-btn add"
                    onClick={() => {
                      if (cartoes.length >= 3) {
                        alert("Você já atingiu o limite de 3 cartões.");
                        return;
                      }
                      setMostrarCartao(true);
                    }}
                  >
                    Adicionar
                  </button>
                </li>

                <li>
                  <button
                    className="action-btn remove"
                    onClick={() => setMostrarRemover(true)}
                  >
                    Remover
                  </button>
                </li>
              </ul>
            ) : (
              // 🔥 MOBILE = SELECT
              <div className="button-mm-yy">
                <select
                  value={cartaoAtivo || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCartaoAtivo(value === "todos" ? "todos" : Number(value));
                  }}
                >
                  <option value="todos">Consolidado</option>

                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>

                <ul>
                  <li>
                    <button
                      className="action-btn add"
                      onClick={() => {
                        if (cartoes.length >= 3) {
                          alert("Você já atingiu o limite de 3 cartões.");
                          return;
                        }
                        setMostrarCartao(true);
                      }}
                    >
                      Adicionar
                    </button>
                  </li>

                  <li>
                    <button
                      className="action-btn remove"
                      onClick={() => setMostrarRemover(true)}
                    >
                      Remover
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </nav>

          {/* 🔥 DIREITA (logout) */}
          <div className="header-right">
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>

        </header>

        {isMobile && (
          <div className="mobile-currency-wrapper">
            <div className="currency-buttons">
              <button
                className={moedaGlobal === "BRL" ? "active" : ""}
                onClick={() => setMoedaGlobal("BRL")}
              >
                Real
              </button>

              <button
                className={moedaGlobal === "USD" ? "active" : ""}
                onClick={() => setMoedaGlobal("USD")}
              >
                Dollar
              </button>

              <button
                className={moedaGlobal === "EUR" ? "active" : ""}
                onClick={() => setMoedaGlobal("EUR")}
              >
                Euro
              </button>
            </div>
          </div>
        )}

        <div className="main-box">

          <div className="layout">

            {/* ESQUERDA (25%) */}
            <div className="left">

              <div className="box saldo">
                <strong>Saldo</strong>
                <span>
                  {formatarMoeda(saldoTotal, simboloMoeda)}
                </span>
              </div>

              <div className="box receita">
                <strong>Receitas</strong>
                <span>
                  {formatarMoeda(receitasConvertidas, simboloMoeda)}
                </span>
              </div>

              <div className="box despesa">
                <strong>Despesas</strong>
                <span>
                  {formatarMoeda(Math.abs(despesasConvertidas), simboloMoeda)}
                </span>
              </div>

            </div>

            {/* DIREITA (75%) */}
            <div className="right">

              {/* PARTE DE CIMA */}
              <div className="top">

                <div className="top-bar">
    
                  {/* BOTÕES */}
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

                  {/* ANO */}
                    {!mostrarCambio && (
                      <div className="button-mm-yy">
                        <select
                          value={anoSelecionado}
                          onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                        >
                          {anosDisponiveis.map((ano) => (
                            <option key={ano} value={ano}>
                              {ano}
                            </option>
                          ))}
                        </select>

                        {/* 🔥 NOVO SELECT (só mobile) */}
                        {isMobile && !mostrarCambio && (
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

                {/* CONTEÚDO */}
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


          <div className="main-tab-categorias">

            <div className="button-mm-yy">

                {/* ANO */}
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                >
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>

                {/* MÊS */}
                <select
                  value={mesSelecionado}
                  onChange={(e) => {
                    const novoMes = Number(e.target.value);
                    setMesSelecionado(novoMes);
                  }}
                >
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
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
                    Object.entries(resumoCategorias).map(([categoria, valor], index) => (
                      <tr key={index}>
                        <td>{categoria}</td>
                        <td style={{
                          color: valor >= 0 ? "green" : "red",
                          fontWeight: "bold"
                        }}>
                          {formatarMoeda(Math.abs(valor), simboloMoeda)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    Object.entries(resumoCategorias)
                      .reduce((acc, curr, i, arr) => {
                        if (i % 2 === 0) {
                          acc.push([curr, arr[i + 1]]);
                        }
                        return acc;
                      }, [])
                      .map((par, index) => (
                        <tr key={index}>
                          <td>{par[0][0]}</td>
                          <td style={{
                            color: par[0][1] >= 0 ? "green" : "red",
                            fontWeight: "bold"
                          }}>
                            {formatarMoeda(Math.abs(par[0][1]), simboloMoeda)}
                          </td>

                          {par[1] ? (
                            <>
                              <td>{par[1][0]}</td>
                              <td style={{
                                color: par[1][1] >= 0 ? "green" : "red",
                                fontWeight: "bold"
                              }}>
                                {formatarMoeda(Math.abs(par[1][1]), simboloMoeda)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td></td>
                            </>
                          )}
                        </tr>
                      ))
                  )}
                </tbody>
              </table>

          </div>


          <div className="box-tabela-search">
            <div className="dvSearch">
              <input
                type="text"
                className="form-control"
                placeholder=" Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />

              <div className="actions-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => setMostrarForm(!mostrarForm)}
                >
                  {mostrarForm ? "Fechar" : "Adicionar"}
                </button>

                <button
                  className={`btn ${modoSelecao ? "btn-warning" : "btn-secondary"}`}
                  onClick={() => {
                    setModoSelecao(!modoSelecao);
                    setSelecionados([]);
                  }}
                >
                  {modoSelecao ? "Cancelar seleção" : "Selecionar"}
                </button>

                <button
                  className={`btn-edit ${modoEdicao ? "active" : ""}`}
                  disabled={selecionados.length !== 1}
                  onClick={() => {
                    const id = selecionados[0];
                    const item = dados.find(i => i.id === id);

                    if (!item) return;

                    setModoEdicao(true);
                    setIdEditando(id);

                    // 🔥 preenche form
                    setData(item.data?.split("T")[0] || "");
                    setDescricao(item.descricao);
                    setValor(item.valor);
                    setCategoria(item.categoria);
                    setStatus(item.status);
                    setCartoesId(item.cartoesId);

                    setMostrarForm(true);
                  }}
                >
                  Editar
                </button>

                <button
                  className="btn-delete"
                  disabled={selecionados.length === 0}
                  onClick={async () => {
                    if (!window.confirm("Excluir selecionados?")) return;

                    await Promise.all(
                      selecionados.map(id =>
                        apiFetch(`${API_URL}/lancamentos/${id}`, {
                          method: "DELETE"
                        })
                      )
                    );

                    setSelecionados([]);
                    setModoSelecao(false);
                    carregarDados();
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>

            {mostrarForm && (
              <form onSubmit={cadastrar} className="card p-3 mt-3">

                <input
                  type="date"
                  className="form-control mb-2"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />

                <select
                  className="form-control mb-2"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                >
                  <option value="">Categoria</option>
                  <option>Salário</option>
                  <option>Moradia</option>
                  <option>Mercado</option>
                  <option>Restaurante</option>
                  <option>Assinaturas</option>
                  <option>Passeio</option>
                  <option>Saúde</option>
                  <option>Transporte</option>
                  <option>Compras</option>
                  <option>Outros</option>
                </select>

                <input
                  type="text"
                  placeholder="Descrição"
                  className="form-control mb-2"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />

                <input
                  type="number"
                  placeholder="Valor"
                  step="0.01"
                  className="form-control mb-2"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />

                <select
                  className="form-control mb-2"
                  value={cartoesId}
                  onChange={(e) => setCartoesId(e.target.value)}
                  required
                >
                  <option value="">Cartão</option>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>

                <select
                  className="form-control mb-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>

                <button className="btn btn-success">
                  {modoEdicao ? "Salvar Alterações" : "Cadastrar"}
                </button>

                {modoEdicao && (
                  <button
                    type="button"
                    className="btn btn-secondary mt-2"
                    onClick={() => {
                      setModoEdicao(false);
                      setIdEditando(null);
                      setMostrarForm(false);
                    }}
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            )}

            <div className="table-wrapper">
              <table className="dvTabela">
                <thead>
                  <tr>
                    {modoSelecao && <th></th>}
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {dadosFiltrados.map((item) => (
                    <tr key={item.id} style={{
                      backgroundColor: selecionados.includes(item.id)
                        ? "#ffe5e5"
                        : "transparent"
                    }}>
                      {modoSelecao && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selecionados.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelecionados([...selecionados, item.id]);
                              } else {
                                setSelecionados(selecionados.filter(id => id !== item.id));
                              }
                            }}
                          />
                        </td>
                      )}
                      <td>{formatarData(item.data)}</td>
                      <td>{item.descricao}</td>
                      <td>{item.categoria}</td>
                      <td>
                        {formatarMoeda(
                          Number(item.valorConvertido),
                          simboloMoeda
                        )}
                      </td>

                      <td>
                        {item.status === "receita" ? (
                          <span className="badge bg-success"> </span>
                        ) : (
                          <span className="badge bg-danger"> </span>
                        )}
                      </td>
                    </tr>
                  ))}
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
          onDeleted={() => {
            carregarCartoes();
            carregarDados();
          }}
        />
      )}

      </div>
    
    </>

  );
}

export default App;