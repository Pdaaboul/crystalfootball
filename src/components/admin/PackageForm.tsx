'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PackageWithFeatures, PackageTier, PackageFeature } from '@/lib/types/packages';
import { 
  autoGenerateSlug, 
  validatePrice, 
  centsToDollars
} from '@/lib/utils/packages';

interface PackageFormProps {
  mode: 'create' | 'edit';
  initialData?: PackageWithFeatures;
}

export function PackageForm({ mode, initialData }: PackageFormProps) {
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [tier, setTier] = useState<PackageTier>(initialData?.tier || 'monthly');
  const [description, setDescription] = useState(initialData?.description || '');
  const [durationDays, setDurationDays] = useState(initialData?.duration_days || 30);
  const [price, setPrice] = useState(initialData ? centsToDollars(initialData.price_cents).toString() : '');
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.original_price_cents ? centsToDollars(initialData.original_price_cents).toString() : ''
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [sortIndex, setSortIndex] = useState(initialData?.sort_index || 100);
  const [features, setFeatures] = useState<PackageFeature[]>(initialData?.features || []);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  // Auto-generate slug from name
  useEffect(() => {
    if (mode === 'create' && name && !slug) {
      setSlug(autoGenerateSlug(name));
    }
  }, [name, slug, mode]);

  // Track changes for unsaved warning
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [name, slug, tier, description, durationDays, price, originalPrice, isActive, sortIndex, features]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Package name is required';
    if (!slug.trim()) newErrors.slug = 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(slug)) newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (durationDays < 1) newErrors.durationDays = 'Duration must be at least 1 day';
    if (durationDays > 365) newErrors.durationDays = 'Duration cannot exceed 365 days';
    
    // Validate tier
    if (!['monthly', 'half_season', 'full_season'].includes(tier)) {
      newErrors.tier = 'Invalid tier selection';
    }

    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.error!;
    }

    if (originalPrice) {
      const originalPriceValidation = validatePrice(originalPrice);
      if (!originalPriceValidation.isValid) {
        newErrors.originalPrice = originalPriceValidation.error!;
      } else if (priceValidation.isValid && originalPriceValidation.cents! <= priceValidation.cents!) {
        newErrors.originalPrice = 'Original price must be higher than current price';
      }
    }

    // Check slug uniqueness for create mode or if slug changed in edit mode
    if (slug && (mode === 'create' || (mode === 'edit' && slug !== initialData?.slug))) {
      try {
        const response = await fetch(`/api/admin/packages/check-slug?slug=${encodeURIComponent(slug)}&exclude=${mode === 'edit' ? initialData?.id : ''}`);
        if (response.ok) {
          const result = await response.json();
          if (!result.available) {
            newErrors.slug = 'This slug is already in use. Please choose a different one.';
          }
        }
      } catch {
        // If check fails, allow submission to handle server-side validation
        console.warn('Failed to check slug uniqueness');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) return;

    setIsSubmitting(true);

    try {
      const priceValidation = validatePrice(price);
      const originalPriceValidation = originalPrice ? validatePrice(originalPrice) : null;

      const packageData = {
        name: name.trim(),
        slug: slug.trim(),
        tier,
        description: description.trim(),
        duration_days: durationDays,
        price_cents: priceValidation.cents!,
        original_price_cents: originalPriceValidation?.cents || null,
        is_active: isActive,
        sort_index: sortIndex,
      };

      const url = mode === 'create' 
        ? '/api/admin/packages'
        : `/api/admin/packages/${initialData!.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save package');
      }

      const result = await response.json();
      const packageId = result.package.id;

      // Update features for edit mode
      if (mode === 'edit' && features.length > 0) {
        const featuresResponse = await fetch(`/api/admin/packages/${packageId}/features`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            features: features.map((feature, index) => ({
              id: feature.id,
              label: feature.label,
              sort_index: (index + 1) * 10,
            })),
          }),
        });

        if (!featuresResponse.ok) {
          console.error('Failed to update features');
        }
      }

      setHasUnsavedChanges(false);
      
      // Revalidate packages page cache
      try {
        await fetch('/api/revalidate?path=/packages', { method: 'POST' });
      } catch {
        // Revalidation is optional, don't block on failure
        console.warn('Failed to revalidate packages page');
      }
      
      router.push('/admin/packages');
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save package' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;

    const feature: PackageFeature = {
      id: `temp-${Date.now()}`,
      package_id: initialData?.id || '',
      label: newFeature.trim(),
      sort_index: (features.length + 1) * 10,
    };

    setFeatures([...features, feature]);
    setNewFeature('');
  };

  const removeFeature = async (featureId: string) => {
    if (featureId.startsWith('temp-')) {
      setFeatures(features.filter(f => f.id !== featureId));
    } else {
      // Delete from database
      try {
        await fetch(`/api/admin/features/${featureId}`, { method: 'DELETE' });
        setFeatures(features.filter(f => f.id !== featureId));
      } catch (error) {
        console.error('Failed to delete feature:', error);
      }
    }
  };

  const updateFeature = (featureId: string, newLabel: string) => {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, label: newLabel } : f
    ));
  };

  const moveFeature = (fromIndex: number, toIndex: number) => {
    const newFeatures = [...features];
    const [moved] = newFeatures.splice(fromIndex, 1);
    newFeatures.splice(toIndex, 0, moved);
    setFeatures(newFeatures);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.submit && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Package Details */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Package Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Package Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors ${
                errors.name ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter package name"
            />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-2">
              Slug <span className="text-destructive">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors ${
                errors.slug ? 'border-destructive' : 'border-border'
              }`}
              placeholder="package-slug"
            />
            {errors.slug && <p className="text-destructive text-sm mt-1">{errors.slug}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Used in URLs. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          {/* Tier */}
          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-foreground mb-2">
              Tier <span className="text-destructive">*</span>
            </label>
            <select
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as PackageTier)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
            >
              <option value="monthly">Monthly</option>
              <option value="half_season">Half Season</option>
              <option value="full_season">Full Season</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-2">
              Duration (days) <span className="text-destructive">*</span>
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors ${
                errors.durationDays ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.durationDays && <p className="text-destructive text-sm mt-1">{errors.durationDays}</p>}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
              Price (USD) <span className="text-destructive">*</span>
            </label>
            <input
              id="price"
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors ${
                errors.price ? 'border-destructive' : 'border-border'
              }`}
              placeholder="49.99"
            />
            {errors.price && <p className="text-destructive text-sm mt-1">{errors.price}</p>}
          </div>

          {/* Original Price */}
          <div>
            <label htmlFor="originalPrice" className="block text-sm font-medium text-foreground mb-2">
              Original Price (USD)
              <span className="text-muted-foreground text-xs ml-1">(optional)</span>
            </label>
            <input
              id="originalPrice"
              type="text"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors ${
                errors.originalPrice ? 'border-destructive' : 'border-border'
              }`}
              placeholder="59.99"
            />
            {errors.originalPrice && <p className="text-destructive text-sm mt-1">{errors.originalPrice}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Show discount if higher than current price
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors resize-none ${
                errors.description ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Brief description of the package..."
            />
            {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-cyan-blue focus:ring-cyan-blue border-border rounded"
              />
              <span className="ml-2 text-sm text-foreground">Active</span>
            </label>
          </div>

          {/* Sort Index */}
          <div>
            <label htmlFor="sortIndex" className="block text-sm font-medium text-foreground mb-2">
              Sort Index
            </label>
            <input
              id="sortIndex"
              type="number"
              value={sortIndex}
              onChange={(e) => setSortIndex(parseInt(e.target.value) || 100)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Package Features</h3>
        
        {/* Add Feature */}
        <div className="flex space-x-2 mb-6">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
            placeholder="Add a new feature..."
            maxLength={200}
          />
          <button
            type="button"
            onClick={addFeature}
            disabled={!newFeature.trim() || features.length >= 12}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
          >
            Add Feature
          </button>
        </div>

        {/* Features List */}
        {features.length > 0 ? (
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={feature.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => moveFeature(index, index - 1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeature(index, index + 1)}
                    disabled={index === features.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
                <input
                  type="text"
                  value={feature.label}
                  onChange={(e) => updateFeature(feature.id, e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
                  maxLength={200}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(feature.id)}
                  className="text-destructive hover:text-destructive/80 p-1"
                  aria-label="Remove feature"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No features added yet. Add some features to describe what this package includes.</p>
          </div>
        )}

        {features.length >= 12 && (
          <p className="text-warning text-sm mt-4">
            Maximum of 12 features allowed per package.
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Package' : 'Update Package'}
        </button>
      </div>
    </form>
  );
} 