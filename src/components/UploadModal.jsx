import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';

const UploadModal = ({ open, onClose, onUpload }) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    propertyAddress: '',
    dealType: 'off-market',
    files: []
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 10MB limit.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });
    setFormData((prev) => ({ ...prev, files: validFiles }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.propertyAddress) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the property address.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.dealType === 'off-market' && formData.files.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please upload at least one document for off-market deals.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert({
          user_id: user.id,
          property_address: formData.propertyAddress,
          deal_type: formData.dealType,
          status: 'Processing',
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      const propertyId = propertyData.id;

      if (formData.files.length > 0) {
        const uploadPromises = formData.files.map(async (file) => {
          const filePath = `${user.id}/${propertyId}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('property_documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          return {
            property_id: propertyId,
            user_id: user.id,
            file_name: file.name,
            storage_path: filePath,
          };
        });

        const fileMetadata = await Promise.all(uploadPromises);
        const { error: filesError } = await supabase
          .from('property_files')
          .insert(fileMetadata);
        if (filesError) throw filesError;
      }

      const newCredits = (profile.report_credits || 1) - 1;
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ report_credits: newCredits })
        .eq('id', user.id);
      if (creditError) throw creditError;

      onUpload();
      setFormData({ propertyAddress: '', dealType: 'off-market', files: [] });
      onClose();
    } catch (error) {
      console.error('Upload process failed:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border border-[#1F8A8A]/20 shadow-2xl rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 backdrop-blur-md p-8"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A] text-center">
              Upload Property Deal
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Property Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-slate-800">
                Property Address *
              </Label>
              <input
                id="address"
                type="text"
                placeholder="123 Main St, City, State ZIP"
                value={formData.propertyAddress}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, propertyAddress: e.target.value }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F8A8A] text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Deal Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Deal Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                {['off-market', 'mls'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, dealType: type }))}
                    className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                      formData.dealType === type
                        ? 'border-[#1F8A8A] bg-[#1F8A8A]/10 text-[#0F172A]'
                        : 'border-slate-200 text-slate-600 hover:border-[#1F8A8A]/50'
                    }`}
                  >
                    {type === 'off-market' ? 'Off-Market' : 'MLS Listing'}
                    <div className="text-xs text-slate-500 mt-1">
                      {type === 'off-market' ? 'Private deal' : 'Broker-listed'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-800">
                Upload Documents {formData.dealType === 'off-market' ? '*' : '(Optional)'}
              </Label>
              <p className="text-xs text-slate-600 mb-1">
                Upload rent rolls, photos, or financials (PDF, DOC, XLS, CSV; Max 10MB per file)
              </p>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-[#1F8A8A] hover:bg-[#1F8A8A]/5 transition-all cursor-pointer"
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer select-none">
                  <Upload className="h-10 w-10 text-[#1F8A8A] mx-auto mb-3" />
                  <div className="text-sm font-semibold text-slate-800 mb-1">
                    Click to upload or drag & drop
                  </div>
                  <div className="text-xs text-slate-500">Your files remain confidential</div>
                </label>
              </motion.div>

              {formData.files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                  {formData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <FileText className="h-5 w-5 text-[#1F8A8A] flex-shrink-0" />
                        <div className="truncate">
                          <div className="text-sm font-medium truncate">{file.name}</div>
                          <div className="text-xs text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="border border-slate-300 text-slate-600 hover:text-[#1F8A8A] hover:border-[#1F8A8A] transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-bold hover:opacity-90 transition-all shadow-md"
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Use 1 Credit & Analyze'}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
