import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import API_URL from "./config";

function AddCartao({ onClose, onCreated }) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#563d7c");
  const [moeda, setMoeda] = useState("BRL");

  async function cadastrar(e) {
    e.preventDefault();

    try {
      await fetch(`${API_URL}/cartoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          cor,
          moeda
        }),
      });

      onCreated(); // recarrega lista
      onClose();   // fecha tela
    } catch (error) {
      console.error("Erro ao criar cartão:", error);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <h3>Novo Cartão</h3>

        <form onSubmit={cadastrar}>

          {/* NOME */}
          <div className="mb-3">
            <label>Nome do Cartão</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Nubank, Wise..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          {/* COR */}
          <div className="mb-3">
            <label>Cor do Cartão</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
            />
          </div>

          {/* MOEDA */}
          <div className="mb-3">
            <label>Moeda</label>
            <select
              className="form-control"
              value={moeda}
              onChange={(e) => setMoeda(e.target.value)}
            >
              <option value="BRL">Real (BRL)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>

          {/* BOTÕES */}
          <div className="d-flex gap-2">
            <button className="btn btn-success w-100">
              Criar Cartão
            </button>

            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddCartao;