# Автоматическая проверка CUDA и HIP

[English](vendor-validation.md) | Русский

На Windows запустите из корня проекта одну команду:

```powershell
pwsh -File tools/verify-vendor.ps1
```

Если установлен только Windows PowerShell, используйте `powershell -File tools/verify-vendor.ps1`. Скрипт сам находит компиляторы CUDA и HIP, берёт архитектуру AMD из `hipInfo`, собирает подходящие модули, определяет GPU и проверяет каждый доступный CUDA/HIP backend на эталонной фразе и коротком поиске. Вводить модель карты, `gfx` или архитектуру CUDA не нужно. Отчёт сохраняется в `build/vendor-validation/vendor-report.txt`; отправьте этот файл и вывод сборки, если она остановилась до создания отчёта.

На Linux запустите `bash tools/verify-vendor.sh`. Скрипт тоже сам выбирает модули и устройства и пишет отчёт в `build/vendor-validation/vendor-report.txt`.

Нужны совместимый драйвер, SDK производителя, C++ toolchain и vcpkg. CUDA и HIP независимы: для NVIDIA не нужен HIP SDK, для AMD не нужен CUDA Toolkit. Если SDK или карта несовместимы, отчёт отмечает `UNAVAILABLE`, а приложение работает через Vulkan или CPU. Поддержку AMD проверяйте по [матрице HIP SDK](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/reference/system-requirements.html); RX 6650 XT на основной машине Gramix не входит в матрицу HIP SDK 7.2.0 для Windows.

Windows HIP SDK не поддерживает CMake HIP language, поэтому проект вызывает `hipcc` для отдельной DLL. На Linux сборка HIP использует CMake HIP language. После проверки сравнивайте только скорость **полной генерации проверенных GRAM-адресов**, которую печатает `--benchmark`.

CUDA/HIP реализованы в исходниках, но не подтверждены на подходящем оборудовании и не входят в установщики. Я добавлю их в выпуск после успешной сборки, эталонных векторов, короткого поиска и сохранения кошелька на поддерживаемой карте.
