import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
    Swords,
    Trophy,
    TrendingUp,
    TrendingDown,
    Target,
    Clock,
    ChevronRight,
    Play,
    User,
    LogOut
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Removed old fake ratingBreakdown
const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    delay
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 overflow-hidden group hover:border-primary/30 transition-colors"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm ${trend === "up" ? "text-accent" : "text-destructive"}`}>
                        {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="font-mono text-2xl font-bold">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
    </motion.div>
);

const Dashboard = () => {
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [targetRating, setTargetRating] = useState("1000");

    const fetchUserData = () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`${API_BASE}/match/history`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistory(data);
            });

        fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then(setUser);
    };

    useEffect(() => {
        fetchUserData();

        // Auto-refresh when tab regains focus (e.g. returning from a match)
        const handleVisibility = () => {
            if (document.visibilityState === "visible") fetchUserData();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [router]);

    if (!user) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    const winRate = user.matchesPlayed > 0
        ? Math.round((user.matchesWon / user.matchesPlayed) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-background mt-16">

            <main className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="font-display text-3xl font-bold mb-2">
                        Welcome back, <span className="text-primary">{user.username}</span>
                    </h1>
                    <p className="text-muted-foreground">Codeforces Handle: {user.cfHandle} | Ready for your next battle?</p>
                </motion.div>

                {/* Matchmaking Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 flex flex-wrap items-center gap-4 bg-card/30 p-4 rounded-xl border border-border/50"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Target Difficulty:</span>
                        <Select value={targetRating} onValueChange={setTargetRating}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                {[800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600].map(rating => (
                                    <SelectItem key={rating} value={rating.toString()}>{rating}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="hero" size="xl" className="group" onClick={() => router.push(`/?action=find_match&rating=${targetRating}`)}>
                        <Play className="h-5 w-5 mr-2" />
                        Find Match
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <Button variant="outline" size="xl" onClick={() => router.push("/practice")} className="ml-auto">
                        <Target className="h-5 w-5 mr-2" />
                        Warm Up in Practice Mode
                    </Button>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                        icon={Swords}
                        label="Current Rating"
                        value={user.rating || 1200}
                        subValue={`Peak: ${user.peakRating || 1200}`}
                        trend="up"
                        delay={0.05}
                    />
                    <StatCard
                        icon={Target}
                        label="Total Matches"
                        value={user.matchesPlayed || 0}
                        delay={0.1}
                    />
                    <StatCard
                        icon={Trophy}
                        label="Wins / Losses"
                        value={`${user.matchesWon || 0} / ${user.matchesLost || 0}`}
                        subValue={`${winRate}% win rate`}
                        trend={winRate >= 50 ? "up" : undefined}
                        delay={0.15}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Problems Solved"
                        value={user.solvedCount || 0}
                        subValue={`Practice: ${user.practiceSolved || 0}`}
                        trend={undefined}
                        delay={0.2}
                    />
                </div>

                {/* Removed hidden rating breakdown */}

                {/* Match History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="font-display text-xl font-semibold mb-4">Recent Matches</h2>
                    <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/50 bg-secondary/30">
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Opponent</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Result</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Problem</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Duration</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                No matches yet. Go find one!
                                            </td>
                                        </tr>
                                    )}
                                    {history.map((match, index) => {
                                        const isWinner = match.winner === user.username;
                                        const opponent = match.winner === user.username ? match.loser : match.winner;
                                        const durationMins = Math.floor(match.durationSeconds / 60);
                                        const durationSecs = match.durationSeconds % 60;

                                        return (
                                            <motion.tr
                                                key={match._id || index}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.45 + index * 0.05 }}
                                                className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-sm uppercase">
                                                            {opponent?.[0] || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{opponent}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${isWinner
                                                        ? "bg-accent/10 text-accent"
                                                        : "bg-destructive/10 text-destructive"
                                                        }`}>
                                                        {isWinner ? <Trophy className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {isWinner ? "Win" : "Loss"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-medium">{match.problem?.name}</p>
                                                    <span className="font-mono text-xs text-muted-foreground">Rating: {match.problem?.rating}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-sm text-muted-foreground">
                                                        {durationMins}m {durationSecs}s
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground">
                                                    {new Date(match.startedAt).toLocaleString()}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Dashboard;
