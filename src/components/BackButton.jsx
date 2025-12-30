import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * InvestorIQ Reusable Back Button
 * --------------------------------
 * Elegant floating button styled for the InvestorIQ brand.
 * Appears top-left when users are on standalone pages (e.g., Stripe checkout, modals, or external views).
 */

const BackButton = ({ label = 'Back to Dashboard', to = '/' }) => {
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
      className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-md
      border border-[#0F172A] bg-[#0F172A] text-white font-semibold shadow-sm
      hover:bg-[#0d1326] transition-colors duration-200"
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default BackButton;
