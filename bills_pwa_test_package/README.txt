BILLS CONTROL CENTER - TEST PACKAGE

FILES
- Bills_Master.xlsx: Excel master workbook with Bills, Funding Accounts, Monthly Plan, and instructions.
- index.html: Main PWA file.
- start_server.bat: Windows launcher.
- start_server.command: macOS launcher.
- start_server.sh: Linux launcher.

QUICK TEST
1. Run the local server:
   Windows: double-click start_server.bat
   macOS: double-click start_server.command (you may need to allow it in Security)
   Linux: run ./start_server.sh
2. Open http://localhost:8000 in Chrome.
3. Tap Import Excel and choose Bills_Master.xlsx.
4. Update Ally accounts/buckets in the Funding tab.
5. Use Auto-fill funding.
6. Review the Execute tab.
7. Export Excel to save PWA changes back into a workbook.

PHONE TEST ON SAME WI-FI
1. Start the server on the computer.
2. Find the computer's local IP address.
3. On the phone, open http://COMPUTER-IP:8000
4. Use Chrome's Install App / Add to Home Screen option.

DATA STORAGE
The PWA saves its live data in that browser's local storage. Import/Export Excel is the portable backup and device-to-device sync method.

NOTE: Excel import/export uses the official SheetJS browser script and needs an internet connection when the app first loads. The rest of the PWA can cache locally.
