import React from "react";
import { motion } from "framer-motion";

/**
 * WelcomeMessage — InvestorIQ
 * A sleek, animated intro blurb that reinforces the platform's
 * premium, document-led underwriting tone.
 */

const WelcomeMessage = () => {
  return (
    <motion.p
      className="text-xl md:text-2xl text-iqnavy font-medium max-w-3xl mx-auto text-center leading-relaxed"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
    >
      Welcome to{" "}
      <span className="font-extrabold text-[#0F172A]">
        InvestorIQ
      </span>
      , the document-based underwriting platform delivering institutional-grade real estate insights.
      Instantly generate 360-degree IQ Reports with structured data analytics, charts, and market heat maps.
    </motion.p>
  );
};

export default WelcomeMessage;
