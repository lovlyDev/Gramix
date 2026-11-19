# Gramix 0.4.0

Tokens and portfolio value, an NFT gallery, search by .ton domains and Telegram usernames, and a tray mode for the app.

## Downloads

- Windows: `Gramix_0.4.0_x64-setup.exe` (NSIS).
- Linux: `Gramix_0.4.0_amd64.deb` or `Gramix_0.4.0_amd64.AppImage`.
- Checksums are in `SHA256SUMS.txt`.

## What's New

- Address check has tabs: History, Tokens and NFT. A tab loads its data only when you open it.
- Tokens: every token on the address with its balance, value in rubles or dollars and 24-hour change, sorted by value, with a share bar. The portfolio value at the top adds GRAM and tokens; spam tokens are hidden and not counted.
- Address book: "Balances" also refreshes tokens and shows the portfolio value of each address.
- NFT gallery: all NFTs of the address as a grid, with filters by collection and a separate Telegram filter. A click opens the NFT card. Spam and NFTs without a name or collection are hidden behind a toggle.
- .ton domains get their own card, since they have no image of their own.
- Search by domain: type `name.ton`, `@username`, `username.t.me` or `t.me/username` in search, Address check or the address book. Gramix uses the wallet from the domain's DNS record or, if none is set, the owner of the domain NFT, and says which one it used. Links like `/address/wallet.ton` work on the website.
- Tray: closing the window hides Gramix to the notification area; address search and balance watching keep running. Click the icon to open the window, or use its menu to quit. It can be turned off in Settings → Interface.

## Verified

- Unit tests, application and website builds, application and website smoke tests, and the English interface check.
- Tokens, portfolio value, the NFT gallery and domain search were checked against live OpenTonAPI on the website build.

## Known Limitations

- I could not test the tray icon, its menu and hiding on close in automated tests; they need a check on an installed build. On Linux the tray depends on the desktop environment supporting status icons.
- A username without a linked wallet resolves to the owner of its NFT. Telegram usernames that are not on Fragment cannot be resolved.
- Token prices and NFT data come from OpenTonAPI; tokens without a price are shown without a value.
- In English, a few error messages that come from the compute core and the Developer CLI output remain in their original language.
- CUDA and HIP exist in source, but their modules are not in the installers: they have not been validated on NVIDIA and AMD cards. Those cards can use Vulkan Compute if the driver supports it; the CPU remains the fallback.
- GPU acceleration covers the 12-word scheme. The 24-word scheme uses the CPU.
- The Windows installer is not signed with a publisher certificate; SmartScreen may show a warning.
