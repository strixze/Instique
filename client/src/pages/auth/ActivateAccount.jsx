import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck, School, ArrowRight } from 'lucide-react';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setVerifyError('No activation token was provided. Please verify the link in your activation email.');
      return;
    }

    const checkToken = async () => {
      try {
        setVerifying(true);
        const res = await authApi.verifyActivationToken(token);
        setTokenInfo(res.data);
      } catch (err) {
        setVerifyError(err?.message || 'This activation link is invalid or has expired.');
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.activateAccount({ token, password });
      setActivated(true);
      toast.success('Account activated successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to activate account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-lg shadow-blue-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Instique <span className="text-blue-400 text-lg font-medium">| Parent Portal</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {tokenInfo?.schoolName ? tokenInfo.schoolName : 'School ERP Platform'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-8 shadow-2xl space-y-6 text-slate-100">
          
          {verifying ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 text-sm font-medium">Verifying your activation link...</p>
            </div>
          ) : verifyError ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Activation Link Invalid or Expired</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {verifyError}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-700/60 space-y-3">
                <p className="text-xs text-slate-500">
                  Please contact your school administrator to receive a fresh activation link.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Return to Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : activated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Account Activated!</h3>
                <p className="text-sm text-slate-300">
                  Your parent account has been successfully set up and verified.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  Log In to Parent Portal <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Set Up Your Account</h2>
                <p className="text-sm text-slate-400">
                  Welcome <strong className="text-slate-200">{tokenInfo?.name || 'Parent'}</strong>! Choose a secure password for your portal access.
                </p>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  value={tokenInfo?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-300 text-sm cursor-not-allowed select-all"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength <= 25 ? 'bg-red-500 w-1/4' : strength <= 50 ? 'bg-amber-500 w-2/4' : strength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                        }`}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 text-right">
                      {strength <= 25 && 'Weak'}
                      {strength === 50 && 'Moderate'}
                      {strength === 75 && 'Good'}
                      {strength === 100 && 'Strong'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!password || password !== confirmPassword}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  Activate Account
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  By activating your account, you agree to Instique's Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Instique ERP. Protected with Brevo secure delivery.
        </div>

      </div>
    </div>
  );
}
