import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User, X, Mail, Phone } from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);

  const handleSendOTP = () => {
    if (phoneNumber.length >= 8) {
      setStep('otp');
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleVerify = () => {
    // In a real implementation, this would verify the OTP
    // For now, redirect to Replit Auth
    window.location.href = '/api/login';
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // Redirect to Replit Auth with social provider
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center mb-6">
            <div className="bg-haramain-green p-3 rounded-full w-16 h-16 mx-auto mb-4">
              <User className="text-white h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.welcome')}</h2>
            <p className="text-gray-600 mt-2">{t('auth.signInMessage')}</p>
          </div>

          {step === 'phone' ? (
            <div>
              <div className="mb-6">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.phoneNumber')}
                </Label>
                <div className="flex">
                  <div className="flex items-center bg-gray-100 px-3 rounded-l-lg border border-r-0 border-gray-300">
                    <span className="text-sm text-gray-600">+966</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="50 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOTP}
                className="w-full bg-haramain-green text-white hover:bg-green-700 mb-4"
                disabled={phoneNumber.length < 8}
              >
                <Phone className="h-4 w-4 mr-2" />
                {t('auth.sendOTP')}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">{t('auth.continueWith')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <FaGoogle className="text-red-500" />
                    <span className="text-sm font-medium">Google</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <FaFacebook className="text-blue-600" />
                    <span className="text-sm font-medium">Facebook</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.enterOTP')}
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  {t('auth.otpSent')} +966 {phoneNumber}
                </p>
                <div className="flex space-x-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      data-index={index}
                      className="w-12 h-12 text-center text-lg font-semibold"
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerify}
                className="w-full bg-haramain-green text-white hover:bg-green-700 mb-4"
                disabled={otp.some(digit => !digit)}
              >
                <Mail className="h-4 w-4 mr-2" />
                {t('auth.verify')}
              </Button>

              <div className="text-center">
                <Button variant="link" className="text-sm text-haramain-green hover:underline">
                  {t('auth.resendOTP')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
