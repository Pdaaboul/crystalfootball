export type PackageTier = 'monthly' | 'half_season' | 'full_season';

export interface Package {
  id: string;
  slug: string;
  name: string;
  tier: PackageTier;
  description: string | null;
  duration_days: number;
  price_cents: number;
  original_price_cents: number | null;
  is_active: boolean;
  sort_index: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageFeature {
  id: string;
  package_id: string;
  label: string;
  sort_index: number;
}

export interface PackageWithFeatures extends Package {
  features: PackageFeature[];
}

export interface CreatePackageData {
  slug: string;
  name: string;
  tier: PackageTier;
  description?: string;
  duration_days: number;
  price_cents: number;
  original_price_cents?: number | null;
  is_active?: boolean;
  sort_index?: number;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  id: string;
}

export interface CreateFeatureData {
  package_id: string;
  label: string;
  sort_index?: number;
}

export interface UpdateFeatureData extends Partial<CreateFeatureData> {
  id: string;
} 