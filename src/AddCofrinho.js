import React, { useState } from "react";
import API_URL, { apiFetch } from "./config";

export default function AddCofrinho({ onClose, onCreated }) {
  const [nome, setNome] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [percentualCdi, setPercentualCdi] = useState("100");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const valor = parseFloat(String(saldoInicial).replace(",", "."));
    if (!nome.trim()) return setErro("Dê um nome para o seu cofrinho.");
    if (isNaN(valor) || valor < 0) return setErro("O saldo inicial deve ser um valor válido.");

    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/cofrinhos`, {
        method: "POST",
        body: JSON.stringify({
          nome,
          saldo_inicial: valor,
          percentual_cdi: Number(percentualCdi),
          data_inicio: new Date()
        }),
      });

      const data = await res.json();
      if (res && !res.ok) throw new Error(data.error || "Erro ao criar cofrinho.");

      onCreated();
      onClose();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 400 }}>
        <h3>Criar Novo Cofrinho</h3>
        <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: -10, marginBottom: 20 }}>
          Lembrete: Cada usuário pode ter no máximo 2 cofrinhos ativos simultaneamente.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="modal-card-group">
            <label>Nome do Cofrinho</label>
            <input 
              type="text" 
              placeholder="Ex: Reserva de Emergência, Viagem" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="modal-card-group">
            <label>Valor de Depósito Inicial (R$)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              required
            />
          </div>

          <div className="modal-card-group">
            <label>Regra de Rentabilidade do CDI</label>
            <select value={percentualCdi} onChange={(e) => setPercentualCdi(e.target.value)}>
              <option value="100">100% do CDI Padrão</option>
              <option value="115">115% do CDI (Promocional até R$ 5.000)</option>
              <option value="120">120% do CDI VIP</option>
            </select>
          </div>

          {erro && (
            <div style={{
              background: "rgba(244,67,54,0.12)", border: "1px solid rgba(244,67,54,0.3)",
              borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#ef9a9a", marginBottom: 12
            }}>{erro}</div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn-confirm" disabled={loading}>
              {loading ? "Criando..." : "Confirmar e Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}