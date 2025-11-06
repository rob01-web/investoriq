import React from "react";
import { motion } from "framer-motion";

const WelcomeMessage = () => {
  return (
    <motion.p
      className="text-xl md:text-2xl text-white max-w-2xl mx-auto text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      Welcome to{" "}
      <span className="font-bold text-blue-400">InvestorIQ</span>
      — your AI-powered real estate intelligence platform.  
      Get instant 360° property analysis, charts, heatmaps, and investor-grade reports.
    </motion.p>
  );
};

export default WelcomeMessage;