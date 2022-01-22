const {app, BrowserWindow} = require('electron')
const { ipcRenderer } = require('electron')
const setupPug = require('electron-pug')

const path = require('path')

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('client/html/index.pug')
}

app.on('ready', async () => {
    await setupPug({pretty: true})

    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})