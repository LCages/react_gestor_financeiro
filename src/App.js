import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [dados, setDados] = useState([]);
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [busca, setBusca] = useState("");

  // 🔥 controle do form
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState(1);

  // 🔥 carregar dados da API
  async function carregarDados() {
    try {
      const response = await fetch("http://localhost:3001/api/financeiro");
      const data = await response.json();

      setDados(data.dados);
      setReceitas(data.receitas);
      setDespesas(data.despesas);
      setValorTotal(data.valor_total);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // 🔥 cadastrar
  async function cadastrar(e) {
    e.preventDefault();

    try {
      await fetch("http://localhost:3001/api/financeiro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          valor,
          status,
        }),
      });

      // limpa form
      setTipo("");
      setValor("");
      setStatus(1);

      // esconde form
      setMostrarForm(false);

      // recarrega dados
      carregarDados();
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
    }
  }

  // 🔥 deletar
  async function deletar(id) {
    if (!window.confirm("Deseja excluir?")) return;

    try {
      await fetch(`http://localhost:3001/api/financeiro/${id}`, {
        method: "DELETE",
      });

      carregarDados();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }

  // 🔥 filtro
  const dadosFiltrados = dados.filter(item =>
    item.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="container mt-4">
      
      <h1>Gerenciador de Finanças</h1>
      <hr />

      {/* CARDS */}
      <div className="dvCaixas">
        <div>
          <strong>Saldo total</strong><br />
          {valorTotal} R$
        </div>

        <div>
          <strong>Receita</strong><br />
          {receitas} R$
        </div>

        <div>
          <strong>Despesas</strong><br />
          {despesas} R$
        </div>
      </div>

      {/* SEARCH + BOTÃO */}
      <div className="dvSearch">
        <input
          type="text"
          className="form-control"
          placeholder="Pesquisar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "Fechar" : "Adicionar"}
        </button>
      </div>

      {/* 🔥 FORM */}
      {mostrarForm && (
        <form onSubmit={cadastrar} className="card p-3 mb-3">
          
          <div className="mb-3">
            <label className="form-label">Tipo</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Salário, Mercado..."
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Valor</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
            >
              <option value={1}>Receita</option>
              <option value={0}>Despesa</option>
            </select>
          </div>

          <button type="submit" className="btn-cadastrar">
            Cadastrar
          </button>

          <button
            type="button"
            className="btn-cancelar"
            onClick={() => setMostrarForm(false)}
          >
            Cancelar
          </button>
        </form>
      )}

      {/* TABELA */}
      <table className="dvTabela">
        <thead className="table-light">
          <tr>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {dadosFiltrados.length > 0 ? (
            dadosFiltrados.map((item) => (
              <tr key={item.id}>
                <td>{item.tipo}</td>
                <td>{item.valor} R$</td>

                <td>
                  {item.status === 1 ? (
                    <span className="badge bg-success">Receita</span>
                  ) : (
                    <span className="badge bg-danger">Despesa</span>
                  )}
                </td>

                <td>
                  <button className="btn btn-warning btn-sm me-2">
                    Editar
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deletar(item.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                Nenhum lançamento encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;