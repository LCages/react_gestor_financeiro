import { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import AddCartao from "./AddCartao";
import RemoverCartao from "./RemoverCartao";
import React from "react";
import CambioChart from "./CambioChart";
import FinanceChart from "./FinanceChart";

function App() {
  const [dados, setDados] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [cartaoAtivo, setCartaoAtivo] = useState(null);

  const [mostrarCartao, setMostrarCartao] = useState(false);
  const [mostrarRemover, setMostrarRemover] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);

  const [busca, setBusca] = useState("");

  // FORM
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("receita");
  const [cartoesId, setCartoesId] = useState("");


  const [mostrarCambio, setMostrarCambio] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState(2026);

  const [selecionados, setSelecionados] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false);

  // 🔥 carregar lançamentos
  const carregarDados = useCallback(async () => {
    try {
      let url = "http://localhost:3001/api/lancamentos";

      if (cartaoAtivo) {
        url += `?cartoes=${cartaoAtivo}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      setDados(data.dados || []);
      setReceitas(data.receitas || 0);
      setDespesas(data.despesas || 0);
      setValorTotal(data.valor_total || 0);

    } catch (error) {
      console.error(error);
    }
  }, [cartaoAtivo]);

  // 🔥 carregar cartões
  const carregarCartoes = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/cartoes");
      const data = await res.json();

      setCartoes(data || []);

      if (data.length > 0) {
        const existe = data.find(c => c.id === cartaoAtivo);

        if (!existe) {
          setCartaoAtivo(data[0].id);
        }
      }

    } catch (error) {
      console.error(error);
    }
  }, [cartaoAtivo]);

  function formatarData(dataISO) {
    if (!dataISO) return "";
    return new Date(dataISO).toLocaleDateString("pt-BR");
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
      const res = await fetch("http://localhost:3001/api/lancamentos", {
        method: "POST",
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

      // reset form
      setDescricao("");
      setValor("");
      setCategoria("");
      setStatus("receita");
      setCartoesId("");
      setMostrarForm(false);

      carregarDados();

    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar");
    }
  }

  // 🔥 deletar
  async function deletar(id) {
    if (!window.confirm("Excluir?")) return;

    await fetch(`http://localhost:3001/api/lancamentos/${id}`, {
      method: "DELETE",
    });

    carregarDados();
  }

  // 🔥 filtro busca (seguro)
  const dadosFiltrados = (dados || []).filter((item) =>
    item.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const dadosDoAno = dados.filter(item => {
    if (!item.data) return false;
    return new Date(item.data).getFullYear() === anoSelecionado;
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
  (dados || []).forEach((item) => {
    if (!item.categoria) return;

    const valor = Number(item.valor) || 0;

    if (item.status === "receita") {
      resumoCategorias[item.categoria] += valor;
    } else {
      resumoCategorias[item.categoria] -= valor;
    }

    Object.entries(resumoCategorias)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    });

  const anosDisponiveis = [
    ...new Set(
      dados
        .filter(item => item.data)
        .map(item => new Date(item.data).getFullYear())
    )
  ].sort((a, b) => b - a); // ordem decrescente

  useEffect(() => {
  if (anosDisponiveis.length === 0) return;

  if (!anoSelecionado || !anosDisponiveis.includes(anoSelecionado)) {
    setAnoSelecionado(anosDisponiveis[0]);
  }
}, [anosDisponiveis, anoSelecionado]);
  
  return (
    <div>

      {/* HEADER */}
      <header className="header">
        <nav>
          <ul>
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
              <button onClick={() => setMostrarCartao(true)}>
                + Cartão
              </button>
            </li>

            <li>
              <button onClick={() => setMostrarRemover(true)}>
                - Cartão
              </button>
            </li>
          </ul>
        </nav>
      </header>



      <div className="main-box">

        <div className="layout">

          {/* ESQUERDA (25%) */}
          <div className="left">

            <div className="box saldo">
              <strong>Saldo</strong>
              <span>
                {cartoes.find(c => c.id === cartaoAtivo)?.moeda || "R$"} {valorTotal}
              </span>
            </div>

            <div className="box receita">
              <strong>Receitas</strong>
              <span>
                {cartoes.find(c => c.id === cartaoAtivo)?.moeda || "R$"} {receitas}
              </span>
            </div>

            <div className="box despesa">
              <strong>Despesas</strong>
              <span>
                {cartoes.find(c => c.id === cartaoAtivo)?.moeda || "R$"} {despesas}
              </span>
            </div>

          </div>

          {/* DIREITA (75%) */}
          <div className="right">

            {/* PARTE DE CIMA */}
            <div className="top">

              {/* BOTÕES */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>

                <button onClick={() => setMostrarCambio(!mostrarCambio)}>
                  {mostrarCambio ? "Relatório Mensal" : "Taxa de Câmbio"}
                </button>

                {!mostrarCambio && (
                  <div style={{ display: "flex", gap: "5px" }}>
                    {anosDisponiveis.map((ano) => (
                      <button
                        key={ano}
                        onClick={() => setAnoSelecionado(ano)}
                        style={{
                          background: anoSelecionado === ano ? "#4caf50" : "#1e1e2f",
                          color: "white"
                        }}
                      >
                        {ano}
                      </button>
                    ))}
                  </div>
                )}

              </div>

              {/* CONTEÚDO */}
              {mostrarCambio ? (
                <CambioChart />
              ) : (
                <FinanceChart dados={dadosDoAno} />
              )}

            </div>

          </div>
        
        </div>


        <div className="main-tab-categorias">

          <div className="box-categorias">

            <table className="tabela-categorias">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Total</th>
                  <th>Categoria</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(resumoCategorias)
                  .reduce((acc, curr, i, arr) => {
                    if (i % 2 === 0) {
                      acc.push([curr, arr[i + 1]]);
                    }
                    return acc;
                  }, [])
                  .map((par, index) => (
                    <tr key={index}>

                      {/* COLUNA 1 */}
                      <td>{par[0][0]}</td>
                      <td style={{
                        color: par[0][1] >= 0 ? "green" : "red",
                        fontWeight: "bold"
                      }}>
                        {(cartoes.find(c => c.id === cartaoAtivo)?.moeda || "R$")} {Math.abs(par[0][1]).toFixed(2)}
                      </td>

                      {/* COLUNA 2 */}
                      {par[1] ? (
                        <>
                          <td>{par[1][0]}</td>
                          <td style={{
                            color: par[1][1] >= 0 ? "green" : "red",
                            fontWeight: "bold"
                          }}>
                            {(cartoes.find(c => c.id === cartaoAtivo)?.moeda || "R$")} {Math.abs(par[1][1]).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td></td>
                          <td></td>
                        </>
                      )}

                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        </div>


        <div className="box-tabela-search">
          <div className="dvSearch">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <div style={{ display: "flex", gap: "10px" }}>
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
                    className="btn btn-danger"
                    disabled={selecionados.length === 0}
                    onClick={async () => {
                      if (!window.confirm("Excluir selecionados?")) return;

                      await Promise.all(
                        selecionados.map(id =>
                          fetch(`http://localhost:3001/api/lancamentos/${id}`, {
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

                  <button className="btn btn-success">Cadastrar</button>
                </form>
              )}

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
                        {cartoes.find(c => c.id === cartaoAtivo)?.moeda || "R$"} {item.valor}
                      </td>

                      <td>
                        {item.status === "receita" ? (
                          <span className="badge bg-success">Receita</span>
                        ) : (
                          <span className="badge bg-danger">Despesa</span>
                        )}
                      </td>

                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deletar(item.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

  );
}

export default App;