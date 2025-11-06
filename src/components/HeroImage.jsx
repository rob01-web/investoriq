import React from 'react';
import { motion } from 'framer-motion';

const HeroImage = () => {
  return (
    <motion.div 
      className="mt-12 md:mt-16" 
      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto px-4">
        <img 
          src="https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/ef4a5a622dd1724eb6ee59f669c129a6.jpg" 
          alt="InvestorIQ dashboard analytics shown on a laptop" 
          className="rounded-lg shadow-2xl w-full h-auto object-cover"
        />
      </div>
    </motion.div>
  );
};

export default HeroImage;