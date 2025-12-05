'use client';

import { useState, useRef, useEffect } from 'react';
import { sendOTP, verifyOTP, auth } from '@/lib/firebase';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

export default function TestOTPPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // تهيئة reCAPTCHA مرة واحدة عند تحميل الصفحة
  useEffect(() => {
    const initRecaptcha = () => {
      if (recaptchaRef.current) return;

      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';

      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal', // مرئي للتشخيص
        callback: () => {
          console.log('✅ reCAPTCHA solved');
          setRecaptchaReady(true);
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA expired');
          recaptchaRef.current = null;
          setRecaptchaReady(false);
        }
      });

      setRecaptchaReady(true);
    };

    // تأخير بسيط للتأكد من تحميل DOM
    const timer = setTimeout(initRecaptcha, 500);

    return () => {
      clearTimeout(timer);
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 9) {
      setStatus('❌ الرجاء إدخال رقم جوال صحيح');
      return;
    }

    if (!recaptchaRef.current) {
      setStatus('❌ reCAPTCHA غير جاهز، يرجى تحديث الصفحة');
      return;
    }

    setLoading(true);
    setStatus('⏳ جاري إرسال رمز التحقق...');

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+966${phone.replace(/^0/, '')}`;
      console.log('📱 Sending OTP to:', formattedPhone);

      const result = await sendOTP(phone, recaptchaRef.current);
      console.log('✅ OTP sent successfully, confirmation result:', result);

      setConfirmationResult(result);
      setStep('otp');
      setStatus(`✅ تم إرسال رمز التحقق إلى ${formattedPhone}`);
    } catch (error: unknown) {
      console.error('Send OTP Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setStatus(`❌ فشل الإرسال: ${errorMessage}`);

      // إعادة تهيئة reCAPTCHA عند الخطأ
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';

      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved'),
      });
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setStatus('❌ الرجاء إدخال رمز التحقق (6 أرقام)');
      return;
    }

    if (!confirmationResult) {
      setStatus('❌ لم يتم إرسال رمز التحقق بعد');
      return;
    }

    setLoading(true);
    setStatus('⏳ جاري التحقق من الرمز...');

    try {
      const user = await verifyOTP(confirmationResult, otp);
      setStatus(`✅ تم التحقق بنجاح! User UID: ${user.uid}`);
      console.log('Verified User:', user);
    } catch (error: unknown) {
      console.error('Verify OTP Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setStatus(`❌ فشل التحقق: ${errorMessage}`);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setPhone('');
    setOtp('');
    setStatus('');
    setStep('phone');
    setConfirmationResult(null);

    // إعادة تهيئة reCAPTCHA
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';

    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => console.log('reCAPTCHA solved'),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-8" dir="rtl">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-amber-800 mb-6">
          🔐 اختبار OTP
        </h1>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" className="flex justify-center mb-4"></div>

        {!recaptchaReady && (
          <p className="text-center text-amber-600 mb-4">👆 اضغط على reCAPTCHA أعلاه أولاً</p>
        )}

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">رقم الجوال:</label>
              <div className="flex gap-2">
                <span className="bg-gray-100 px-3 py-3 rounded-lg text-gray-600">+966</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="5XXXXXXXX"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  maxLength={9}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || !recaptchaReady}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700 transition disabled:opacity-50"
            >
              {loading ? '⏳ جاري الإرسال...' : !recaptchaReady ? '⏳ جاري التحميل...' : '📱 إرسال رمز التحقق'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              تم إرسال رمز التحقق إلى: <span className="font-bold">+966{phone}</span>
            </p>

            <div>
              <label className="block text-gray-700 mb-2">رمز التحقق (OTP):</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="أدخل 6 أرقام"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                maxLength={6}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? '⏳ جاري التحقق...' : '✓ تأكيد الرمز'}
            </button>

            <button
              onClick={handleReset}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              ← رجوع
            </button>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            status.includes('✅') ? 'bg-green-100 text-green-800' :
            status.includes('❌') ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

