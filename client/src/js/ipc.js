const { ipcRenderer } = require('electron')


ipcRenderer.on('get-reactions', (e, reactions) => {
    
    localStorage.reactions = JSON.stringify(reactions)

    ipcRenderer.on('get-atoms', (e, atoms) => {
        localStorage.atoms = JSON.stringify(atoms)
        let html = reactions.reduce( (html, reaction, index) => {
            const currentAtom = atoms[reaction.products[0].id]
            const neutronsCount = currentAtom.isotopes[reaction.products[0].isotope]
            const buttonText = currentAtom.symbol
            return html +  `<button class="use-reaction-button" data-index="${index}"><span class="supsub"><span>${neutronsCount + currentAtom.protons}</span><span>${currentAtom.protons}</span></span>${buttonText}<span class="undreline-text"><br>${currentAtom.title}</span></button>`
        }, '')
        html += `<button onclick="addReactionWindow()"><span class="supsub"><span>A</span><span>Z</span></span>X<span class="undreline-text"><br>-</span></button>`
        document.querySelector('.reaction-buttons').innerHTML = html;
    })
    ipcRenderer.send('get-atoms', '')
})
ipcRenderer.send('get-reactions', '')


function addReactionWindow() {
    ipcRenderer.send('add-reaction-window', '')
}