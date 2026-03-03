import * as vscode from 'vscode';
import DiffMatchPatch = require('diff-match-patch');

let baseline: string | null = null;
const dmp = new DiffMatchPatch();
let decorationType: vscode.TextEditorDecorationType | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;

function getDecorationColor(): string {
  return vscode.workspace.getConfiguration('selfReview').get<string>('decorationBackgroundColor', 'rgba(0, 255, 0, 0.15)');
}

function createDecoration(): vscode.TextEditorDecorationType {
  const color = getDecorationColor();
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: color,
    isWholeLine: true,
  });
}

function updateStatusBar(): void {
  if (!vscode.workspace.getConfiguration('selfReview').get<boolean>('statusBar', true)) {
    statusBarItem?.hide();
    return;
  }
  if (!statusBarItem) return;
  if (baseline !== null) {
    statusBarItem.text = '$(git-branch) Self Review: baseline set';
    statusBarItem.tooltip = 'Self Review active. Use commands to Approve or Reject changes.';
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

function clearDecorations(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      if (decorationType) {
        editor.setDecorations(decorationType, []);
      }
    }
  }
  
function updateDecorations(): void {
    if (!baseline) {
      clearDecorations();
      return;
    }
  
    for (const editor of vscode.window.visibleTextEditors) {
      const current = editor.document.getText();
      const diffs = dmp.diff_main(baseline, current);
      dmp.diff_cleanupSemantic(diffs);
  
      const ranges: vscode.Range[] = [];
      let index = 0;
  
      for (const [type, text] of diffs) {
        if (type === 1) {
          const start = editor.document.positionAt(index);
          const end = editor.document.positionAt(index + text.length);
          ranges.push(new vscode.Range(start, end));
        }
        if (type !== -1) {
          index += text.length;
        }
      }
  
      if (!decorationType) {
        decorationType = createDecoration();
      }
      editor.setDecorations(decorationType, ranges);
    }
  }

export function activate(context: vscode.ExtensionContext): void {
  decorationType = createDecoration();
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

  context.subscriptions.push(
    vscode.commands.registerCommand('selfReview.start', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a file to start Self Review.');
        return;
      }
      baseline = editor.document.getText();
      updateDecorations();
      updateStatusBar();
      vscode.window.showInformationMessage('Self Review: baseline set. Edit and Approve or Reject.');
    }),

    vscode.commands.registerCommand('selfReview.approve', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      baseline = editor.document.getText();
      updateDecorations();
      updateStatusBar();
      vscode.window.showInformationMessage('Self Review: changes approved (new baseline).');
    }),

    vscode.commands.registerCommand('selfReview.rejectBlock', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || baseline === null) {
        vscode.window.showWarningMessage('No baseline set or no editor open.');
        return;
      }
      editor.edit((editBuilder) => {
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        editBuilder.replace(fullRange, baseline!);
      }).then(() => {
        updateDecorations();
      });
      vscode.window.showInformationMessage('Self Review: reverted to baseline.');
    }),

    vscode.commands.registerCommand('selfReview.stop', () => {
      baseline = null;
      clearDecorations();
      if (decorationType) {
        decorationType.dispose();
        decorationType = null;
      }
      decorationType = createDecoration();
      updateStatusBar();
      vscode.window.showInformationMessage('Self Review: stopped, baseline cleared.');
    }),

    vscode.workspace.onDidChangeTextDocument(() => {
      updateDecorations();
    }),

    vscode.window.onDidChangeActiveTextEditor(() => {
      updateDecorations();
    }),

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('selfReview.decorationBackgroundColor')) {
        decorationType?.dispose();
        decorationType = createDecoration();
        updateDecorations();
      }
      if (e.affectsConfiguration('selfReview.statusBar')) {
        updateStatusBar();
      }
    })
  );

  context.subscriptions.push(statusBarItem);
  updateStatusBar();
}

export function deactivate(): void {
  decorationType?.dispose();
  decorationType = null;
  statusBarItem?.dispose();
  statusBarItem = null;
}
