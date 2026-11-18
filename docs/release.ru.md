# Выпуск Gramix

[English](release.md) | Русский

Пользователь устанавливает готовый пакет из GitHub Releases. CMake, Node.js, Rust и компиляторы GPU нужны только сборочной системе. При запуске Gramix определяет CPU и GPU, проверяет доступные вычислительные движки и в режиме Auto выбирает самый быстрый проверенный; ручной выбор есть в настройках. Модули CUDA/HIP не входят в установщики, пока не пройдут аппаратную проверку.

## Автоматическая сборка

Workflow [release.yml](../.github/workflows/release.yml) запускается после создания тега `vX.Y.Z`. Сначала выполняется [Quality](../.github/workflows/ci.yml), затем отдельно собираются Windows NSIS и Linux DEB/AppImage. Публикация начинается только при успехе на обеих ОС. Workflow создаёт черновик GitHub Release с установщиками, подписями обновлений, `latest.json` и `SHA256SUMS.txt`, а описание берёт из `docs/release-notes-vX.Y.Z.md`. Ручной запуск собирает те же пакеты как артефакты для проверки и ничего не публикует.

Сценарии [Windows](../tools/build-release-windows.ps1) и [Linux](../tools/build-release-linux.sh) пересобирают C++ ядро, выполняют эталонные проверки, копируют свежий sidecar `gramix` и добавляют список слов и Vulkan-шейдер. Модули CUDA/HIP включаются, только если их удалось собрать с SDK. Доступность модулей определяется при запуске и подтверждается криптографическим self-test.

[check-version.py](../tools/check-version.py) проверяет, что CMake, npm, Cargo, Tauri и тег Git содержат одну версию. Локальная сборка пакета: `pwsh -File tools/build-release-windows.ps1` на Windows, `bash tools/build-release-linux.sh` на Linux.

## Сайт

Workflow [Site](../.github/workflows/pages.yml) собирает `npm run build:web` при каждом пуше в `main` и публикует сайт gram.lovlydev.ru на GitHub Pages. Переменные репозитория `TELEMETRY_URL` и `TELEMETRY_SITE_ID` подключают сборщик статистики; без них сайт ничего не отправляет и не показывает баннер согласия.

## Подписанные обновления

Tauri читает `latest.json` последнего GitHub Release. На Windows и в Linux AppImage приложение показывает новую версию и устанавливает её после остановки поиска. Linux DEB обновляется через пакетный менеджер. [make-update-manifest.py](../tools/make-update-manifest.py) берёт подписи `.sig` из артефактов и создаёт ссылки на оба установщика. Подпись обновлений Tauri отличается от подписи Windows-кода.

Ключ обновлений хранится локально в игнорируемой Git папке `.tools/signing/` и в секрете GitHub Actions `TAURI_SIGNING_PRIVATE_KEY`. Публичный ключ встроен в конфигурацию Tauri. Приватный ключ нужен для каждого будущего обновления; его потеря лишит пользователей обновления через приложение, поэтому его нужно хранить в резервной копии.

## Условия публикации

Для выпуска нужны успешные сборки Windows/Linux и проверки CPU/Vulkan. На Linux результат шифруется паролем пользователя, который нужно хранить отдельно. Прежде чем заявить поддержку CUDA/HIP, я провожу [аппаратную проверку](vendor-validation.ru.md) на поддерживаемой карте.

Установщик Windows может загрузить WebView2 Runtime, если его нет; Tauri делает это сам. Подпись Windows-кода пока не настроена, поэтому SmartScreen может предупредить о новом издателе.
