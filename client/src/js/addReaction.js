function deleteReactionElement(a) { a.parentNode.remove() }

const { ipcRenderer } = require('electron')


function addReactionElement(a) {
    let html = ''

    ipcRenderer.once('get-atoms', (e, atoms) => {
        const getAtomOption = (html, atom, index) => {
            return html + `<option value="${index}">${atom.symbol} (${atom.title})</option>`
        }


        const getIsotopeOptions = (atomIndex) => {
            const getIsotopeOption = (html, neutrons, index) => {
                return html + `<option value="${index}">${atoms[atomIndex].protons + neutrons}/${atoms[atomIndex].protons} ${atoms[atomIndex].symbol}</option>`
            }
            return atoms[atomIndex].isotopes.reduce( getIsotopeOption, '' )
        }
        html = `
            <div class="reaction-element">
                <select onchange="(updateIsotopeSelect(this))">
                    ${atoms.reduce( getAtomOption, '' )}
                </select>
                <select>
                    ${getIsotopeOptions(0)}
                </select>
                <button class="delete" onclick="deleteReactionElement(this)">&#215;</button>
            </div>
        `

        let area = a.parentNode.parentNode
        a.parentNode.remove()
        const newElement = document.createElement('div')
        newElement.innerHTML = html.trim()
        area.appendChild(newElement.firstChild)

        const plusButton = document.createElement('div')
        plusButton.innerHTML = `<div class="sub-element"><button class="add-reaction" onclick="addReactionElement(this)">+</button></div>`.trim()
        area.appendChild(plusButton.firstChild)
    })
    ipcRenderer.send('get-atoms', '')
}

function updateIsotopeSelect(atomSelect) {
    const atomIndex = atomSelect.value
    ipcRenderer.once('get-atoms', (e, atoms) => {
        console.log()
        atomSelect.parentNode.childNodes[3].innerHTML = atoms[atomIndex].isotopes.reduce( ( html, neutrons, index ) => {
            return html + `<option value="${index}">${atoms[atomIndex].protons + neutrons}/${atoms[atomIndex].protons} ${atoms[atomIndex].symbol}</option>`
        }, '')
    })
    ipcRenderer.send('get-atoms', '')
}

async function submitReaction() {
    const getArrayOfElements = async (areaID) => {
        const array  = await [...document.querySelectorAll('.area')[areaID].childNodes].map( (item) => {
            if( item.childNodes[1]?.tagName === 'SELECT' ) {
                const select = item.childNodes[1]
                const select1 = item.childNodes[3]
               return { type:'atom', id: Number(select.value), isotope: Number(select1.value) }
            }
        }).filter( (e)=>e!=undefined )
        return array
    }
    const reaction = {
        reagents: await getArrayOfElements(0),
        products: await getArrayOfElements(1),
        subProducts: []
    }

    ipcRenderer.send('add-reaction', JSON.stringify(reaction))
}