import { useRouter } from "next/router";
import { useState } from "react";

export default function Match() {
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);
  const router = useRouter();
  const [status, setStatus] = useState("Searching...");

  function goToRoom() {
    router.push("/room");
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Finding a Match</h1>

      <p>Status: <strong>{status}</strong></p>

      <button onClick={goToRoom}>
        Enter Room
      </button>
    </div>
  );
}
