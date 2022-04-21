const { app, BrowserWindow, ipcMain } = require('electron')
const { Low, JSONFile } = require('lowdb')

const file = __dirname + '/json/db.json'
const adapter = new JSONFile(file)
const db = new Low(adapter)

let mainWindow, addReactionWindow, editReactionWindow

const createMainWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    mainWindow.on("resize", () => {
        var size = mainWindow.getSize()
        var width = size[0]
        var height = size[1]
        mainWindow.send("resized", {height, width})
      })
    
    await mainWindow.loadFile('./client/html/reaction.html')
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

ipcMain.on('edit-reaction-window', async (e, reactionID) => {
    if(editReactionWindow) return
    editReactionWindow = new BrowserWindow({
        parent: mainWindow,
        width: 586,
        height: 648,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    editReactionWindow.on('close', () => {
        editReactionWindow = undefined
    })
    await editReactionWindow.loadFile('./client/html/editReaction.html')
    await editReactionWindow.send("reaction", { reaction: JSON.stringify(db.data.reactions[reactionID]), reactionID })
})

ipcMain.on('change-reaction', (e, {reaction, reactionID}) => {
    db.read()
    db.data.reactions[reactionID] = JSON.parse(reaction)
    db.write()
    db.read()
    mainWindow.send('get-reactions', db.data.reactions)
    editReactionWindow.close()
})

ipcMain.on('delete-reaction', (e, reactionID) => {
    db.read()
    db.data.reactions.splice(reactionID, 1)
    db.write()
    mainWindow.send('get-reactions', db.data.reactions)
})


app.on('ready', init)