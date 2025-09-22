import { requireRole } from '@/lib/auth/session';
import { PromoteUserForm } from '@/components/admin/PromoteUserForm';
import { TestNotificationPanel } from '@/components/admin/TestNotificationPanel';
import Link from 'next/link';

export default async function SuperAdminPage() {
  const profile = await requireRole('superadmin');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
                <span className="text-pure-black font-bold text-sm">CF</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Super Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
              >
                Admin Panel
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome, {profile.display_name || 'Super Admin'}
          </h2>
          <p className="text-muted-foreground">
            You have full system access. Use these tools to manage users, monitor system health, and configure platform settings.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* User Role Management */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">User Role Management</h3>
                <p className="text-sm text-muted-foreground">
                  Promote or demote users between admin and user roles
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">👑</span>
              </div>
            </div>
            <PromoteUserForm />
          </div>

          {/* WhatsApp Test Notifications */}
          <TestNotificationPanel />

          {/* System Controls */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">System Controls</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor and control core system functions
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-muted/50 hover:bg-muted border border-border rounded-lg p-4 text-left transition-colors focus-visible-cyan">
                  <div className="text-sm font-medium text-foreground">System Health</div>
                  <div className="text-xs text-muted-foreground">View status</div>
                </button>
                <button className="bg-muted/50 hover:bg-muted border border-border rounded-lg p-4 text-left transition-colors focus-visible-cyan">
                  <div className="text-sm font-medium text-foreground">Cache Control</div>
                  <div className="text-xs text-muted-foreground">Clear cache</div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Advanced system controls coming soon...
              </p>
            </div>
          </div>

          {/* Database Management */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Database Management</h3>
                <p className="text-sm text-muted-foreground">
                  Backup, restore, and analyze database performance
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🗄️</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-muted/50 hover:bg-muted border border-border rounded-lg p-4 text-left transition-colors focus-visible-cyan">
                  <div className="text-sm font-medium text-foreground">Backup DB</div>
                  <div className="text-xs text-muted-foreground">Create backup</div>
                </button>
                <button className="bg-muted/50 hover:bg-muted border border-border rounded-lg p-4 text-left transition-colors focus-visible-cyan">
                  <div className="text-sm font-medium text-foreground">Analytics</div>
                  <div className="text-xs text-muted-foreground">View stats</div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Database tools coming soon...
              </p>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">System Logs & Audit Trail</h3>
                <p className="text-sm text-muted-foreground">
                  Recent system events and user activities
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-2">Recent Events</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-foreground">User promotion: {profile.user_id.slice(0, 8)}...</span>
                  <span className="text-muted-foreground">2 minutes ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">System backup completed</span>
                  <span className="text-muted-foreground">1 hour ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">New user registration</span>
                  <span className="text-muted-foreground">3 hours ago</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Full audit logging coming soon...
              </p>
            </div>
          </div>

          {/* Platform Settings */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Platform Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure global platform settings and feature flags
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔧</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="text-sm font-medium text-foreground mb-1">Maintenance Mode</div>
                <div className="text-xs text-muted-foreground mb-2">Currently: Disabled</div>
                <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded focus-visible-cyan">
                  Configure
                </button>
              </div>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="text-sm font-medium text-foreground mb-1">Feature Flags</div>
                <div className="text-xs text-muted-foreground mb-2">Manage features</div>
                <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded focus-visible-cyan">
                  Configure
                </button>
              </div>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="text-sm font-medium text-foreground mb-1">API Limits</div>
                <div className="text-xs text-muted-foreground mb-2">Rate limiting</div>
                <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded focus-visible-cyan">
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Security & Audit */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security & Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor security events and manage access controls
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🛡️</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-foreground">Active Sessions</div>
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-xs text-muted-foreground">Users online</div>
                </div>
                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-foreground">Failed Logins</div>
                  <div className="text-2xl font-bold text-destructive">3</div>
                  <div className="text-xs text-muted-foreground">Last 24 hours</div>
                </div>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-muted/50 hover:bg-muted border border-border rounded-lg p-3 text-left transition-colors focus-visible-cyan">
                  <div className="text-sm font-medium text-foreground">Review Security Logs</div>
                  <div className="text-xs text-muted-foreground">Authentication events</div>
                </button>
                <button className="w-full bg-muted/50 hover:bg-muted border border-border rounded-lg p-3 text-left transition-colors focus-visible-cyan">
                  <div className="text-sm font-medium text-foreground">Manage IP Whitelist</div>
                  <div className="text-xs text-muted-foreground">Access control</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 