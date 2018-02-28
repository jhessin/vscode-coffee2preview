/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { compile as coffee } from 'coffeescript';
import { languages, window } from 'vscode';
import ReferencesDocument from './referencesDocument';

let oCompilerOptions = {
  bare: true,
};

export default class Provider implements vscode.TextDocumentContentProvider {
  static scheme = 'coffeePreview';

  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _documents = new Map<string, ReferencesDocument>();
  private _editorDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline',
  });
  private _subscriptions: vscode.Disposable;

  constructor() {
    // Listen to the `closeTextDocument`-event which means we must
    // clear the corresponding model object - `ReferencesDocument`
    this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc =>
      this._documents.delete(doc.uri.toString())
    );
  }

  dispose() {
    this._subscriptions.dispose();
    this._documents.clear();
    this._editorDecoration.dispose();
    this._onDidChange.dispose();
  }

  // Expose an event to signal changes of _virtual_ documents
  // to the editor
  get onDidChange() {
    return this._onDidChange.event;
  }

  // Provider method that takes an uri of the `references`-scheme and
  // resolves its content by (1) running the reference search command
  // and (2) formatting the results
  provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
    // already loaded?
    let document = this._documents.get(uri.toString());
    if (document) {
      return document.value;
    }

    return new Promise(resolve => {
      let results: string[] = [];
      let errors: string[] = [];

      const oEditor = vscode.window.activeTextEditor;
      // this method determines if the scope of the
      // file is coffee based.
      if (!(oEditor && languages.match(['coffeescript'], oEditor.document)))
        return;

      // this method shows the results of the compile
      let fShowResult = function(sContent: string) {
        results.push(sContent);
      };

      // this method shows any error message
      let fShowError = function(oError: Error) {
        errors.push(
          `${oError.name}: ${oError.message}\n Call Stack: ${oError.stack}`
        );
      };
      let aSectionsToCompile: string[] = [];

      // parse selections
      if (oEditor.selections.length) {
        for (const oSelection of oEditor.selections) {
          let sSelectionText: string;

          if ((sSelectionText = oEditor.document.getText(oSelection)))
            aSectionsToCompile.push(sSelectionText);
        }
      }

      // if no selection, check scope for the whole file, then select all.
      if (aSectionsToCompile.length === 0) {
        aSectionsToCompile.push(oEditor.document.getText());
      }

      // if still no selection, throw a warning
      if (!aSectionsToCompile.length)
        return window.showWarningMessage(
          'No source! The given source is empty!'
        );

      // compile with coffee
      for (const sSection of aSectionsToCompile) {
        let sCompiledSection: string;

        try {
          sCompiledSection = coffee(sSection, oCompilerOptions);
          if (!sCompiledSection.trim()) {
            throw new Error('The selected text compiles to an empty string!');
          } else {
            fShowResult(sCompiledSection);
          }
        } catch (oError) {
          fShowError(oError);
        }
      }

      resolve(results.join('\n=================\n'));
    });
  }
}

let seq = 0;

export function encodeLocation(
  uri: vscode.Uri,
  pos: vscode.Position
): vscode.Uri {
  const query = JSON.stringify([uri.toString(), pos.line, pos.character]);
  return vscode.Uri.parse(
    `${Provider.scheme}:copiled.js?${query}#${seq++}`
  );
}

export function decodeLocation(uri: vscode.Uri): [vscode.Uri, vscode.Position] {
  let [target, line, character] = <[string, number, number]>JSON.parse(
    uri.query
  );
  return [vscode.Uri.parse(target), new vscode.Position(line, character)];
}
