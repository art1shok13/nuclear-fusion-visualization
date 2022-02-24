const { app, BrowserWindow, ipcMain } = require('electron')
const { Low, JSONFile } = require('lowdb')

const file = __dirname + '/json/db.json'
const adapter = new JSONFile(file)
const db = new Low(adapter)

let mainWindow, addReactionWindow

const createMainWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    await mainWindow.loadFile('./client/html/index.html')
}

const init = async () => {
    createMainWindow()
}

ipcMain.on('get-reactions', async (e) => {
    await db.read()
    e.reply('get-reactions', db.data.reactions)
})

ipcMain.on('add-reaction-window', async (e) => {
    if(addReactionWindow) return
    addReactionWindow = new BrowserWindow({
        parent: mainWindow,
        width: 586,
        height: 648,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    addReactionWindow.on('close', () => {
        addReactionWindow = undefined
    })
    await addReactionWindow.loadFile('./client/html/addReaction.html')
})

ipcMain.on('get-reactions', async (e) => {
    await db.read()
    e.reply('get-reactions', db.data.reactions)
})

ipcMain.on('get-atoms', async (e) => {
    await db.read()
    e.reply('get-atoms', db.data.atoms)
})

ipcMain.on('add-reaction', async (e, reaction) => {
    await db.read()
    db.data.reactions.push(JSON.parse(reaction))
    db.write()

    mainWindow.send('get-reactions', db.data.reactions)
    addReactionWindow.close()
})
// db.get('reactions')
//   .remove({ id: 1 })
//   .write()
app.on('ready', init)