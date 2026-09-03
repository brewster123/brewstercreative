import React, { useState } from 'react';
import { Commission } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  CheckCircle, 
  RotateCcw, 
  Eye, 
  Maximize2, 
  AlertCircle, 
  MessageSquare,
  Clock,
  Send,
  X,
  FileCheck
} from 'lucide-react';

interface ClientReviewSectionProps {
  commission: Commission;
}

export const ClientReviewSection: React.FC<ClientReviewSectionProps> = ({ commission }) => {
  const { submitClientReviewAction, currentUser } = useApp();
  
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const reviewData = commission.clientReviewData;
  const isApproved = commission.status === 'Final Approval' || commission.status === 'Completed' || reviewData?.clientStatus === 'Approved';
  const isRevisionRequested = commission.status === 'Revision Requested' || reviewData?.clientStatus === 'Revision Requested';

  const handleApprove = () => {
    submitClientReviewAction(commission.id, 'approve');
    setShowApproveModal(false);
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) return;
    submitClientReviewAction(commission.id, 'revision', revisionFeedback);
    setRevisionFeedback('');
    setShowRevisionModal(false);
  };

  if (!reviewData && commission.currentStage < 5) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-3 text-zinc-500">
          <Clock className="w-6 h-6 text-orange-500" />
        </div>
        <h4 className="font-display text-lg font-bold text-zinc-900 mb-1">
          Design Concept Under Craft
        </h4>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
          Your designer {commission.assignedDesigner} is currently working through Initial Design. Once proofs are rendered, they will appear here for your interactive review and feedback.
        </p>
      </div>
    );
  }

  const previewImages = reviewData?.previewImages || [
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=1200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-8 shadow-xs relative overflow-hidden">
      
      {/* Review Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code font-bold border border-orange-200">
              Stage 05 — Client Review
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Submitted on {reviewData?.submissionDate || 'September 3, 2026'}
            </span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-black text-zinc-900 mt-1">
            Design Draft Proof & Approval
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Carefully inspect the visual proofs below. You can approve or request revisions with specific notes.
          </p>
        </div>

        {/* Revision Allowance Badge */}
        <div className="bg-zinc-50 px-4 py-2.5 rounded-2xl border border-zinc-200/80 shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono-code uppercase font-bold">Revisions Used</div>
          <div className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
            <span className="text-orange-600 text-lg font-black font-display">{commission.revisionsUsed || 1}</span>
            <span className="text-zinc-400">/</span>
            <span>{commission.revisionsAllowed || 3} allowed</span>
          </div>
        </div>
      </div>

      {/* Designer Review Notes */}
      <div className="my-6 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-zinc-800">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>Designer Note from {commission.assignedDesigner}:</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic font-medium">
          "{reviewData?.reviewNotes || 'Version 2.1: Here are the refined Solis solar-geometry icon marks along with the custom geometric typography lockup and real-world hardware application mockups. Please review and let me know if you would like any adjustments to the mark sizing or weight!'}"
        </p>
      </div>

      {/* Proof Gallery Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono-code text-zinc-600 uppercase tracking-wider font-bold">
            High-Resolution Visual Proofs ({previewImages.length})
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">
            Click any image to view in fullscreen
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewImages.map((imgUrl, idx) => (
            <div
              key={idx}
              onClick={() => setZoomImage(imgUrl)}
              className="group relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 aspect-[16/10] cursor-pointer shadow-xs hover:border-orange-500 transition-all"
            >
              <img
                src={imgUrl}
                alt={`Proof ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  View Fullscreen
                </span>
                <span className="text-[11px] font-mono-code text-white bg-black/60 px-2.5 py-1 rounded-full font-bold">
                  Proof #{idx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Alert State */}
      {isApproved ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Design Approved by Client!
              </p>
              <p className="text-xs text-emerald-700">
                Your designer is preparing the final production file suite for delivery.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full font-mono-code shadow-xs">
            ✓ APPROVED
          </span>
        </div>
      ) : isRevisionRequested ? (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Revision in Progress (Revision #{commission.revisionsUsed})
              </p>
              <p className="text-xs text-amber-700">
                Feedback sent to designer: "{reviewData?.revisionFeedback || 'Modifications requested'}"
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full font-mono-code border border-amber-300">
            IN REVISION
          </span>
        </div>
      ) : (
        /* Action Buttons */
        <div className="bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-900">
              Ready to take action on this draft?
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Approve to move to final delivery, or request detailed refinements.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-request-revision"
              type="button"
              onClick={() => setShowRevisionModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 text-xs sm:text-sm font-bold transition-all border border-zinc-200 flex items-center justify-center gap-2 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 text-amber-500" />
              Request Revision
            </button>

            <button
              id="btn-approve-design"
              type="button"
              onClick={() => setShowApproveModal(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Design
            </button>
          </div>
        </div>
      )}

      {/* Revision Modal Dialog */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-[28px] max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-zinc-900">
                    Request Design Revision
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Revision {(commission.revisionsUsed || 0) + 1} of {commission.revisionsAllowed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  What would you like me to change?
                </label>
                <textarea
                  id="input-revision-feedback"
                  rows={4}
                  required
                  placeholder="e.g. Can we adjust the icon proportion, increase the letter spacing on the wordmark, and test a slightly deeper slate hue for the primary mark?"
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
                <p className="font-bold text-zinc-800">💡 Designer Tip:</p>
                <p>Specific feedback regarding layout, hierarchy, scale, and color helps me deliver your exact vision in the next draft.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-revision-request"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-[28px] max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle className="w-7 h-7" />
            </div>

            <h3 className="font-display text-lg font-black text-zinc-900 text-center mb-1">
              Approve This Design?
            </h3>
            <p className="text-xs text-zinc-500 text-center mb-6 leading-relaxed">
              By approving, you lock in this design direction. Your designer will proceed directly to packaging your high-resolution final deliverables and production source files.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700"
              >
                Go Back
              </button>
              <button
                id="btn-confirm-approve-design"
                type="button"
                onClick={handleApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Yes, Approve Design
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Zoom */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white bg-zinc-800 p-2.5 rounded-full hover:bg-zinc-700"
            onClick={() => setZoomImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="Design Proof High Res"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
