import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords, Zap, Trophy, Users, Code, Target, ArrowRight } from "lucide-react";

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-500 hover:border-primary/50 hover:bg-card/80"
  >
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 font-display text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const HowItWorksStep = ({
  step,
  title,
  description,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="flex gap-6"
  >
    <div className="flex-shrink-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary font-mono text-lg font-bold text-primary-foreground glow-sm">
        {step}
      </div>
    </div>
    <div>
      <h3 className="mb-2 font-display text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />

        <div className="container relative z-10 px-4 pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-mono">
                <Zap className="h-4 w-4" />
                Real-time 1v1 Battles
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 font-display text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
            >
              Battle Your Way to{" "}
              <span className="text-primary text-glow">Coding Mastery</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl"
            >
              Challenge opponents in real-time coding duels. Solve problems from Codeforces,
              climb the leaderboards, and prove you're the ultimate competitive programmer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup">
                <Button variant="hero" size="xl" className="group">
                  Start Battling
                  <Swords className="h-5 w-5 transition-transform group-hover:rotate-12" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="glass" size="xl">
                  I Have an Account
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 grid grid-cols-3 gap-8 border-t border-border/50 pt-8"
            >
              {[
                { value: "10K+", label: "Problems" },
                { value: "50K+", label: "Battles" },
                { value: "5K+", label: "Players" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-mono text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Why <span className="text-primary">PairPrep</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to level up your competitive programming skills
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Swords}
              title="Real-time 1v1 Battles"
              description="Face off against opponents in live coding duels. Race to solve problems faster and more efficiently."
              delay={0}
            />
            <FeatureCard
              icon={Code}
              title="Codeforces Problems"
              description="Practice with thousands of curated problems from Codeforces, ranging from beginner to expert level."
              delay={0.1}
            />
            <FeatureCard
              icon={Trophy}
              title="Ranking System"
              description="Climb the global leaderboard with our ELO-based rating system. Track your progress over time."
              delay={0.2}
            />
            <FeatureCard
              icon={Users}
              title="Match with Skill"
              description="Our matchmaking system pairs you with opponents of similar skill level for fair, competitive matches."
              delay={0.3}
            />
            <FeatureCard
              icon={Target}
              title="Focused Practice"
              description="Target specific topics and difficulty levels to improve where you need it most."
              delay={0.4}
            />
            <FeatureCard
              icon={Zap}
              title="Instant Feedback"
              description="Get immediate results with our fast judge system. Know exactly where you stand after each battle."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -translate-x-1/2" />
        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in seconds and jump into your first battle
            </p>
          </motion.div>

          <div className="mx-auto max-w-2xl space-y-12">
            <HowItWorksStep
              step={1}
              title="Create Your Account"
              description="Sign up in seconds with just your email. No complicated setup required."
              delay={0}
            />
            <HowItWorksStep
              step={2}
              title="Find a Match"
              description="Click 'Find Battle' and we'll match you with an opponent at your skill level."
              delay={0.1}
            />
            <HowItWorksStep
              step={3}
              title="Solve & Compete"
              description="Race to solve the problem first. Write clean, efficient code to claim victory."
              delay={0.2}
            />
            <HowItWorksStep
              step={4}
              title="Climb the Ranks"
              description="Win battles to increase your rating and climb the global leaderboard."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-display text-4xl font-bold mb-6">
              Ready to <span className="text-primary">Battle</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Join thousands of competitive programmers already sharpening their skills on PairPrep.
            </p>
            <Link href="/signup">
              <Button variant="hero" size="xl" className="group">
                Get Started Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold">PairPrep</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PairPrep. Built for competitive programmers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
