import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

function FinanceChart({ dados }) {
  const [dadosMensais, setDadosMensais] = useState([]);

  useEffect(() => {
    const meses = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    const resumo = Array(12).fill(0).map((_, i) => ({
      mes: meses[i],
      receita: 0,
      despesa: 0
    }));

    dados.forEach((item) => {
      if (!item.data) return;

      const data = new Date(item.data);
      const mes = data.getMonth();

      if (item.status === "receita") {
        resumo[mes].receita += Number(item.valor);
      } else {
        resumo[mes].despesa += Number(item.valor);
      }
    });

    setDadosMensais(resumo);
  }, [dados]);

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={dadosMensais}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="receita"
            stroke="green"
            strokeWidth={3}
          />

          <Line
            type="monotone"
            dataKey="despesa"
            stroke="red"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FinanceChart;