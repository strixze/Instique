import { useUserStore } from '../../store/userStore';
import { User, Mail, Shield, Building, Phone } from 'lucide-react';

export default function Profile() {
  const user = useUserStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-deep tracking-tight">My Profile</h1>
        <p className="text-sm sm:text-base text-muted mt-1">Manage your account settings and personal information</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Header/Cover Area */}
        <div className="h-32 bg-gradient-to-r from-forest/90 to-sage"></div>
        
        <div className="px-6 pb-6">
          {/* Avatar Area */}
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-md">
              <div className="w-full h-full rounded-full bg-forest flex items-center justify-center text-white">
                <User size={40} />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-deep">{user.name}</h2>
              <p className="text-muted capitalize font-medium">{user.role?.replace('_', ' ')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-soft border border-border/50">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-forest shadow-sm">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="text-sm font-medium text-deep">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-soft border border-border/50">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-forest shadow-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Account Role</p>
                  <p className="text-sm font-medium text-deep capitalize">{user.role?.replace('_', ' ')}</p>
                </div>
              </div>
              
              {user.school && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-soft border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-forest shadow-sm">
                    <Building size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">School ID</p>
                    <p className="text-sm font-medium text-deep">{user.school}</p>
                  </div>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-soft border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-forest shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Phone Number</p>
                    <p className="text-sm font-medium text-deep">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
