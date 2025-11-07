import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * InvestorIQ Reusable Back Button
 * --------------------------------
 * Elegant floating button styled for the new InvestorIQ brand.
 * Appears top-left when users are on external or standalone pages (like Stripe checkout).
 */

const BackButton = ({ label = 'Back to InvestorIQ', to = '/' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // If user came from within the app, go back. Otherwise, go to home.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(to);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full 
      bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-semibold shadow-lg 
      hover:opacity-90 hover:scale-[1.03] transition-all duration-200"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default BackButton;
