import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-page w-full">
      {/* Fixed Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Full-width Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto scrollbar-thin w-full">
          <div className="p-4 sm:p-5 lg:p-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
