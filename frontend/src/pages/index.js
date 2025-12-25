import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Page from "../components/Page";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    marginTop: "20px",
    background: "#fafafa",
};

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
  const [ratingRange, setRatingRange] = useState("800-1000");
  const [seconds, setSeconds] = useState(0);


  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);


  /* ---------------- SOCKET SETUP ---------------- */

  useEffect(() => {
    if (socketRef.current) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    const socket = io(API_BASE, {
      auth: {
        token: sessionStorage.getItem("token"),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("chat_message", (msg) => {
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
      setSeconds(0);

      const timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      socketRef.current.timer = timer;

      socket.emit("join_room", { roomId: data.roomId });
    });

    socket.on("user_left", ({ userId }) => {
      setMessages((prev) => [
        ...prev,
        { userId: "SYSTEM", message: `${userId} left the room` },
      ]);
      if (socketRef.current?.timer) {
        clearInterval(socketRef.current.timer);
      }
    });

    socket.on("match_finished", ({ winner }) => {
      setResult(winner);
      setStatus("Finished");
      if (socketRef.current?.timer) {
        clearInterval(socketRef.current.timer);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cf/fetch-solved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

  }, []);

  /* ---------------- MATCHMAKING ---------------- */

  async function findMatch() {
    if (!socketRef.current) return;

    setStatus("Searching...");
    const token = sessionStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/match/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-socket-id": socketRef.current.id,
      },
      body: JSON.stringify({
        ratingRange, // if you added difficulty selection
      }),
    });
  }

  /* ---------------- SUBMISSION ---------------- */

  async function submitSolution() {
    setStatus("Verifying...");
    setError(null);

    const res = await fetch(`${API_BASE}/submission/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-id": socketRef.current.id,
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
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
    <Page>
      {
        <div style={{ padding: "40px", fontFamily: "Arial" }}>
          <h1>PairPrep</h1>

          <p>
            Status: <strong>{status}</strong>
          </p>
          <select
            value={ratingRange}
            onChange={(e) => setRatingRange(e.target.value)}
          >
            <option value="800-1000">800 – 1000</option>
            <option value="1000-1200">1000 – 1200</option>
            <option value="1200-1400">1200 – 1400</option>
          </select>
          
          {roomId && !result && (
            <div style={cardStyle}>
              ⏱️ Time Elapsed: {Math.floor(seconds / 60)}:
              {(seconds % 60).toString().padStart(2, "0")}
            </div>
          )}

          {!roomId && <button onClick={findMatch}>Find Match</button>}

          {problem && (
            <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #ddd" }}>
              <h3>🧠 Problem Assigned</h3>
              <p><strong>{problem.name}</strong></p>
              <p>Difficulty Rating: {problem.rating}</p>
              <a href={problem.url} target="_blank" rel="noreferrer">
                Open on Codeforces →
              </a>
              <p>Room ID: {roomId}</p>
            </div>
          )}

          {problem && !result && (
            <div style={{ marginTop: "20px" }}>
              <input
                type="text"
                placeholder="Enter Codeforces submission ID"
                value={submissionId}
                onChange={(e) => setSubmissionId(e.target.value)}
              />
              <button onClick={submitSolution}>Submit</button>
            </div>
          )}

          {result && (
            <h2>
              {result === sessionStorage.getItem("userId")
                ? "🏆 You won!"
                : "😞 You lost"}
            </h2>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {roomId && (
            <div style={{ marginTop: "30px" }}>
              <h3>💬 Room Chat</h3>
              {messages.map((m, i) => (
                <p key={i}><strong>{m.userId}:</strong> {m.message}</p>
              ))}
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                onClick={() => {
                  socketRef.current.emit("chat_message", {
                    roomId,
                    message: chatInput,
                  });
                  setChatInput("");
                }}
              >
                Send
              </button>
            </div>
          )}

          {roomId && status === "Finished" && (
            <button onClick={leaveRoom}>Leave Room</button>
          )}
        </div>
      }
    </Page>
  );
}
