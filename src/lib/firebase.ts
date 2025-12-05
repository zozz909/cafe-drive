import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmoKdu1qZC7C6SqzaFwClIPyHeIfnM2Oc",
  authDomain: "loop-31141.firebaseapp.com",
  projectId: "loop-31141",
  storageBucket: "loop-31141.firebasestorage.app",
  messagingSenderId: "582936494182",
  appId: "1:582936494182:web:01fe6609e555dc9190eda7",
  measurementId: "G-LTJRKXR1NF"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
auth.languageCode = 'ar'; // Arabic SMS

// Global recaptcha verifier
let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

// Setup reCAPTCHA
export const setupRecaptcha = (containerId: string): RecaptchaVerifier | null => {
  if (typeof window === 'undefined') return null;

  // Clear existing verifier
  if (globalRecaptchaVerifier) {
    globalRecaptchaVerifier.clear();
    globalRecaptchaVerifier = null;
  }

  // Clear container
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';

  globalRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
      globalRecaptchaVerifier = null;
    }
  });

  return globalRecaptchaVerifier;
};

// Send OTP
export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  // Format phone number for Saudi Arabia
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+966${phoneNumber.replace(/^0/, '')}`;
  console.log('Sending OTP to:', formattedPhone);

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('sendOTP error:', error);
    // Reset recaptcha on error
    globalRecaptchaVerifier = null;
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
  const result = await confirmationResult.confirm(otp);
  return result.user;
};

export { auth };

