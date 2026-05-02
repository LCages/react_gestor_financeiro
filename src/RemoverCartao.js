import { useState } from "react";
import API_URL from "./config";

function RemoverCartao({ cartoes, onClose, onDeleted }) {
  const [cartaoId, setCartaoId] = useState("");

  async function remover() {
    if (!cartaoId) {
      alert("Selecione um cartão");
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir?")) return;

    try {
      const res = await fetch(
        `${API_URL}/cartoes/${cartaoId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Cartão removido!");

      onDeleted();
      onClose();

    } catch (err) {
      console.error(err);
      alert("Erro ao remover");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h5>Remover Cartão</h5>

        <select
          className="form-control mb-3"
          value={cartaoId}
          onChange={(e) => setCartaoId(e.target.value)}
        >
          <option value="">Selecione</option>
          {cartoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <button className="btn btn-danger w-100 mb-2" onClick={remover}>
          Excluir
        </button>

        <button className="btn btn-secondary w-100" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default RemoverCartao;