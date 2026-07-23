BILLS CONTROL CENTER V2 - ACTUAL PAYMENT WORKFLOW

WHAT CHANGED
- Planned Payment was removed everywhere.
- Actual Payment is displayed as "This Month."
- Funding coverage compares Funding Selected against This Month.
- Execute checkboxes change Status between Planned and Paid.
- Remaining bill count uses payment Status, not dollar comparisons.
- Excel import expects the Bills sheet column: Actual Payment ($).

UPDATE GITHUB
1. Extract this ZIP.
2. Copy all files from the extracted folder into your existing local Bills repo folder.
3. Replace files when prompted.
4. In VS Code terminal:
   git add .
   git commit -m "Use actual payment workflow"
   git push origin main
5. Wait for GitHub Pages deployment.
6. Hard refresh the public site with Ctrl+Shift+R.
7. If the old app remains: F12 > Application > Service Workers > Unregister, then Storage > Clear site data.

WEEKEND TEST
1. Import Bills_Master_v2.xlsx.
2. Confirm Minimum Due and This Month totals.
3. Update Funding account and bucket balances.
4. Click Auto-fill funding.
5. Confirm Remaining to Fund reaches $0.
6. Use Execute while paying bills and mark each Paid.
7. Export Excel when finished.
