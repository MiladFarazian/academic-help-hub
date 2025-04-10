
import { useState, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { useSessionCreation } from './useSessionCreation';
import { usePaymentSetup } from './usePaymentSetup';
import { useSlotSelection } from './useSlotSelection';
import { useBookingFlow } from './useBookingFlow';
import { useRateLimiter } from './useRateLimiter';
import { toast } from 'sonner';

/**
 * Primary hook for the booking session flow, composing the other specialized hooks
 */
export function useBookingSession(tutor: Tutor, isOpen: boolean, onClose: () => void) {
  const { user } = useAuthState();
  const { 
    step, 
    setStep, 
    authRequired, 
    setAuthRequired, 
    resetBookingFlow 
  } = useBookingFlow();
  
  const {
    selectedSlot,
    setSelectedSlot,
    calculatePaymentAmount
  } = useSlotSelection();
  
  const {
    creatingSession,
    setCreatingSession,
    sessionId,
    setSessionId,
    createSession
  } = useSessionCreation();
  
  const {
    clientSecret,
    setClientSecret,
    paymentAmount,
    setPaymentAmount,
    paymentError,
    setPaymentError,
    isTwoStagePayment,
    setIsTwoStagePayment,
    setupPayment,
    resetPaymentSetup,
    isProcessing
  } = usePaymentSetup();
  
  // Use the enhanced rate limiter - with default values
  const rateLimiter = useRateLimiter();
  
  // Reset the flow when the modal is closed
  useSessionReset(isOpen, resetBookingFlow, setSelectedSlot, setSessionId, resetPaymentSetup, setCreatingSession);
  
  // Handle slot selection
  const handleSlotSelect = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    // Check rate limiting
    if (rateLimiter.isRateLimited()) {
      toast.error("Please wait a moment before trying again");
      return;
    }
    
    rateLimiter.trackRequest();
    
    try {
      setSelectedSlot(slot);
      
      // Calculate payment amount (hourly rate prorated by duration)
      const hourlyRate = tutor.hourlyRate || 50; // default to $50 if not set
      const amount = calculatePaymentAmount(slot, hourlyRate);
      
      // Create a new session
      setCreatingSession(true);
      const session = await createSession(slot, user, tutor);
      
      if (session) {
        setSessionId(session.id);
        setStep('payment');
        
        // Set up payment intent
        const result = await setupPayment({
          sessionId: session.id,
          amount: amount,
          tutor: tutor,
          user: user,
          forceTwoStage: false
        });
        
        // Set two-stage payment flag based on the result
        if (result && result.isTwoStagePayment !== undefined) {
          setIsTwoStagePayment(result.isTwoStagePayment);
        }
      }
    } catch (error) {
      console.error("Error in slot selection:", error);
      toast.error("Failed to set up session. Please try again.");
    } finally {
      setCreatingSession(false);
    }
  }, [user, tutor, calculatePaymentAmount, createSession, setupPayment, setStep, 
      setSessionId, setCreatingSession, setSelectedSlot, setAuthRequired, 
      setIsTwoStagePayment, rateLimiter]);
  
  // Handle payment completion
  const handlePaymentComplete = useCallback(() => {
    setStep('processing');
    
    // After a short delay, close the modal
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [onClose, setStep]);
  
  // Handle cancellation
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Retry payment setup with enhanced rate limiting
  const retryPaymentSetup = useCallback(() => {
    if (sessionId && selectedSlot && user) {
      // Check rate limiting
      if (rateLimiter.isRateLimited()) {
        toast.error("Please wait before trying again");
        return;
      }
      
      rateLimiter.trackRequest();
      setCreatingSession(true);
      
      // Calculate amount again
      const hourlyRate = tutor.hourlyRate || 50;
      const amount = calculatePaymentAmount(selectedSlot, hourlyRate);
      
      // Try payment setup again with forceTwoStage=true as a fallback option
      setupPayment({
        sessionId: sessionId,
        amount: amount,
        tutor: tutor,
        user: user,
        forceTwoStage: true
      })
        .then(result => {
          // Set two-stage payment flag based on the result
          if (result && result.isTwoStagePayment !== undefined) {
            setIsTwoStagePayment(result.isTwoStagePayment);
          }
        })
        .finally(() => {
          setCreatingSession(false);
        });
    } else {
      toast.error("Missing session information. Please try again.");
    }
  }, [sessionId, selectedSlot, user, tutor, calculatePaymentAmount, setupPayment, 
      setCreatingSession, setIsTwoStagePayment, rateLimiter]);
  
  return {
    user,
    step,
    selectedSlot,
    sessionId,
    creatingSession: creatingSession || isProcessing,
    authRequired,
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired,
    retryPaymentSetup,
    isProcessing,
    isCoolingDown: false // Simplified for now
  };
}

/**
 * Hook for resetting the session when the modal is closed
 */
function useSessionReset(
  isOpen: boolean,
  resetBookingFlow: () => void,
  setSelectedSlot: (slot: BookingSlot | null) => void,
  setSessionId: (id: string | null) => void, 
  resetPaymentSetup: () => void,
  setCreatingSession: (creating: boolean) => void
) {
  useState(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetBookingFlow();
        setSelectedSlot(null);
        setSessionId(null);
        resetPaymentSetup();
        setCreatingSession(false);
      }, 300); // slight delay to avoid visual glitches
    }
  });
}
