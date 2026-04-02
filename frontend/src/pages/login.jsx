import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swords, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setIsLoading(false);
                toast({
                    title: "Login failed",
                    description: data.error || "Invalid username or password",
                    variant: "destructive",
                });
                return;
            }

            sessionStorage.setItem("token", data.token);
            toast({
                title: "Welcome back!",
                description: "You've successfully logged in.",
            });
            router.push("/dashboard");
        } catch (err) {
            console.error(err)
            setIsLoading(false);
            toast({
                title: "Login failed",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 mt-16">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                        <Swords className="h-8 w-8 text-primary transition-all duration-300 group-hover:rotate-12" />
                        <span className="font-display text-2xl font-bold">
                            Pair<span className="text-primary">Prep</span>
                        </span>
                    </Link>

                    <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
                    <p className="text-muted-foreground mb-8">
                        Enter your credentials to access your account
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Username
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="Your username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Signing in...
                                </div>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-primary hover:underline font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Visual */}
            <div className="hidden mt-16 lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative z-10 text-center"
                >
                    <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-6 glow-primary animate-pulse-glow">
                        <Swords className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="font-display text-3xl font-bold mb-4">
                        Ready for Battle?
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Sign in to challenge opponents, solve problems, and climb the ranks in
                        the ultimate competitive coding arena.
                    </p>

                    <div className="mt-8 flex justify-center gap-4">
                        {["1800+", "Expert", "Master"].map((rank, i) => (
                            <motion.div
                                key={rank}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2"
                            >
                                <span className="font-mono text-sm text-primary">{rank}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
