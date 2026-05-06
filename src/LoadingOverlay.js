//import "./LoadingOverlay.css";

function LoadingOverlay({ nome }) {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <h1>Bem-vindo, {nome}</h1>
        <p>Seus dados estão sendo carregados...</p>

        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;