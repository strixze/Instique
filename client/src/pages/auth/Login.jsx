import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useUserStore } from '../../store/userStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const setUser = useUserStore((s) => s.setUser);
 const navigate = useNavigate();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 try {
 const res = await authApi.login({ email, password });
 setUser(res.data.user);
 toast.success('Welcome back!');
 navigate('/dashboard');
 } catch (err) {
 toast.error(err?.message || 'Login failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-page p-4">
 <div className="w-full max-w-sm space-y-6">
 <div className="text-center">
 <h1 className="text-3xl font-bold text-forest">Instique</h1>
 <p className="text-muted mt-1">School ERP System</p>
 </div>

 <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
 <h2 className="text-lg font-semibold text-deep">Sign in</h2>

 <Input label="Email"type="email"value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@instique.com"required />
 <Input label="Password"type="password"value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123"required />

 <Button type="submit"loading={loading} className="w-full">Sign in</Button>

 <div className="text-xs text-muted text-center">
 Demo: admin@instique.com / password123
 </div>
 <div className="text-sm text-muted text-center">
 Don't have an account? <Link to="/register"className="text-forest hover:underline">Sign up</Link>
 </div>
 </form>
 </div>
 </div>
 );
}
