"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const DiffMatchPatch = require("diff-match-patch");
let baseline = null;
let targetUri = null;
const dmp = new DiffMatchPatch();
let addedDecorationType = null;
let removedDecorationType = null;
let statusBarItem = null;
function createAddedDecoration() {
    return vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 255, 0, 0.25)',
        isWholeLine: true,
    });
}
function createRemovedDecoration() {
    return vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        after: {
            contentText: '← видалено',
            color: 'red',
            margin: '0 0 0 1rem',
        },
    });
}
function updateStatusBar(editor) {
    if (!statusBarItem)
        return;
    if (!baseline || !targetUri) {
        statusBarItem.hide();
        return;
    }
    if (editor && editor.document.uri.toString() === targetUri.toString()) {
        const current = editor.document.getText();
        const diffs = dmp.diff_main(baseline, current);
        dmp.diff_cleanupSemantic(diffs);
        const added = diffs.filter(([type]) => type === 1).length;
        const removed = diffs.filter(([type]) => type === -1).length;
        if (added > 0 || removed > 0) {
            statusBarItem.text = `$(warning) Зміни: +${added}, -${removed}`;
            statusBarItem.color = 'red';
            statusBarItem.tooltip = 'Є відмінності від baseline';
            statusBarItem.show();
        }
        else {
            statusBarItem.text = '$(check) Без змін';
            statusBarItem.color = undefined;
            statusBarItem.show();
        }
    }
    else {
        statusBarItem.hide();
    }
}
function clearDecorations() {
    for (const editor of vscode.window.visibleTextEditors) {
        addedDecorationType && editor.setDecorations(addedDecorationType, []);
        removedDecorationType && editor.setDecorations(removedDecorationType, []);
    }
}
function updateDecorations() {
    if (!baseline || !targetUri) {
        clearDecorations();
        return;
    }
    for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.toString() !== targetUri.toString())
            continue;
        const current = editor.document.getText();
        const diffs = dmp.diff_main(baseline, current);
        dmp.diff_cleanupSemantic(diffs);
        const addedRanges = [];
        const removedRanges = [];
        let indexBaseline = 0;
        let indexCurrent = 0;
        for (const [type, text] of diffs) {
            if (type === 1) {
                // додане у current
                const start = editor.document.positionAt(indexCurrent);
                const end = editor.document.positionAt(indexCurrent + text.length);
                addedRanges.push(new vscode.Range(start, end));
                indexCurrent += text.length;
            }
            else if (type === -1) {
                // видалене з baseline — показуємо inline hint
                const start = editor.document.positionAt(indexCurrent);
                removedRanges.push(new vscode.Range(start, start));
                indexBaseline += text.length;
            }
            else {
                indexBaseline += text.length;
                indexCurrent += text.length;
            }
        }
        if (!addedDecorationType)
            addedDecorationType = createAddedDecoration();
        if (!removedDecorationType)
            removedDecorationType = createRemovedDecoration();
        editor.setDecorations(addedDecorationType, addedRanges);
        editor.setDecorations(removedDecorationType, removedRanges);
        updateStatusBar(editor);
    }
}
function activate(context) {
    addedDecorationType = createAddedDecoration();
    removedDecorationType = createRemovedDecoration();
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(vscode.commands.registerCommand('selfReview.startForFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Відкрий файл для Self Review.');
            return;
        }
        baseline = editor.document.getText();
        targetUri = editor.document.uri;
        updateDecorations();
        vscode.window.showInformationMessage(`Self Review: baseline встановлено для ${editor.document.fileName}`);
    }), vscode.commands.registerCommand('selfReview.approveForFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !targetUri || editor.document.uri.toString() !== targetUri.toString())
            return;
        baseline = editor.document.getText();
        updateDecorations();
        vscode.window.showInformationMessage('Self Review: зміни підтверджено (новий baseline).');
    }), vscode.commands.registerCommand('selfReview.rejectForFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !baseline || !targetUri || editor.document.uri.toString() !== targetUri.toString())
            return;
        editor.edit((editBuilder) => {
            const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
            editBuilder.replace(fullRange, baseline);
        }).then(() => {
            updateDecorations();
        });
        vscode.window.showInformationMessage('Self Review: відхилено, повернено до baseline.');
    }), vscode.commands.registerCommand('selfReview.stopForFile', () => {
        baseline = null;
        targetUri = null;
        clearDecorations();
        addedDecorationType?.dispose();
        removedDecorationType?.dispose();
        addedDecorationType = createAddedDecoration();
        removedDecorationType = createRemovedDecoration();
        updateStatusBar();
        vscode.window.showInformationMessage('Self Review: зупинено, baseline очищено.');
    }), vscode.workspace.onDidChangeTextDocument(() => {
        updateDecorations();
    }), vscode.window.onDidChangeActiveTextEditor(() => {
        updateDecorations();
    }));
    context.subscriptions.push(statusBarItem);
}
function deactivate() {
    addedDecorationType?.dispose();
    removedDecorationType?.dispose();
    addedDecorationType = null;
    removedDecorationType = null;
    statusBarItem?.dispose();
    statusBarItem = null;
}
//# sourceMappingURL=extension.js.map