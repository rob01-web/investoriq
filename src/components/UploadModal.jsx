import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { motion } from "framer-motion";

/**
 * InvestorIQ Upload Modal
 * ------------------------
 * Allows users to securely upload property documents for analysis.
 * Automatically deducts credits and syncs metadata to Supabase.
 * Fully aligned with InvestorIQ’s professional brand palette.
 */

import React from "react";

/**
 * UploadModal (DISABLED)
 * ----------------------
 * This legacy modal has been replaced by the simplified Dashboard upload chooser.
 * Keeping the file for now to avoid import errors elsewhere, but it renders nothing.
 */

const UploadModal = () => {
  return null;
};

export default UploadModal;
