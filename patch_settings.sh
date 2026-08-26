awk '
/\{\/\* AI Model & Provider Configuration \*\/\}/ {
  print "          {/* Category Management */}"
  print "          <div className=\"border-t border-slate-200 dark:border-slate-800/80 pt-5 space-y-4\">"
  print "            <h4 className=\"text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2\">"
  print "              <Tag className=\"w-4 h-4 text-emerald-500 dark:text-emerald-400\" />"
  print "              Category Management"
  print "            </h4>"
  print "            <CategoryManager />"
  print "          </div>"
  print ""
}
{print}
' src/components/modals/SettingsModal.tsx > src/components/modals/SettingsModal.tmp
mv src/components/modals/SettingsModal.tmp src/components/modals/SettingsModal.tsx
