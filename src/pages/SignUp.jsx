"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-auto bg-white rounded-2xl p-10 border border-slate-200"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 text-center mb-2">
          Secure access
        </h1>
        <p className="text-slate-600 text-center mb-8">
          Access your InvestorIQ account.
        </p>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md border border-[#0F172A] bg-[#0F172A] text-white text-sm font-semibold py-3 hover:bg-[#0d1326] transition"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-[#334155] mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1F8A8A] font-semibold hover:underline">
            Log In
          </Link>
        </p>

      </motion.div>
    </div>
  );
}
