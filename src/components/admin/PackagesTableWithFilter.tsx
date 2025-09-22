'use client';

import { useState, useMemo } from 'react';
import { PackagesTable } from './PackagesTable';
import { PackageWithFeatures } from '@/lib/types/packages';

interface PackagesTableWithFilterProps {
  packages: PackageWithFeatures[];
}

export function PackagesTableWithFilter({ packages }: PackagesTableWithFilterProps) {
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  const filteredPackages = useMemo(() => {
    if (filter === 'active') {
      return packages.filter(pkg => pkg.is_active);
    }
    return packages;
  }, [packages, filter]);

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-foreground">View:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active')}
            className="px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
          >
            <option value="all">All Packages ({packages.length})</option>
            <option value="active">Active Only ({packages.filter(p => p.is_active).length})</option>
          </select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredPackages.length} of {packages.length} packages
        </div>
      </div>

      {/* Packages Table */}
      <PackagesTable packages={filteredPackages} />
    </div>
  );
} 