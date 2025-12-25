import { useEffect, useState } from "react";
import Page from "../components/Page";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    marginTop: "20px",
    background: "#fafafa",
};

export default function Dashboard() {
    const [history, setHistory] = useState([]);
    useEffect(() => {
        const token = sessionStorage.getItem("token");

        fetch(`${API_BASE}/match/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(setHistory);
    }, []);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
        }
    }, []);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        fetch(`${API_BASE}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then(setUser);
    }, []);

    if (!user) return <p>Loading...</p>;

    return (
        <Page>
            <h1>Dashboard</h1>
            <div style={cardStyle}>
                <h3>🕒 Match History</h3>

                {history.length === 0 && <p>No matches yet</p>}

                {history.map((m, i) => (
                    <div key={i} style={{ marginBottom: "10px" }}>
                        <strong>{m.problem.name}</strong> ({m.problem.rating})<br />
                        Winner: {m.winner} | Loser: {m.loser}<br />
                        Duration: {Math.floor(m.durationSeconds / 60)}m {m.durationSeconds % 60}s<br />
                        Date: {new Date(m.startedAt).toLocaleString()}
                    </div>
                ))}
            </div>
            <div style={cardStyle}>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Codeforces:</strong> {user.cfHandle}</p>
            </div>

            <div style={cardStyle}>
                <h3>📊 Stats</h3>
                <p>Total Matches: {user.matchesPlayed}</p>
                <p>Wins: {user.matchesWon}</p>
                <p>Losses: {user.matchesLost}</p>
                <p>Problems Solved: {user.solvedCount}</p>
            </div>
        </Page>
    );

}
