"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { createAccount, saveAuthSession, signIn } from "@/lib/auth";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = isSignup
        ? await createAccount(name, email, password)
        : await signIn(email, password);
      saveAuthSession(session);
      router.push("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We couldn't complete your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFF] p-3 text-slate-900 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_100px_-40px_rgba(15,23,42,0.28)] lg:grid-cols-[1.03fr_0.97fr]">
        <section className="relative hidden overflow-hidden bg-[#101A38] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
          <div className="absolute -right-36 -top-40 h-[30rem] w-[30rem] rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute -bottom-52 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">SegmentIQ</span>
          </Link>

          <div className="relative z-10 mt-10 max-w-lg">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              CUSTOMER INTELLIGENCE
            </p>
            <h1 className="max-w-md text-[2.55rem] font-semibold leading-[1.1] tracking-tight text-white xl:text-[3.1rem]">
              Understand your customers. Find your focus.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 xl:text-[15px]">
              Bring the signals together, uncover meaningful groups, and make
              your next decision with confidence.
            </p>

            <div aria-hidden="true" className="relative mt-8 max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#172342]/80 p-5 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.7)]">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">A clearer view of your audience</p>
                  <p className="mt-1 text-xs text-slate-400">Discover the connections within your data</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>

              <div className="relative mt-6 h-44">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M108 67L211 91M211 91L326 56M211 91L323 135" stroke="#94A3B8" strokeOpacity=".34" strokeWidth="1.5" />
                  <path d="M108 67L211 91M211 91L326 56M211 91L323 135" stroke="url(#flow)" strokeOpacity=".8" strokeWidth="1.5" strokeDasharray="4 7" />
                  <circle cx="108" cy="67" r="32" fill="#2563EB" fillOpacity=".13" stroke="#60A5FA" strokeOpacity=".65" />
                  <circle cx="108" cy="67" r="21" fill="#2563EB" fillOpacity=".22" />
                  <circle cx="108" cy="67" r="8" fill="#93C5FD" />
                  <circle cx="211" cy="91" r="28" fill="#1E293B" stroke="#CBD5E1" strokeOpacity=".55" />
                  <circle cx="211" cy="91" r="16" fill="#334155" />
                  <circle cx="211" cy="91" r="6" fill="#E2E8F0" />
                  <circle cx="326" cy="56" r="23" fill="#0891B2" fillOpacity=".17" stroke="#67E8F9" strokeOpacity=".7" />
                  <circle cx="326" cy="56" r="12" fill="#0891B2" fillOpacity=".35" />
                  <circle cx="326" cy="56" r="5" fill="#A5F3FC" />
                  <circle cx="323" cy="135" r="23" fill="#4F46E5" fillOpacity=".18" stroke="#A5B4FC" strokeOpacity=".7" />
                  <circle cx="323" cy="135" r="12" fill="#4F46E5" fillOpacity=".35" />
                  <circle cx="323" cy="135" r="5" fill="#C7D2FE" />
                  <circle cx="164" cy="80" r="3" fill="#7DD3FC" />
                  <circle cx="267" cy="73" r="3" fill="#67E8F9" />
                  <circle cx="269" cy="113" r="3" fill="#A5B4FC" />
                  <defs>
                    <linearGradient id="flow" x1="108" y1="67" x2="326" y2="135" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#60A5FA" />
                      <stop offset=".55" stopColor="#67E8F9" />
                      <stop offset="1" stopColor="#A5B4FC" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute left-1 top-28 rounded-md border border-white/10 bg-[#111c36] px-2 py-1 text-[10px] font-medium text-slate-300">Customer data</span>
                <span className="absolute left-[39%] top-[4.25rem] rounded-md border border-white/10 bg-[#111c36] px-2 py-1 text-[10px] font-medium text-slate-300">Behavior</span>
                <span className="absolute right-0 top-5 rounded-md border border-cyan-300/15 bg-[#111c36] px-2 py-1 text-[10px] font-medium text-cyan-100">Loyal</span>
                <span className="absolute right-0 bottom-0 rounded-md border border-indigo-300/15 bg-[#111c36] px-2 py-1 text-[10px] font-medium text-indigo-100">Growth</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-auto pt-8 text-xs text-slate-500">
            A more considered approach to customer intelligence.
          </p>
        </section>

        <section className="flex flex-col px-5 py-6 sm:px-10 sm:py-9 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 lg:invisible"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 lg:hidden"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                <BarChart3 className="h-4 w-4" />
              </span>
              SegmentIQ
            </Link>
            <span className="text-xs text-slate-400">
              {isSignup ? "Already have an account?" : "New to SegmentIQ?"}{" "}
              <Link
                href={isSignup ? "/login" : "/create-account"}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                {isSignup ? "Sign in" : "Create account"}
              </Link>
            </span>
          </div>

          <div className="mx-auto my-auto w-full max-w-md py-12">
            <div className="mb-8">
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {isSignup ? <Sparkles className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
              </span>
              <p className="text-sm font-semibold text-blue-600">
                {isSignup ? "Start exploring" : "Welcome back"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {isSignup ? "Create your account" : "Sign in to your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isSignup
                  ? "A clearer view of your customers starts here."
                  : "Your customer insights are ready when you are."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Your name</span>
                  <span className="relative block">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      autoComplete="name"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      maxLength={60}
                      minLength={2}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Alex Morgan"
                      required
                      value={name}
                    />
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {isSignup && (
                  <span className="mt-2 block text-xs text-slate-400">
                    Use at least 8 characters.
                  </span>
                )}
              </label>

              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <button
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? isSignup
                    ? "Creating your account..."
                    : "Signing you in..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
                {!isSubmitting && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              Your account is securely stored and managed by SegmentIQ.
            </p>
          </div>

          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SegmentIQ · Customer clarity starts here.
          </p>
        </section>
      </div>
    </main>
  );
}
