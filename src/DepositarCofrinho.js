import React, { useState } from "react";
import API_URL, { apiFetch } from "./config";

export default function DepositarCofrinho({ cofrinho, onClose, onUpdated }) {

  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(e) {
    e.preventDefault();

    const deposito = Number(String(valor).replace(",", "."));

    if (!deposito || deposito <= 0) {
      setErro("Digite um valor válido.");
      return;
    }


    setLoading(true);

    try {

      const res = await apiFetch(
        `${API_URL}/cofrinhos/${cofrinho.id}/depositar`,
        {
          method: "POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            valor: deposito
          })
        }
      );


      const data = await res.json();

      if(!res.ok)
        throw new Error(data.error || "Erro ao depositar");


      onUpdated();
      onClose();


    } catch(err){
      setErro(err.message);
    }
    finally{
      setLoading(false);
    }

  }



  return (
    <div className="modal-overlay">

      <div className="modal-card">

        <h3>Depositar no Cofrinho</h3>

        <p>
          {cofrinho.nome}
        </p>


        <form onSubmit={handleSubmit}>


          <div className="modal-card-group">

            <label>
              Valor do depósito
            </label>


            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e)=>setValor(e.target.value)}
            />

          </div>


          {
            erro &&
            <div className="erro">
              {erro}
            </div>
          }


          <div className="modal-actions">

            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>


            <button
              className="modal-btn-confirm"
              disabled={loading}
            >
              {loading ? "Depositando..." : "Depositar"}

            </button>

          </div>


        </form>


      </div>

    </div>
  )

}