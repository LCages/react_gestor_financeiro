import React, { useEffect, useState, useCallback } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function CambioChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [par, setPar] = useState({ from: "EUR", to: "BRL" });

  // 🔥 Agora memorizada corretamente
  const buscarDados = useCallback(() => {
  setLoading(true);

  // 🔥 datas dinâmicas: últimos 30 dias
  const hoje = new Date();
  const passado = new Date();
  passado.setDate(hoje.getDate() - 30);

  const formatar = (d) =>
    d.toISOString().split("T")[0];

  const url = `https://api.frankfurter.dev/v1/${formatar(passado)}..${formatar(hoje)}?from=${par.from}&to=${par.to}`;

  fetch(url)  // 🔥 fetch direto, sem backend
    .then((res) => res.json())
    .then((json) => {
      if (!json.rates) {
        setData([]);
        setLoading(false);
        return;
      }

      const formatted = Object.keys(json.rates).map((date) => ({
        date,
        value: json.rates[date][par.to],
      }));

      setData(formatted);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, [par]);

  useEffect(() => {
    buscarDados();

    const interval = setInterval(() => {
      buscarDados();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [buscarDados]); // 🔥 agora correto

  if (loading) return <p>Carregando gráfico...</p>;
  if (data.length === 0) return <p>Nenhum dado encontrado.</p>;

  return (
    <div className="grafico-container">

      <div className="botoes-cambio-wrapper">

        {/* BOTÕES */}
        <div className="botoes-cambio">
          <button
            className={`botao-cambio ${
              par.from === "EUR" && par.to === "BRL" ? "ativo" : ""
            }`}
            onClick={() => setPar({ from: "EUR", to: "BRL" })}
          >
            EUR/BRL
          </button>

          <button
            className={`botao-cambio ${
              par.from === "EUR" && par.to === "USD" ? "ativo" : ""
            }`}
            onClick={() => setPar({ from: "EUR", to: "USD" })}
          >
            EUR/USD
          </button>

          <button
            className={`botao-cambio ${
              par.from === "USD" && par.to === "BRL" ? "ativo" : ""
            }`}
            onClick={() => setPar({ from: "USD", to: "BRL" })}
          >
            USD/BRL
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4CAF50"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CambioChart;