import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("Idle");
  const [roomId, setRoomId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [submissionId, setSubmissionId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  /* ---------------- SOCKET SETUP ---------------- */

  useEffect(() => {
    if (socketRef.current) return; // 👈 THIS is the key line

    const userId = sessionStorage.getItem("userId");
    if (!userId) return;

    const socket = io("http://localhost:4000", {
    query: { userId },
  });

  socketRef.current = socket;

    if (!userId) {
      console.warn("No userId found in sessionStorage");
      return;
    }
    console.log(userId);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("chat_message", (msg) => {
      console.log("📩 CHAT RECEIVED:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("match_found", (data) => {
      setRoomId(data.roomId);
      setProblem(data.problem);
      setStatus("Matched");
      setMessages([]);
      setResult(null);
      setSubmissionId("");
      setError(null);

      socket.emit("join_room", { roomId: data.roomId });
    });

    socket.on("user_left", ({ userId }) => {
      setMessages((prev) => [
        ...prev,
        { userId: "SYSTEM", message: `${userId} left the room` },
      ]);
    });

    socket.on("match_finished", ({ winner }) => {
      console.log("🔥 SOCKET match_finished received. winner =", winner);
      console.log("🔥 local userId =", sessionStorage.getItem("userId"));
      setResult(winner);
      setStatus("Finished");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    fetch("http://localhost:4000/cf/fetch-solved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: sessionStorage.getItem("userId"),
      }),
    });

    return () => {
      // socket.disconnect();
      // socketRef.current = null;
    };
  }, []);

  /* ---------------- MATCHMAKING ---------------- */

  async function findMatch() {
    if (!socketRef.current) return;

    setStatus("Searching...");

    await fetch("http://localhost:4000/match/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-id": socketRef.current.id,
      },
    });
  }

  /* ---------------- SUBMISSION ---------------- */

  async function submitSolution() {
    // console.log("🟡 FRONTEND submit clicked");
    // console.log("roomId:", roomId);
    // console.log("userId:", sessionStorage.getItem("userId"));
    // console.log("submissionId:", submissionId);

    setStatus("Verifying...");
    setError(null);

    const res = await fetch("http://localhost:4000/submission/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-id": socketRef.current.id,
      },
      body: JSON.stringify({
        roomId,
        submissionId,
      }),
    });
    if (res.status === 409) {
      setError("Judging in progress. Please retry in a few seconds.");
      setStatus("Matched");
      return;
    }

    const data = await res.json();
    console.log("🟢 FRONTEND HTTP response:", data);

    if (!res.ok) {
      setError(data.error);
      setStatus("Matched");
    }
  }

  /* ---------------- LEAVE ROOM ---------------- */

  function leaveRoom() {
    if (!socketRef.current || !roomId) return;

    socketRef.current.emit("leave_room", { roomId });

    setRoomId(null);
    setProblem(null);
    setMessages([]);
    setSubmissionId("");
    setResult(null);
    setError(null);
    setStatus("Idle");
  }

  /* ---------------- UI ---------------- */

  return (

    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>PairPrep</h1>
      <p>
        Status: <strong>{status}</strong>
      </p>

      {!roomId && (
        <button onClick={findMatch}>Find Match</button>
      )}

      {/* ---------- PROBLEM ---------- */}
      {problem && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <h3>🧠 Problem Assigned</h3>

          <p>
            <strong>{problem.name}</strong>
          </p>

          <p>Difficulty Rating: {problem.rating}</p>

          <a href={problem.url} target="_blank" rel="noreferrer">
            Open on Codeforces →
          </a>

          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            Room ID: {roomId}
          </p>
        </div>
      )}

      {/* ---------- SUBMISSION ---------- */}
      {problem && !result && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Enter Codeforces submission ID"
            value={submissionId}
            onChange={(e) => setSubmissionId(e.target.value)}
            style={{ width: "300px", padding: "8px" }}
          />

          <button onClick={submitSolution} style={{ marginLeft: "10px" }}>
            Submit
          </button>
        </div>
      )}

      {/* ---------- RESULT ---------- */}
      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>
            {result === sessionStorage.getItem("userId")
              ? "🏆 You won!"
              : "😞 You lost"}
          </h2>
        </div>
      )}

      {/* ---------- ERROR ---------- */}
      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          Error: {error}
        </p>
      )}

      {/* ---------- CHAT ---------- */}
      {roomId && (
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <h3>💬 Room Chat</h3>

          <div
            style={{
              height: "200px",
              overflowY: "auto",
              border: "1px solid #eee",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            {messages.map((m, idx) => (
              <p key={idx}>
                <strong>{m.userId}:</strong> {m.message}
              </p>
            ))}
          </div>

          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type message..."
            style={{ width: "75%", padding: "6px" }}
          />

          <button
            onClick={() => {
              socketRef.current.emit("chat_message", {
                roomId,
                message: chatInput,
              });
              setChatInput("");
            }}
            style={{ marginLeft: "10px" }}
          >
            Send
          </button>
        </div>
      )}


      {roomId && status === "Finished" && (
        <button
          onClick={leaveRoom}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            background: "#f44336",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Leave Room
        </button>
      )}
    </div>
  );
}
