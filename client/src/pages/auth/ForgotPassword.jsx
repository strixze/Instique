import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { KeyRound, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success('Password reset instructions sent');
    } catch (err) {
      toast.error(err?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-lg shadow-blue-500/10">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Instique <span className="text-blue-400 text-lg font-medium">| Security</span>
          </h1>
          <p className="text-slate-400 text-sm">Forgot Password Recovery</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-8 shadow-2xl space-y-6 text-slate-100">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <MailCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Check Your Email</h3>
                <p className="text-sm text-slate-300">
                  If an account exists for <strong className="text-white">{email}</strong>, we've dispatched a password reset link.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Please check your inbox (and spam folder). The link is active for 60 minutes.
              </p>
              <div className="pt-4 border-t border-slate-700">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Reset Your Password</h2>
                <p className="text-sm text-slate-400">
                  Enter your registered email address and we'll send you a link to reset your password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
