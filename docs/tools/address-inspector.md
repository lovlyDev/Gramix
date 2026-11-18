# Address Inspector

English | [Русский](address-inspector.ru.md)

Address Inspector checks raw and friendly GRAM addresses. The check itself is offline.

```text
gramix address inspect EQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4wJB
gramix address inspect 0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3 --json
```

It validates length, alphabet, CRC16, the bounceable/testnet tags, the workchain, and the 256-bit hash, and prints the canonical raw form plus the bounceable and non-bounceable forms of the same address. A raw input carries no network flag, so its friendly forms use mainnet. This is address encoding, not proof that the account exists. A corrupted address returns a non-zero exit code.

In the app and on the site the same check is on the «Проверка адреса» page, with copy buttons and a QR code for the public address. Links like `https://gram.lovlydev.ru/address/<address>` open it directly.

The separate «Запросить состояние аккаунта» button sends only the verified public raw address to OpenTonAPI: `testnet.tonapi.io` for testnet addresses, otherwise `tonapi.io`. The response is labeled with its source and time; the balance is shown in GRAM, with the exact value in a tooltip. Requests have a 10-second timeout, a response size limit, HTTP 429 handling, and a minimum interval. Responses are not cached and are cleared on new input.
