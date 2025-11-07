import React from 'react';
import { motion } from 'framer-motion';

const HeroImage = () => {
  return (
    <motion.div
      className="mt-12 md:mt-16 relative"
      initial={{ opacity: 0, scale: 0.96, y: 25 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.15)]">
        {/* Background Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1F8A8A]/40 via-transparent to-[#0F172A]/30 z-10 pointer-events-none"></div>

        {/* Floating Hero Image */}
        <motion.img
          src="https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/ef4a5a622dd1724eb6ee59f669c129a6.jpg"
          alt="InvestorIQ dashboard analytics shown on a laptop"
          className="w-full h-auto object-cover rounded-2xl"
          initial={{ y: 0 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Optional Caption Overlay */}
        <div className="absolute bottom-3 right-4 bg-white/70 backdrop-blur-sm text-[#0F172A] text-xs md:text-sm font-medium px-3 py-1 rounded-full shadow-sm z-20">
          InvestorIQ Elite Analytics
        </div>
      </div>
    </motion.div>
  );
};

export default HeroImage;
