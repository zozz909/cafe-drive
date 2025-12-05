'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { sendOTP, verifyOTP, auth } from '@/lib/firebase';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>([]);
  const [pin, setPin] = useState<string[]>([]);
  const [step, setStep] = useState<'phone' | 'pin' | 'otp' | 'create_pin'>('phone');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // العد التنازلي
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // تهيئة reCAPTCHA مرة واحدة عند تحميل الصفحة
  useEffect(() => {
    const initRecaptcha = () => {
      if (recaptchaRef.current) return;

      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';

      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('✅ reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA expired');
          recaptchaRef.current = null;
          setRecaptchaReady(false);
        }
      });

      setRecaptchaReady(true);
    };

    const timer = setTimeout(initRecaptcha, 500);

    return () => {
      clearTimeout(timer);
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  // إعادة تهيئة reCAPTCHA
  const resetRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';

    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => console.log('✅ reCAPTCHA solved'),
    });
    setRecaptchaReady(true);
  }, []);

  // التحقق من رقم الجوال - هل المستخدم موجود أم جديد (من قاعدة البيانات)
  const handlePhoneSubmit = async () => {
    if (phone.length < 9) {
      toast.error('رقم الجوال غير صحيح');
      return;
    }

    setLoading(true);
    try {
      // التحقق من قاعدة البيانات
      const res = await fetch(`/api/customers?phone=${phone}`);
      const data = await res.json();

      if (data.exists && data.hasPin) {
        // مستخدم موجود - اذهب لإدخال الرمز السري
        setIsNewUser(false);
        setStep('pin');
      } else {
        // مستخدم جديد - أرسل OTP
        setIsNewUser(true);
        await sendOTPToPhone();
        return; // sendOTPToPhone handles setLoading(false)
      }
    } catch (error) {
      console.error('Error checking customer:', error);
      toast.error('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  // إرسال OTP عبر Firebase
  const sendOTPToPhone = async () => {
    if (!recaptchaRef.current) {
      toast.error('جاري التحميل، حاول مرة أخرى');
      resetRecaptcha();
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(phone, recaptchaRef.current);
      setConfirmationResult(result);
      setCountdown(60);
      setStep('otp');
      toast.success('تم إرسال رمز التحقق! 📱');
    } catch (error: unknown) {
      console.error('Error sending OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ';
      if (errorMessage.includes('too-many-requests')) {
        toast.error('محاولات كثيرة! انتظر قليلاً');
      } else if (errorMessage.includes('invalid-phone-number')) {
        toast.error('رقم الجوال غير صحيح');
      } else {
        toast.error('حدث خطأ في إرسال الرمز');
      }
      resetRecaptcha();
    }
    setLoading(false);
  };

  // نسيت الرمز السري - إرسال OTP لإعادة التعيين
  const handleForgotPin = async () => {
    setIsResettingPin(true);
    await sendOTPToPhone();
  };

  // إعادة إرسال OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    resetRecaptcha();
    await sendOTPToPhone();
  };

  // التحقق من OTP
  const handleOtpInput = async (num: string) => {
    if (otp.length < 6) {
      const newOtp = [...otp, num];
      setOtp(newOtp);

      // التحقق تلقائياً عند إكمال 6 أرقام
      if (newOtp.length === 6 && confirmationResult) {
        setLoading(true);
        try {
          await verifyOTP(confirmationResult, newOtp.join(''));
          toast.success('تم التحقق بنجاح! ✓');
          // الانتقال لإنشاء رمز سري جديد
          setStep('create_pin');
          setPin([]);
          setConfirmPin([]);
          setShowConfirm(false);
        } catch {
          toast.error('رمز التحقق غير صحيح!');
          setOtp([]);
        }
        setLoading(false);
      }
    }
  };

  // إدخال الرمز السري
  const handlePinInput = (num: string) => {
    if (showConfirm) {
      if (confirmPin.length < 4) {
        setConfirmPin([...confirmPin, num]);
      }
    } else {
      if (pin.length < 4) {
        setPin([...pin, num]);
      }
    }
  };

  const removeLastNumber = (type: 'otp' | 'pin') => {
    if (type === 'otp') {
      setOtp(otp.slice(0, -1));
    } else if (showConfirm) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  // تسجيل الدخول بالرمز السري (للمستخدم الموجود) - من قاعدة البيانات
  const handlePinLogin = useCallback(async () => {
    if (pin.length !== 4) return;

    setLoading(true);
    try {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: pin.join('') })
      });
      const data = await res.json();

      if (data.success) {
        // حفظ بيانات العميل في localStorage للاستخدام المحلي
        localStorage.setItem(`user_${phone}`, JSON.stringify(data.customer));
        toast.success('أهلاً بك! ☕');
        router.push('/');
      } else {
        toast.error(data.error || 'الرمز السري غير صحيح!');
        setPin([]);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('حدث خطأ في الاتصال');
      setPin([]);
    }
    setLoading(false);
  }, [pin, phone, router]);

  // إنشاء رمز سري جديد (للمستخدم الجديد أو إعادة التعيين) - في قاعدة البيانات
  const handleCreatePin = useCallback(async () => {
    if (pin.length !== 4) return;

    if (!showConfirm) {
      setShowConfirm(true);
      toast.info('أعد إدخال الرمز للتأكيد');
      return;
    }

    if (pin.join('') !== confirmPin.join('')) {
      toast.error('الرمز غير متطابق!');
      setConfirmPin([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          pin: pin.join(''),
          action: isResettingPin ? 'reset_pin' : 'register'
        })
      });
      const data = await res.json();

      if (data.success) {
        // حفظ بيانات العميل في localStorage
        localStorage.setItem(`user_${phone}`, JSON.stringify({ phone }));

        if (isResettingPin) {
          toast.success('تم تغيير الرمز السري بنجاح! 🔐');
        } else {
          toast.success('تم إنشاء الحساب بنجاح! 🎉');
        }
        router.push('/');
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Create PIN error:', error);
      toast.error('حدث خطأ في الاتصال');
    }
    setLoading(false);
  }, [pin, confirmPin, showConfirm, phone, router, isResettingPin]);

  // التحقق التلقائي عند إكمال الرمز
  useEffect(() => {
    if (step === 'pin' && pin.length === 4) {
      handlePinLogin();
    }
  }, [step, pin, handlePinLogin]);

  useEffect(() => {
    if (step === 'create_pin') {
      if (showConfirm && confirmPin.length === 4) {
        handleCreatePin();
      } else if (!showConfirm && pin.length === 4) {
        handleCreatePin();
      }
    }
  }, [step, pin, confirmPin, showConfirm, handleCreatePin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-amber-300/20 rounded-full"
            style={{ left: `${pos}%` }}
            initial={{ y: '100vh' }}
            animate={{ y: '-100vh' }}
            transition={{ duration: 12 + (i % 5) * 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-amber-100"
      >
        {/* اللوقو */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex justify-center mb-6"
        >
          <div className="relative w-28 h-28">
            <Image src="/logo.png" alt="Logo" fill className="object-contain drop-shadow-lg" />
          </div>
        </motion.div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <PhoneStep phone={phone} setPhone={setPhone} onSubmit={handlePhoneSubmit} loading={loading} />
          ) : step === 'otp' ? (
            <OtpStep
              otp={otp}
              countdown={countdown}
              loading={loading}
              onNumberClick={handleOtpInput}
              onRemove={() => removeLastNumber('otp')}
              onResend={handleResendOTP}
              onBack={() => {
                setStep('phone');
                setOtp([]);
                setConfirmationResult(null);
                setIsResettingPin(false);
                resetRecaptcha();
              }}
              isResetting={isResettingPin}
            />
          ) : step === 'pin' ? (
            <PinLoginStep
              pin={pin}
              onNumberClick={handlePinInput}
              onRemove={() => removeLastNumber('pin')}
              onForgot={handleForgotPin}
              onBack={() => { setStep('phone'); setPin([]); }}
              loading={loading}
            />
          ) : (
            <CreatePinStep
              showConfirm={showConfirm}
              pin={showConfirm ? confirmPin : pin}
              onNumberClick={handlePinInput}
              onRemove={() => removeLastNumber('pin')}
              onBack={() => {
                setStep('phone');
                setPin([]);
                setConfirmPin([]);
                setShowConfirm(false);
                setIsNewUser(false);
                setIsResettingPin(false);
              }}
              isResetting={isResettingPin}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// مكون رقم الجوال
function PhoneStep({ phone, setPhone, onSubmit, loading }: { phone: string; setPhone: (v: string) => void; onSubmit: () => void; loading: boolean }) {
  return (
    <motion.div
      key="phone"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">أهلاً بك ☕</h1>
        <p className="text-gray-500">أدخل رقم جوالك للمتابعة</p>
      </div>

      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">+966</div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="5xxxxxxxx"
          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-4 pr-16 text-lg focus:border-amber-400 focus:outline-none transition-colors text-left"
          dir="ltr"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-amber-200 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            جاري الإرسال...
          </span>
        ) : 'إرسال رمز التحقق 📱'}
      </motion.button>
    </motion.div>
  );
}

// مكون رمز التحقق OTP
function OtpStep({
  otp,
  countdown,
  loading,
  onNumberClick,
  onRemove,
  onResend,
  onBack,
  isResetting
}: {
  otp: string[];
  countdown: number;
  loading: boolean;
  onNumberClick: (num: string) => void;
  onRemove: () => void;
  onResend: () => void;
  onBack: () => void;
  isResetting?: boolean;
}) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          {loading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-8 h-8 border-3 border-white border-t-transparent rounded-full"
            />
          ) : (
            <span className="text-3xl">📱</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isResetting ? 'إعادة تعيين الرمز السري' : 'رمز التحقق'}
        </h1>
        <p className="text-gray-500">
          {isResetting ? 'أدخل رمز التحقق لإعادة تعيين الرمز السري' : 'أدخل الرمز المرسل إلى جوالك (6 أرقام)'}
        </p>
      </div>

      {/* عرض خانات OTP - 6 أرقام */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`w-11 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 ${
              otp[i]
                ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-200'
                : 'bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400'
            }`}
          >
            {otp[i] || '−'}
          </motion.div>
        ))}
      </div>

      {/* لوحة الأرقام */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {numbers.map((num, i) => (
          <motion.button
            key={i}
            whileHover={num ? { scale: 1.1 } : {}}
            whileTap={num ? { scale: 0.95 } : {}}
            onClick={() => {
              if (num === '⌫') onRemove();
              else if (num) onNumberClick(num);
            }}
            disabled={!num || (num !== '⌫' && otp.length >= 6) || loading}
            className={`h-14 text-xl font-bold rounded-2xl transition-all duration-200 ${
              num === '⌫'
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : num
                  ? 'bg-white hover:bg-green-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-100'
                  : 'invisible'
            } disabled:opacity-50`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* إعادة الإرسال */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-gray-400">
            إعادة الإرسال خلال <span className="text-amber-500 font-bold">{countdown}</span> ثانية
          </p>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onResend}
            className="text-amber-500 font-semibold hover:text-amber-600"
          >
            📩 إعادة إرسال الرمز
          </motion.button>
        )}
      </div>

      {/* زر الرجوع */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold"
      >
        رجوع
      </motion.button>
    </motion.div>
  );
}

// مكون تسجيل الدخول بالرمز السري (للمستخدم الموجود)
function PinLoginStep({
  pin,
  onNumberClick,
  onRemove,
  onForgot,
  onBack,
  loading
}: {
  pin: string[];
  onNumberClick: (num: string) => void;
  onRemove: () => void;
  onForgot: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <motion.div
      key="pin-login"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔑</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">أدخل الرمز السري</h1>
        <p className="text-gray-500">أدخل الأرقام الأربعة للدخول</p>
      </div>

      {/* عرض النقاط */}
      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              pin[i]
                ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-200'
                : 'bg-gray-100 border-2 border-dashed border-gray-300'
            }`}>
              {pin[i] && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 bg-white rounded-full"
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* لوحة الأرقام */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {numbers.map((num, i) => (
          <motion.button
            key={i}
            whileHover={num ? { scale: 1.1 } : {}}
            whileTap={num ? { scale: 0.95 } : {}}
            onClick={() => {
              if (num === '⌫') onRemove();
              else if (num) onNumberClick(num);
            }}
            disabled={!num || (num !== '⌫' && pin.length >= 4) || loading}
            className={`h-16 text-2xl font-bold rounded-2xl transition-all duration-200 ${
              num === '⌫'
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : num
                  ? 'bg-white hover:bg-amber-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-100'
                  : 'invisible'
            } disabled:opacity-50`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* نسيت الرمز + رجوع */}
      <div className="flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onForgot}
          disabled={loading}
          className="text-amber-500 font-semibold hover:text-amber-600"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"
              />
              جاري الإرسال...
            </span>
          ) : (
            '🔓 نسيت الرمز السري؟'
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold"
        >
          رجوع
        </motion.button>
      </div>
    </motion.div>
  );
}

// مكون إنشاء رمز سري جديد (للمستخدم الجديد أو إعادة التعيين)
function CreatePinStep({
  showConfirm,
  pin,
  onNumberClick,
  onRemove,
  onBack,
  isResetting
}: {
  showConfirm: boolean;
  pin: string[];
  onNumberClick: (num: string) => void;
  onRemove: () => void;
  onBack: () => void;
  isResetting?: boolean;
}) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <motion.div
      key="create-pin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">{showConfirm ? '🔐' : '🔑'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {showConfirm ? 'تأكيد الرمز السري' : (isResetting ? 'إنشاء رمز سري جديد' : 'إنشاء رمز سري')}
        </h1>
        <p className="text-gray-500">
          {showConfirm ? 'أعد إدخال نفس الأرقام للتأكيد' : 'أدخل 4 أرقام سهلة التذكر'}
        </p>
      </div>

      {/* عرض النقاط */}
      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              pin[i]
                ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-200'
                : 'bg-gray-100 border-2 border-dashed border-gray-300'
            }`}>
              {pin[i] && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 bg-white rounded-full"
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* لوحة الأرقام */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {numbers.map((num, i) => (
          <motion.button
            key={i}
            whileHover={num ? { scale: 1.1 } : {}}
            whileTap={num ? { scale: 0.95 } : {}}
            onClick={() => {
              if (num === '⌫') onRemove();
              else if (num) onNumberClick(num);
            }}
            disabled={!num || (num !== '⌫' && pin.length >= 4)}
            className={`h-16 text-2xl font-bold rounded-2xl transition-all duration-200 ${
              num === '⌫'
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : num
                  ? 'bg-white hover:bg-green-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-100'
                  : 'invisible'
            } disabled:opacity-50`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* زر الرجوع */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold"
      >
        إلغاء والرجوع
      </motion.button>
    </motion.div>
  );
}

