import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useUserStore } from '../../store/userStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('school_admin');
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password, role });
      setUser(res.data.user);
      toast.success('Registration successful! Welcome to Instique.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page dark:bg-dark-bg p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-forest dark:text-emerald-400">Instique</h1>
          <p className="text-muted dark:text-dark-text-muted mt-1">School ERP System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-deep dark:text-dark-text">Create an account</h2>

          <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@instique.com" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123" required />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary dark:text-dark-text-secondary">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/30 dark:focus:ring-emerald-500/30"
            >
              <option value="school_admin">School Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <Button type="submit" loading={loading} className="w-full">Sign up</Button>

          <div className="text-sm text-muted dark:text-dark-text-muted text-center">
            Already have an account? <Link to="/login" className="text-forest dark:text-emerald-400 hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}