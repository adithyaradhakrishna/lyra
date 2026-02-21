const vscode = require('vscode');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: 'YOUR_GROQ_API_KEY', // ← PASTE YOUR REAL GROQ API KEY HERE
  baseURL: 'https://api.groq.com/openai/v1'
});

let helpPanel;
let helpViewProvider;
let errorCount = 0;                   // general errors
let syntaxErrorCount = 0;
let runtimeErrorCount = 0;            // NEW: runtime-specific
let editCount = 0;
let backspaceCount = 0;
let lastEditTime = Date.now();
let lastCursorMoveTime = Date.now();
let recentActivityTime = Date.now();
let helping = false;

// Thresholds
const ERROR_REPEAT_THRESHOLD = 3;
const SYNTAX_REPEAT_THRESHOLD = 3;
const RUNTIME_REPEAT_THRESHOLD = 3;   // NEW: runtime errors ≥3
const EDIT_REPEAT_THRESHOLD = 10;
const BACKSPACE_REPEAT_THRESHOLD = 8;
const PAUSE_THRESHOLD = 30000;        // 30s
const HESITATION_THRESHOLD = 35000;   // 35s cursor still
const RECENT_ACTIVITY_WINDOW = 180000; // 3 min

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('lyra.showHelp', async () => {
      // Reveal the activity bar container which holds our view
      try {
        await vscode.commands.executeCommand('workbench.view.extension.lyra-sidebar');
      } catch (e) {
        // fallback to the webview panel if the view container can't be revealed
        showHelpPanel();
      }
    })
  );

  // Register the sidebar WebviewViewProvider so the "Help & Encouragement" view appears
  helpViewProvider = new LyraHelpViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('lyra.help', helpViewProvider)
  );

  vscode.workspace.onDidOpenTextDocument(doc => {
    if (doc.languageId === 'python') {
      showHelpPanel();
    }
  });

  // Text changes
  const changeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
    const now = Date.now();
    lastEditTime = now;
    recentActivityTime = now;

    editCount++;

    const change = event.contentChanges[0];
    if (change) {
      if (change.text === '' && change.rangeLength > 0) {
        backspaceCount++;
        if (backspaceCount >= BACKSPACE_REPEAT_THRESHOLD) {
          triggerHelp('repeated-backspaces', 'Lots of deleting/backspacing – unsure?');
        }
      } else {
        backspaceCount = 0;
      }
    }

    if (editCount > EDIT_REPEAT_THRESHOLD) {
      triggerHelp('repeated-edits', 'Lots of changes on same part');
    }
  });
  context.subscriptions.push(changeDisposable);

  // Cursor movement
  const cursorDisposable = vscode.window.onDidChangeTextEditorSelection(e => {
    if (e.textEditor === vscode.window.activeTextEditor) {
      lastCursorMoveTime = Date.now();
      recentActivityTime = Date.now();
    }
  });
  context.subscriptions.push(cursorDisposable);

  // Diagnostics: syntax + runtime errors
  const diagnosticDisposable = vscode.languages.onDidChangeDiagnostics(() => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'python') return;

    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);

    // General error count (fallback)
    if (diagnostics.length > 0) {
      errorCount++;
      if (errorCount >= ERROR_REPEAT_THRESHOLD) {
        triggerHelp('repeated-error', diagnostics[0].message);
      }
    }

    // Syntax errors
    const syntaxErrors = diagnostics.filter(d => 
      d.severity === vscode.DiagnosticSeverity.Error &&
      (d.message.toLowerCase().includes('syntax') || 
       d.message.includes('expected') || 
       d.message.includes('invalid syntax') ||
       d.message.includes('unexpected') ||
       d.message.includes('indent') ||
       d.message.includes('colon') ||
       d.message.includes('EOL while scanning'))
    );

    if (syntaxErrors.length > 0) {
      syntaxErrorCount++;
      if (syntaxErrorCount >= SYNTAX_REPEAT_THRESHOLD) {
        triggerHelp('repeated-syntax-error', syntaxErrors[0].message);
      }
    }

    // NEW: Runtime errors
    const runtimeErrors = diagnostics.filter(d => 
      d.severity === vscode.DiagnosticSeverity.Error &&
      !syntaxErrors.some(s => s.message === d.message) && // avoid double-count
      (d.message.includes('Error:') || 
       d.message.includes('name') || 
       d.message.includes('not defined') ||
       d.message.includes('TypeError') ||
       d.message.includes('ZeroDivisionError') ||
       d.message.includes('IndexError') ||
       d.message.includes('ValueError') ||
       d.message.includes('AttributeError') ||
       d.message.includes('KeyError') ||
       d.message.includes('ModuleNotFoundError'))
    );

    if (runtimeErrors.length > 0) {
      runtimeErrorCount++;
      if (runtimeErrorCount >= RUNTIME_REPEAT_THRESHOLD) {
        triggerHelp('repeated-runtime-error', runtimeErrors[0].message);
      }
    }
  });
  context.subscriptions.push(diagnosticDisposable);

  // Periodic pause & hesitation check
  const intervalDisposable = setInterval(() => {
    const now = Date.now();
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const hasCode = doc.getText().trim().length > 5;

    // Cursor hesitation
    if (
      hasCode &&
      now - lastCursorMoveTime > HESITATION_THRESHOLD &&
      now - recentActivityTime < RECENT_ACTIVITY_WINDOW
    ) {
      triggerHelp('cursor-hesitation', 'Cursor has been still for a while – unsure what to do next?');
    }

    // Long pause
    if (now - lastEditTime > PAUSE_THRESHOLD && hasCode) {
      triggerHelp('long-pause', 'Long pause – thinking hard?');
    }
  }, 5000);

  context.subscriptions.push({ dispose: () => clearInterval(intervalDisposable) });

  showHelpPanel();
}

async function triggerHelp(type, detail) {
  if (helping) return;
  helping = true;

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    helping = false;
    return;
  }

  const code = editor.document.getText().slice(0, 1000);

  const prompt = `
You are LYRA – a very kind, sitting-next-to-you mentor for absolute coding beginners in VS Code.
Be emotional, supportive, never judge. Use simple words. Focus on confidence.

Struggle: ${type}
Detail: ${detail || 'none'}
Current code:
${code}

Reply in this exact 4-part format:

1. Emotional support (1 sentence) – e.g., "Hey, runtime errors are super common – you're doing great for getting this far! 💛"
2. Why it's happening (simple) – e.g., "NameError means a variable was used before it was created or spelled wrong."
3. What to do (tiny step-by-step) – e.g., "Check spelling of variables. Add print() to see values. Use Ctrl+Click on variable to jump to definition."
4. Confidence nudge – e.g., "This is how everyone learns – you're so close, just one small change! 🌟"

Keep short, warm, 1-2 emojis max.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      max_tokens: 280
    });

    updateHelpPanel(completion.choices[0].message.content.trim());
  } catch (err) {
    updateHelpPanel("Oops... little hiccup on my side 😅 You're still awesome – take a breath and try again!");
  }

  helping = false;
}

function showHelpPanel() {
  if (helpPanel) {
    helpPanel.reveal();
    return;
  }

  helpPanel = vscode.window.createWebviewPanel(
    'lyraHelp',
    'LYRA Help',
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  updateHelpPanel("Hi! I'm LYRA 😊\nI'll watch quietly and help automatically if you get stuck. Just code – I'm right here for you!");

  helpPanel.onDidDispose(() => { helpPanel = undefined; });
}

function updateHelpPanel(content) {
  // Update panel if open
  if (helpPanel) {
    helpPanel.webview.html = renderHtml(content);
  }

  // Update sidebar view if registered
  if (helpViewProvider) {
    helpViewProvider.update(content);
  }
}

function renderHtml(content) {
  return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 15px; background: #fffef5; margin: 0; }
          .msg { background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #f39c12; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="msg">${content.replace(/\n/g, '<br>')}</div>
      </body>
      </html>`;
}

class LyraHelpViewProvider {
  constructor(extensionUri) {
    this._extensionUri = extensionUri;
    this._view = undefined;
  }

  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    // initial content
    webviewView.webview.html = renderHtml("Hi! I'm LYRA 😊<br>I'll watch quietly and help automatically if you get stuck. Just code – I'm right here for you!");
  }

  update(content) {
    if (this._view) {
      this._view.webview.html = renderHtml(content);
    }
  }
}

function deactivate() {}

module.exports = { activate, deactivate };