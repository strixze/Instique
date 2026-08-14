import { Building2, CreditCard, Users, DollarSign, ArrowRight, Plus, Trash2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { schoolApi } from '../../api/school.api';
import { saasApi } from '../../api/saas.api';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white"/>
        </div>
        <div>
          <p className="text-2xl font-bold text-deep">{value ?? '-'}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Installments state
  const [instName, setInstName] = useState('Admission Installment Plan');
  const [percentages, setPercentages] = useState([100]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [savingInst, setSavingInst] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await schoolApi.getAll({ limit: 1 });
        setStats({ totalSchools: res.meta?.total || 0, totalRevenue: 0, activeSubscriptions: 0, trialSchools: 0 });
      } catch {}
      setLoading(false);
    };

    const fetchInstallments = async () => {
      try {
        const res = await saasApi.getInstallments();
        if (res.data) {
          setInstName(res.data.name);
          setPercentages(res.data.percentages || [100]);
        }
      } catch (e) {
        toast.error('Failed to load installment configurations');
      } finally {
        setLoadingInst(false);
      }
    };

    fetchStats();
    fetchInstallments();
  }, []);

  const handleAddInstallment = () => {
    setPercentages([...percentages, 0]);
  };

  const handleRemoveInstallment = (index) => {
    if (percentages.length <= 1) return;
    const next = percentages.filter((_, i) => i !== index);
    setPercentages(next);
  };

  const handlePercentageChange = (index, value) => {
    const next = [...percentages];
    next[index] = Number(value) || 0;
    setPercentages(next);
  };

  const totalSum = percentages.reduce((sum, val) => sum + val, 0);
  const isValidSum = Math.round(totalSum) === 100;

  const handleSaveInstallments = async () => {
    if (!instName.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (!isValidSum) {
      toast.error('Percentages must sum up to exactly 100%');
      return;
    }
    setSavingInst(true);
    try {
      const res = await saasApi.createInstallments({
        name: instName,
        percentages
      });
      setPercentages(res.data.percentages);
      toast.success('Installment settings saved successfully!');
    } catch (e) {
      toast.error(e?.message || 'Failed to save installment settings');
    } finally {
      setSavingInst(false);
    }
  };

  if (loading || loadingInst) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl"/>)}
        </div>
        <Skeleton className="h-64 rounded-xl"/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-deep">Super Admin Dashboard</h1>
        <p className="text-muted text-sm mt-1">Platform overview and settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Schools" value={stats?.totalSchools} color="bg-forest"/>
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats?.activeSubscriptions} color="bg-forest"/>
        <StatCard icon={Users} label="Trial Schools" value={stats?.trialSchools} color="bg-warning"/>
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats?.totalRevenue}`} color="bg-info"/>
      </div>

      {/* Custom Installments Settings Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-deep">Fee Installment Plan Settings</h2>
            <p className="text-sm text-muted">Customize percentages for student fee payment. Students must pay at least the first installment to be eligible for admission.</p>
          </div>
          <Button onClick={handleSaveInstallments} loading={savingInst} disabled={!isValidSum || !instName.trim()} variant="primary">
            <Save size={16} className="mr-2"/>Save Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-4">
            <Input label="Installment Plan Name *" value={instName} onChange={(e) => setInstName(e.target.value)} placeholder="e.g. 30-30-40 Custom Plan" />

            <div className="space-y-3">
              <label className="text-sm font-semibold text-secondary">Installment Percentages *</label>
              
              <div className="space-y-2">
                {percentages.map((percent, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={percent === 0 ? '' : percent}
                        onChange={(e) => handlePercentageChange(idx, e.target.value)}
                        placeholder={`Installment ${idx + 1} percentage`}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-[9px] text-sm text-muted">%</span>
                    </div>
                    {percentages.length > 1 && (
                      <button
                        onClick={() => handleRemoveInstallment(idx)}
                        className="p-2 text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors animate-fade-in"
                        title="Remove installment"
                      >
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={handleAddInstallment} className="mt-2">
                <Plus size={16} className="mr-1"/>Add Installment
              </Button>
            </div>
          </div>

          {/* Visualisation / Verification Side */}
          <div className="p-5 bg-surface border border-border rounded-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-deep text-sm">Live Visualization</h3>
              
              {/* Flow rendering */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-border rounded-lg justify-center min-h-[64px]">
                {percentages.map((percent, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-center border transition-all duration-300 ${isValidSum ? 'bg-success-light text-success-text border-success/30' : 'bg-sage-soft text-secondary border-border'}`}>
                      Inst. {idx + 1}
                      <div className="text-sm font-black mt-0.5">{percent}%</div>
                    </div>
                    {idx < percentages.length - 1 && (
                      <ArrowRight size={14} className="text-muted"/>
                    )}
                  </div>
                ))}
              </div>

              {/* Status info */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-muted">Total Sum:</span>
                  <span className={isValidSum ? 'text-success-text font-bold' : 'text-danger-text font-bold'}>{totalSum}%</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted">Required for Admission:</span>
                  <span className="text-forest font-bold">{percentages[0] || 0}% (1st Installment)</span>
                </div>
              </div>
            </div>

            {/* Validation alerts */}
            <div className={`p-3 rounded-lg text-xs border transition-all duration-300 ${isValidSum ? 'bg-success-light text-success-text border-success/20' : 'bg-danger-light text-danger-text border-danger/20'}`}>
              {isValidSum ? (
                <p className="font-medium">✓ The percentages sum to exactly 100%. This is a valid configuration.</p>
              ) : (
                <p className="font-medium">⚠ Warning: The percentages sum to {totalSum}%. They must sum to exactly 100% to save.</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
