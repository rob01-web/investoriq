import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const PALETTE = {
  deepNavy: "#0F172A",
  teal: "#1F8A8A",
  gold: "#D4AF37",
  gray: "#6B7280",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const logoUrl =
    "https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png";

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    toast({
      title: "Welcome Back!",
      description: "You are now logged in to InvestorIQ Elite.",
    });
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>InvestorIQ Elite Login</title>
        <meta
          name="description"
          content="Access your InvestorIQ Elite dashboard to upload deals, generate reports, and analyze your portfolio."
        />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f9fafb] to-[#eef2f5] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10"
        >
          {/* LOGO & HEADING */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-block"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <img
                src={logoUrl}
                alt="InvestorIQ Logo"
                className="h-20 sm:h-24 mx-auto transition-transform hover:scale-105"
              />
            </Link>
            <h1 className="text-3xl font-extrabold text-[#0F172A] mt-5">
              Welcome to <span className="text-[#1F8A8A]">InvestorIQ</span>
            </h1>
            <p className="text-slate-600 text-sm mt-2">
              Sign in to access your <span className="font-medium text-[#1F8A8A]">Elite Dashboard</span>
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400 transition"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#b9972b] text-white font-bold rounded-lg shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging In...
                </>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          {/* FOOTER LINKS */}
          <p className="text-center mt-6 text-sm text-slate-600">
            New here?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#1F8A8A] hover:underline transition"
            >
              Create an Account
            </Link>
          </p>

          <p className="text-center mt-2 text-xs text-slate-400">
            Having trouble logging in?{" "}
            <a
              href="mailto:support@investoriq.ai"
              className="text-[#1F8A8A] font-semibold hover:underline"
            >
              Contact Support
            </a>
          </p>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 border-t bg-white text-center text-slate-500 text-sm">
        © 2025{" "}
        <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
      </footer>

      <BackButton />
    </>
  );
};

export default LoginPage;
