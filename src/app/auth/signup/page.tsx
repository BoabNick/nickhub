"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error("Sign up failed", { description: error.message });
      setLoading(false);
      return;
    }

    // When email confirmation is enabled Supabase returns a user without a
    // session; the account only becomes usable after the confirmation link.
    if (!data.session) {
      toast.success("Check your inbox", {
        description: "Confirm your email address to finish creating your account.",
      });
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070711] px-4 text-white">
      <form
        onSubmit={handleSignUp}
        className="w-full max-w-sm space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Each account gets its own settings, tokens, and integrations.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-2xl bg-violet-500 font-black text-white shadow-lg shadow-violet-950/50 hover:bg-violet-400"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-bold text-violet-300 hover:text-violet-200">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
