import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function CofrinhoChart({ historico = [], nomeCofrinho }) {
  
  // Formata a data ISO para exibição legível em formato brasileiro
  const formatarDataBR = (dataISO) => {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}`;
  };

  const formatarMoeda = (v) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  };

  if (!historico || historico.length === 0) {
    return (
      <div style={{
        height: 250, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)"
      }}>
        <span style={{ color: "var(--color-muted)", fontSize: 13 }}>
          Nenhum histórico de rendimento registrado para este cofrinho ainda.
        </span>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(30, 35, 45, 0.4)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
      <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 15, color: "#fff" }}>
        Evolução do Cofrinho: <span style={{ color: "#4CAF50" }}>{nomeCofrinho}</span>
      </h5>
      
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={historico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="data" 
              tickFormatter={formatarDataBR} 
              stroke="rgba(255,255,255,0.3)" 
              style={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              style={{ fontSize: 11 }}
              tickFormatter={(v) => `R$ ${v}`}
            />
            <Tooltip
              contentStyle={{ background: "#1e232d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              labelFormatter={(label) => `Data: ${formatarDataBR(label)}`}
              formatter={(value, name) => {
                if (name === "saldo_final") return [formatarMoeda(value), "Saldo Total"];
                if (name === "rendimento_liquido") return [formatarMoeda(value), "Rendimento Diário"];
                return [value, name];
              }}
            />
            <Area 
              type="monotone" 
              dataKey="saldo_final" 
              stroke="#4CAF50" 
              fillOpacity={1} 
              fill="url(#colorSaldo)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}