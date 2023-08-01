const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
// const p = path.join(__dirname, '..', 'node_modules', 'node-powershell');
// const shell = require(p);
const shell = require('node-powershell');
const { default: MySecondPackageView } = require('./my-second-package-view');


let mySecondPackageView;
let subscriptions;

function activate(context) {
    mySecondPackageView = new MySecondPackageView(context.globalState.get('mySecondPackageViewState'));
    subscriptions = vscode.Disposable.from(
        vscode.commands.registerCommand('extension.mySecondPackageToggle', toggle),
    );
}

function deactivate() {
    mySecondPackageView.destroy();
    subscriptions.dispose();
}

function toggle() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Open a file to perform this action.');
        return;
    }

    const activePane = editor.document.fileName;
    const completeCode = editor.document.getText();

    const injectionCode_python_path = path.join(__dirname, 'injectCodepython.py');
    const read_python_path = path.join(__dirname, 'read_python.txt');
    const webpage = path.join(__dirname, 'cospex.html');

    step0();

    function step0() {
        combining_code(injectionCode_python_path, step1);
    }

    function step1() {
        run_powershell(step2);
    }

    function step2() {
        display_webpage();
    }

    function combining_code(injectCode_python_path, callback) {
        const injectCode_python = fs.readFileSync(injectCode_python_path, 'utf-8');
        const completeCodeModified = completeCode.replace(/\\/gi, "\\\\");

        let data = injectCode_python
            .replace(/<__b__s__>/gi, completeCodeModified)
            .replace(/<__f__n__>/gi, activePane);

        const fname = path.join(__dirname, 'python_output.py');
        fs.writeFileSync(fname, data, 'utf-8');

        callback();
    }

    function run_powershell(callback) {
        let ps = new shell({
            executionPolicy: 'Bypass',
            noProfile: true
        });

        ps.addCommand('cd ' + __dirname)
        ps.invoke()
            .then(output => {
                let ps1 = new shell({
                    executionPolicy: 'Bypass',
                    noProfile: true
                });
                ps.addCommand('py python_output.py')
                ps.invoke()
                    .then(output => {
                        callback();
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
            .catch(err => {
                console.log(err);
            });

    }

    function display_webpage() {
        vscode.env.openExternal(vscode.Uri.file(webpage));
    }
}

exports.activate = activate;
exports.deactivate = deactivate;
