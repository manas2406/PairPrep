import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";


export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("Idle");

  // useRef to persist socket across renders
  const socketRef = useRef(null);

  useEffect(() => {
    // Get userId AFTER browser loads
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.warn("No userId found in localStorage");
      return;
    }

    // Create socket ONCE
    const socket = io("http://localhost:4000", {
      query: { userId },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("match_found", (data) => {
      console.log("Match found:", data);
      setStatus("Matched!");
      // later: router.push(`/room/${data.roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // IMPORTANT: empty dependency array

  async function findMatch() {
    if (!socketRef.current) {
      console.error("Socket not ready");
      return;
    }

    setStatus("Searching...");

    await fetch("http://localhost:4000/match/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-id": socketRef.current.id,
      },
    });
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>PairPrep</h1>

      <p>
        Status: <strong>{status}</strong>
      </p>

      <button onClick={findMatch}>Find Match</button>
    </div>
  );
}
