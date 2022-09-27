// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

const styleSheetStringify = (names: Array<string> = []) => {
  const sortedNames = names.sort();
  return `const styles = StyleSheet.create({
\t${sortedNames.map((name) => `${name}: {},`).join("\n\t")}
});`;
};

const getPlainText = (editor: vscode.TextEditor) => {
  const { document, selection } = editor;
  return document.getText(selection) || document.getText();
};
const getRNModulesImported = (
  editor: vscode.TextEditor
): [Array<string>, string] => {
  const { document } = editor;
  const rnImportPattern = /import{[A-Za-z0-9,]*}from'react-native'/;
  const fullText = document.getText();
  const noSpace = fullText.replace(/ /gm, "");
  const matchImports = noSpace.match(rnImportPattern);
  if (matchImports?.length) {
    const importString = matchImports[0];
    const joinedByCommas = importString.replace(
      /(import{|}from'react-native');?/gm,
      ""
    );
    return [joinedByCommas.split(","), importString];
  }
  return [[], ""];
};
const hasStyleSheet = (modules: Array<string>) =>
  modules.includes("StyleSheet");
const importStyleSheet = (
  builder: vscode.TextEditorEdit,
  editor: vscode.TextEditor
) => {
  const [modulesImported, oldImportString] = getRNModulesImported(editor);
  if (!hasStyleSheet(modulesImported)) {
    if (modulesImported.length) {
      const moduleString = [...modulesImported, "StyleSheet"].join(", ");
      const importString = `import {${moduleString}} from 'react-native';\n`;
      const full = editor.document.getText();
      const index = full.indexOf(`'react-native'`);
      const importPos = editor.document.positionAt(index);
      builder.delete(
        new vscode.Range(
          new vscode.Position(importPos.line, 0),
          new vscode.Position(importPos.line, 1000)
        )
      );
      builder.insert(new vscode.Position(importPos.line, 0), importString);
    } else {
      const importString = `import { StyleSheet } from 'react-native';\n`;
      builder.insert(new vscode.Position(0, 0), importString);
    }
  }
};
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "style-name-generator" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "style-name-generator.generateStyleSheetName",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const { document } = editor;
        let plainText = getPlainText(editor);

        const stylePattern = /styles\.[A-Za-z0-9]*/gm;
        const matchedStyles = plainText.match(stylePattern) || [];
        const matchedNames = matchedStyles.map((styleDot) =>
          styleDot.replace("styles.", "")
        );

        const cleanedStyleNames = [...new Set([...matchedNames])];

        editor.edit((editBuilder) => {
          importStyleSheet(editBuilder, editor);
          editBuilder.insert(
            new vscode.Position(document.lineCount + 3, 0),
            styleSheetStringify(cleanedStyleNames)
          );
        });
        vscode.window.showInformationMessage(
          "Generated style sheet in the end of file successfully"
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
