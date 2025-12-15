import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("Idle");

  async function findMatch() {
    setStatus("Contacting server...");

    try {
      const res = await fetch("http://localhost:4000/match/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.status === "searching") {
        setStatus("Searching for opponent...");
        router.push("/match");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error contacting server");
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>PairPrep</h1>

      <p>Status: <strong>{status}</strong></p>

      <button onClick={findMatch}>
        Find Match
      </button>
    </div>
  );
}
