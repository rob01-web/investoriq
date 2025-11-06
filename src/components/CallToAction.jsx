import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Analyze Your Next Deal?
        </h2>
        <p className="text-blue-100 text-lg mb-8">
          Join smart investors who are making data-driven decisions with InvestorIQ.
        </p>
        <div className="flex justify-center items-center gap-4">
          <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
            Upload Your Property
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" onClick={() => navigate('/sample-report')}>
            See Sample Report
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default CallToAction;