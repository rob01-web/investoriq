import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, KeyRound, User } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const PALETTE = {
  deepNavy: "#0F172A",
  teal: "#1F8A8A",
  gold: "#D4AF37",
  gray: "#6B7280",
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const logoUrl =
    "https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png";

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, { data: { full_name: fullName } });

    if (!error) {
      toast({
        title: "Account Created!",
        description: "Please verify your email to activate your InvestorIQ account.",
      });
      navigate("/login");
    } else {
      toast({
        title: "Sign-Up Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Join InvestorIQ Elite</title>
        <meta
          name="description"
          content="Create your InvestorIQ Elite account to access professional-grade property analytics powered by AI."
        />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f9fafb] to-[#eef2f5] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10"
        >
          {/* LOGO & HEADER */}
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
              Create Your <span className="text-[#1F8A8A]">InvestorIQ</span> Account
            </h1>
            <p className="text-slate-600 text-sm mt-2">
              Unlock institutional-grade analysis for your real estate deals.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400 transition"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400 transition"
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#b9972b] text-white font-bold rounded-lg shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* LINKS */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#1F8A8A] hover:underline transition"
              >
                Log In
              </Link>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Need help?{" "}
              <a
                href="mailto:support@investoriq.ai"
                className="text-[#1F8A8A] font-semibold hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
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

export default SignUpPage;
