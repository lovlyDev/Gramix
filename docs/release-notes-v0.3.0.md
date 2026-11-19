# Gramix 0.3.0

English interface, GRAM price, address book with balance watching, address history, a save folder for exports, and Windows notifications.

## Downloads

- Windows: `Gramix_0.3.0_x64-setup.exe` (NSIS).
- Linux: `Gramix_0.3.0_amd64.deb` or `Gramix_0.3.0_amd64.AppImage`.
- Checksums are in `SHA256SUMS.txt`.

## What's New

- English interface: Settings → Interface → Language. On first launch the language follows the system; the website follows the browser language.
- GRAM price on Overview in rubles or dollars, with a smooth price chart for 24 hours, 7, 30 and 90 days. Balances in Address check, the address book and the history show the converted value. The price is loaded only after you press "Show price".
- Address book on Overview: save public addresses with labels, see their balances, and turn on watching with the eye icon. While the app (or the website page) is open, watched balances are checked every 5 minutes with one request, and a change shows a notification.
- Address history in Address check: transfers, contract calls and tokens from OpenTonAPI, 20 at a time, with GRAM and fiat amounts, counterparties and comments. Spam is hidden behind a toggle. Each entry opens its transaction in Transactions.
- Exports: Settings → Files lets you choose a folder. Files are saved there without a dialog and never overwrite an existing file. The save notification has a "Show in folder" button that opens Explorer with the file selected.
- Notifications: they now appear at the top center, have a close button, stay while the pointer is over them, and disappear after 5 seconds, or 9 seconds for errors.
- Windows notifications when an address is found, a Contract Vanity search finishes or a Benchmark run completes, if the Gramix window is minimized or inactive. They can be turned off in Settings → Interface.
- Transactions → By BOC: a BOC that is not a transaction now explains what it is and offers "Open in BOC Explorer". For a message BOC it can find the transaction the message caused.
- Benchmark: import a history from a JSON file saved earlier.

## Verified

- Unit tests, application and website builds, application and website smoke tests, including a check that the English website has no Russian text left.
- Price, address history and bulk balances were checked against live OpenTonAPI on the website build.
- Rust commands for exports and the save folder are covered by unit tests.

## Known Limitations

- I could not click through the native "Save as" dialog, the folder picker, "Show in folder" or a Windows notification in automated tests. They need a check on an installed build.
- Windows shows notifications under the installed app's name; in a development build the name and icon can differ.
- In English, a few error messages that come from the compute core and the Developer CLI output remain in their original language.
- Address watching works only while Gramix or the website page is open; there is no background service.
- OpenTonAPI limits anonymous requests; with many quick refreshes you may see a rate-limit message.
- CUDA and HIP exist in source, but their modules are not in the installers: they have not been validated on NVIDIA and AMD cards. Those cards can use Vulkan Compute if the driver supports it; the CPU remains the fallback.
- GPU acceleration covers the 12-word scheme. The 24-word scheme uses the CPU.
- The Windows installer is not signed with a publisher certificate; SmartScreen may show a warning.
