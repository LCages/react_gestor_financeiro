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

function FinanceChart({ dados, isMobile, semestre }) {
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

      const dataLimpa = item.data.split("T")[0];
      const [, mes] = dataLimpa.split("-");

      const mesNumero = Number(mes) - 1;
      const valor = Number(item.valorConvertido) || 0;

      if (mesNumero < 0 || mesNumero > 11) return;

      if (item.status === "receita") {
        resumo[mesNumero].receita += valor;
      } else {
        resumo[mesNumero].despesa += valor;
      }
    });

    // 🔥 FILTRO PARA MOBILE (6 MESES)
    let dadosFinal = resumo;

    if (isMobile) {
      if (semestre === 1) {
        dadosFinal = resumo.slice(0, 6); // Jan-Jun
      } else {
        dadosFinal = resumo.slice(6, 12); // Jul-Dez
      }
    }

    setDadosMensais(dadosFinal);

  }, [dados, isMobile, semestre]);

  return (
    <div style={{ width: "100%", height: 300}}>
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