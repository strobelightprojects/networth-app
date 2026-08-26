awk '
/^const ASSET_CATEGORIES/ { skip = 1; next }
/^const LIABILITY_CATEGORIES/ { skip = 1; next }
/^const INSURANCE_CATEGORIES/ { skip = 1; next }
/^\];/ {
  if (skip) {
    skip = 0
    next
  }
}
{
  if (!skip) print
}
' src/components/modals/AddItemModal.tsx > src/components/modals/AddItemModal.tmp

sed -i "s/import { suggestCategoriesWithGemini } from '..\/..\/utils\/geminiCategoryService';/import { suggestCategoriesWithGemini } from '..\/..\/utils\/geminiCategoryService';\nimport { useCustomCategories } from '..\/..\/utils\/categoryManager';/" src/components/modals/AddItemModal.tmp

sed -i "s/const \[itemType, setItemType\] = useState<ItemType>('asset');/const assetCategories = useCustomCategories('asset') as AssetCategory[];\n  const liabilityCategories = useCustomCategories('liability') as LiabilityCategory[];\n  const insuranceCategories = useCustomCategories('insurance') as InsuranceCategory[];\n\n  const ASSET_CATEGORIES = assetCategories;\n  const LIABILITY_CATEGORIES = liabilityCategories;\n  const INSURANCE_CATEGORIES = insuranceCategories;\n\n  const [itemType, setItemType] = useState<ItemType>('asset');/" src/components/modals/AddItemModal.tmp

mv src/components/modals/AddItemModal.tmp src/components/modals/AddItemModal.tsx
