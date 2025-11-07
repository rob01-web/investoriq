import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '@/components/BackButton';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoUrl =
    'https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png';

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Welcome Back!',
      description: 'You are now logged in.',
    });
    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - InvestorIQ</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-slate-200/80"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img
                src={logoUrl}
                alt="InvestorIQ Logo"
                className="h-20 sm:h-24 mx-auto transition-transform hover:scale-105"
              />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-4">Welcome Back</h1>
            <p className="text-slate-600 text-sm">Log in to access your InvestorIQ dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-bold rounded-lg shadow-md hover:opacity-90 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Logging In...' : 'Login to Dashboard'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-600">
            New here?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[#1F8A8A] hover:underline transition"
            >
              Create Account & Get Started
            </Link>
          </p>
        </motion.div>
      </div>

      <footer className="py-6 border-t bg-white text-center text-slate-500 text-sm">
        © 2025 <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
      </footer>

      <BackButton />
    </>
  );
};

export default LoginPage;
