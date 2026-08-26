awk '
/^const ALL_ASSET_CATEGORIES/ { skip = 1; next }
/^const ALL_LIABILITY_CATEGORIES/ { skip = 1; next }
/^const ALL_INSURANCE_CATEGORIES/ { skip = 1; next }
/^\];/ {
  if (skip) {
    skip = 0
    next
  }
}
{
  if (!skip) print
}
' src/components/dashboard/AssetsLiabilitiesLedger.tsx > src/components/dashboard/AssetsLiabilitiesLedger.tmp

sed -i "s/import { suggestCategoryFromAccountName } from '..\/..\/utils\/aiCategorySuggester';/import { suggestCategoryFromAccountName } from '..\/..\/utils\/aiCategorySuggester';\nimport { useCustomCategories } from '..\/..\/utils\/categoryManager';/" src/components/dashboard/AssetsLiabilitiesLedger.tmp

sed -i "s/const \[searchQuery, setSearchQuery\] = useState('');/const assetCategories = useCustomCategories('asset') as AssetCategory[];\n  const liabilityCategories = useCustomCategories('liability') as LiabilityCategory[];\n  const insuranceCategories = useCustomCategories('insurance') as InsuranceCategory[];\n\n  const ALL_ASSET_CATEGORIES = assetCategories;\n  const ALL_LIABILITY_CATEGORIES = liabilityCategories;\n  const ALL_INSURANCE_CATEGORIES = insuranceCategories;\n\n  const [searchQuery, setSearchQuery] = useState('');/" src/components/dashboard/AssetsLiabilitiesLedger.tmp

mv src/components/dashboard/AssetsLiabilitiesLedger.tmp src/components/dashboard/AssetsLiabilitiesLedger.tsx
