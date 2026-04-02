import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Target, Swords, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function UserProfile() {
    const router = useRouter();
    const { username } = router.query;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!username) return;

        fetch(`${API_BASE}/auth/profile/${username}`)
            .then(res => {
                if (!res.ok) throw new Error("User not found");
                return res.json();
            })
            .then(data => {
                setProfile(data);
                setError(null);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-background mt-16">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background mt-16 gap-4">
                <h2 className="text-2xl font-bold">{error || "Profile not found"}</h2>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const matchesPlayed = profile.matchesPlayed || 0;
    const matchesWon = profile.matchesWon || 0;
    const matchesLost = profile.matchesLost || 0;
    const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

    return (
        <div className="min-h-screen bg-background mt-16">
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Button variant="ghost" className="mb-6 -ml-4 hover:bg-transparent" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-card/30 p-8 rounded-2xl border border-border/50 backdrop-blur-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                    
                    <div className="h-32 w-32 rounded-full border-4 border-primary/20 flex flex-col items-center justify-center bg-background shrink-0">
                        <span className="font-display font-bold text-5xl text-primary uppercase">
                            {profile.username?.charAt(0)}
                        </span>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="font-display text-4xl font-bold mb-2">{profile.username}</h1>
                        <p className="text-muted-foreground flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-lg">
                            <span>Codeforces: <span className="font-mono text-primary font-bold">{profile.cfHandle || 'Not Linked'}</span></span>
                        </p>
                        
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-bold">
                                <Swords className="h-4 w-4" />
                                Rating: {profile.rating || 800}
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/30 border border-border/50 text-muted-foreground font-mono">
                                Peak: {profile.peakRating || 800}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                            <Target className="h-4 w-4 text-primary" />
                            Total Matches
                        </div>
                        <div className="text-3xl font-display font-bold">{matchesPlayed}</div>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            Win / Loss
                        </div>
                        <div className="text-3xl font-display font-bold">
                            <span className="text-green-500">{matchesWon}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-red-500">{matchesLost}</span>
                        </div>
                        <div className="text-sm font-mono text-muted-foreground mt-1">
                            {winRate}% Win Rate
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            Problems Solved
                        </div>
                        <div className="text-3xl font-display font-bold">{profile.solvedProblems?.length || 0}</div>
                        <div className="text-sm font-mono text-muted-foreground mt-1">
                            Practice: {profile.practiceSolved || 0}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
