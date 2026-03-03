# Self Review (VS Code Extension)

Review your own changes before committing: set a baseline, see added lines highlighted, then approve (new baseline) or reject (revert to baseline).

## Features

- **Start** – Save current file content as baseline. New edits are highlighted (green by default).
- **Approve** – Accept current content as the new baseline.
- **Reject** – Revert the whole file to the last baseline.
- **Stop** – Clear baseline and stop highlighting.

## Commands

| Command | Description |
|--------|-------------|
| `Self Review: Start (set baseline)` | Set current file as baseline |
| `Self Review: Approve changes (new baseline)` | Make current content the new baseline |
| `Self Review: Reject all (revert to baseline)` | Revert file to last baseline |
| `Self Review: Stop (clear baseline)` | Clear baseline and decorations |

Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type "Self Review".

## Settings

- **`selfReview.decorationBackgroundColor`** – Background color for added lines (e.g. `rgba(0, 255, 0, 0.15)` or `#00ff0026`).
- **`selfReview.statusBar`** – Show/hide Self Review status in the status bar (default: `true`).

## Requirements

- VS Code 1.74.0 or newer.

## Development

```bash
npm install
npm run compile
```

**Як зробити, щоб команди з’явились:**

1. **Режим розробки (F5)**  
   - Якщо відкрито **батьківську папку** : у меню Run/Debug вибери конфіг **"Run Self Review Extension"** і натисни **F5**.  
   - Якщо відкрито **саме папку** `extension-vscode`: вибери **"Run Extension (open this folder first)"** і натисни **F5**.  
   Відкриється нове вікно — **команди працюють саме в цьому новому вікні** (Ctrl+Shift+P → «Self Review»). У старому вікні (де ти натиснув F5) команди не з’являться.

2. **Встановити як розширення**  
   Щоб Self Review працював у звичайному робочому вікні без F5:
   ```bash
   cd extension-vscode && npm run package
   ```
   З’явиться файл `self-review-1.0.0.vsix`. У Cursor: Extensions → ⋮ → Install from VSIX… → вибери цей файл і перезавантаж вікно.

Помилка «command selfReview.start not found» буває, коли розширення не завантажено: або F5 запускався не з тієї папки, або команду шукають у тому ж вікні, де натиснули F5 (потрібно викликати команду в **новому** вікні Extension Development Host).

## License

ISC
