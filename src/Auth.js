import { useState } from "react";
import API_URL from "./config";

function Auth({ onLogin }) {
  const [modoCadastro, setModoCadastro] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const url = modoCadastro
      ? `${API_URL}/register`
      : `${API_URL}/login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      // 🔐 SALVAR TOKEN (AGORA SIM, no lugar certo)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // 👤 salvar usuário no estado
      onLogin(data.usuario);

    } catch (err) {
      console.error(err);
      alert("Erro");
    }
  }

  return (
    <div className="auth-container">
      <h1>Bem-vindo</h1>

      <form onSubmit={handleSubmit}>
        {modoCadastro && (
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button type="submit">
          {modoCadastro ? "Cadastrar" : "Entrar"}
        </button>
      </form>

      <p
        onClick={() => setModoCadastro(!modoCadastro)}
        style={{ cursor: "pointer" }}
      >
        {modoCadastro
          ? "Já tem conta? Fazer login"
          : "Não tem conta? Criar conta"}
      </p>
    </div>
  );
}

export default Auth;