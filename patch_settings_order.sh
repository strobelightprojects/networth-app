awk '
/\{\/\* Quick Actions \/ Export \& Print Section \*\/\}/ {
  print "          {/* Category Management */}"
  print "          <div className=\"space-y-4\">"
  print "            <h4 className=\"text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2\">"
  print "              <Tag className=\"w-4 h-4 text-emerald-500 dark:text-emerald-400\" />"
  print "              Category Management"
  print "            </h4>"
  print "            <CategoryManager />"
  print "          </div>"
  print "          <hr className=\"border-slate-200 dark:border-slate-800\" />"
  print ""
}
/\{\/\* Category Management \*\/\}/ {
  skip = 1
}
/\{\/\* AI Model \& Provider Configuration \*\/\}/ {
  skip = 0
}
{
  if (!skip) print
}
' src/components/modals/SettingsModal.tsx > src/components/modals/SettingsModal.tmp
mv src/components/modals/SettingsModal.tmp src/components/modals/SettingsModal.tsx
