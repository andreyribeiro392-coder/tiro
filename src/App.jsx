import { useRef, useState } from "react";
import { startGame } from "./game";

function App() {
  const canvasRef = useRef(null);
  const [jogando, setJogando] = useState(false);

  const iniciar = () => {
    setJogando(true);

    setTimeout(() => {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      startGame(canvas);
    }, 100);
  };

  return (
    <>
      {!jogando && (
        <div id="menu">
          <h1>🔥 BATTLE SHOOTER 🔫</h1>
          <button onClick={iniciar}>Jogar</button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: jogando ? "block" : "none" }}
      />
    </>
  );
}

export default App;
