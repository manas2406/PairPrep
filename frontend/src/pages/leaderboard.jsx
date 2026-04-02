import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { useRouter } from "next/router";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        fetch(`${API_BASE}/leaderboard`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLeaderboard(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Medal className="h-6 w-6 text-yellow-500" />;
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />;
            case 3:
                return <Medal className="h-6 w-6 text-amber-700" />;
            default:
                return <span className="font-mono text-muted-foreground w-6 text-center inline-block">{rank}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-background mt-16 pb-12">
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                        <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-display font-bold mb-4">Global Leaderboard</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        The top competitive programmers in the PairPrep arena. Win matches to climb the ranks.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="h-8 w-8 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden shadow-lg shadow-black/5">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50 bg-secondary/30 text-left">
                                    <th className="p-4 font-semibold text-muted-foreground">Rank</th>
                                    <th className="p-4 font-semibold text-muted-foreground w-1/2">Coder</th>
                                    <th className="p-4 font-semibold text-muted-foreground text-right">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((user, index) => (
                                    <motion.tr
                                        key={user.username}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="border-b border-border/30 hover:bg-secondary/40 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center justify-center w-8">
                                                {getRankIcon(user.rank)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">
                                            {user.username}
                                            {user.rank <= 3 && (
                                                <TrendingUp className="inline-block h-3 w-3 text-accent ml-2 relative -top-0.5" />
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-mono font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
                                                {user.rating}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center text-muted-foreground p-8">
                                            No one has joined the leaderboard yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
