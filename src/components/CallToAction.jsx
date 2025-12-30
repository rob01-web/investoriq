import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * InvestorIQ Call to Action
 * --------------------------
 * Executive-level closing section encouraging engagement or next steps.
 * Fully aligned with the InvestorIQ visual brand (navy, teal, gold).
 */

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0F172A] py-20 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 text-center text-white"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          Ready to Analyze Your Next Deal?
        </h2>
        <p className="text-iqgold/90 text-lg mb-10">
          Join smart investors making confident, data-driven decisions with <span className="font-semibold text-white">InvestorIQ</span>.
        </p>

        <div className="flex justify-center items-center gap-4 flex-wrap">
          <Button
            size="lg"
            variant="default"
            onClick={() => navigate('/dashboard')}
            className="rounded-md border border-white bg-white text-[#0F172A] font-semibold px-6 py-3 hover:bg-slate-100"
          >
            Upload Your Property
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-md border border-slate-200 text-white px-6 py-3 hover:border-white"
            onClick={() => navigate('/sample-report')}
          >
            View Sample IQ Report
          </Button>
        </div>
      </motion.div>

      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
    </section>
  );
};

export default CallToAction;
