'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  workspace,
  languages,
  window,
  commands,
  ExtensionContext,
  Disposable,
  TextDocument,
} from 'vscode';
import ContentProvider, { encodeLocation } from './provider';

// this method determines if the scope of the
// file is coffee based.
let fScopeIsCoffee = function(document: TextDocument): number {
  return languages.match(['coffeescript'], document);
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let fActivate = function(context: ExtensionContext) {
  const provider = new ContentProvider();

  // register content provider for scheme `references`
  // register document link provider for scheme `references`
  const providerRegistrations = Disposable.from(
    workspace.registerTextDocumentContentProvider(
      ContentProvider.scheme,
      provider
    )
  );
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const commandRegistrations = commands.registerTextEditorCommand(
    'coffee2preview.check',
    oEditor => {
      if (!fScopeIsCoffee(oEditor.document)) {
        return;
      }

      const uri = encodeLocation(
        oEditor.document.uri,
        oEditor.selection.active
      );
      return workspace.openTextDocument(uri).then(doc => {
        const viewColumn = oEditor.viewColumn;
        if (viewColumn) window.showTextDocument(doc, viewColumn + 1);
      });
    }
  );

  context.subscriptions.push(commandRegistrations, providerRegistrations);
};

export { fActivate as activate };
