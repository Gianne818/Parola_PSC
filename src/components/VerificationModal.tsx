import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../utils/translations';

interface VerificationModalProps {
  phoneNumber: string;
  onVerify: () => void;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ phoneNumber, onVerify, onClose }) => {
  const { language } = useAppState();
  const t = translations[language];
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (otp === '482910') {
      onVerify();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-marine-800 border border-teal-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-teal-500">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-xl font-bold text-white">{t.verify}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-marine-900/50 rounded-2xl p-4 mb-6 border border-white/5">
          <p className="text-sm text-gray-300">
            {t.mockGatewayMsg} <span className="font-bold text-white">{phoneNumber}</span>:
            <br />
            <span className="italic text-teal-400 mt-2 block">"Your Parola verification code is 482910"</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t.otpPrompt}</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setError(false);
              }}
              placeholder="000000"
              className={`w-full px-4 py-3 rounded-full bg-marine-900 border ${error ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:border-teal-500 transition-colors text-center text-xl tracking-widest`}
              maxLength={6}
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-bold shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
