import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("Idle");

  useEffect(() => {
    socket.on("match_found", (data) => {
      setStatus("Matched!");
      router.push(`/room`);
    });

    return () => {
      socket.off("match_found");
    };
  }, []);

  async function findMatch() {
    await fetch("http://localhost:4000/match/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-id": socket.id,
      },
    });

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
