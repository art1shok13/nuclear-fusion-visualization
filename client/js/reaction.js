const { Tween, Ticker } = require("@createjs/tweenjs")
const { ipcRenderer } = require('electron')
const THREE = require("three")
const OrbitControls = require("three-orbitcontrols")

const Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    purple: 0x8338ec,
    indigo: 0x3a86ff,
    blue: 0x68c3c0,
    orange: 0xFF9E00,
    yellow: 0xffd000
}
let camera, scene, renderer, controls, clock

var lights = []

let stage

let allowAnimation = true

let width = window.innerWidth * .8
let height = window.innerHeight

const baseRadius = width / 38.4

init()

function init() {
    const scale = 1
    // camera = new THREE.OrthographicCamera(width * scale / -2, width * scale / 2, height * scale / 2, height * scale / -2, -1000 * scale, 1000 * scale)
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000)
    camera.position.z = -5000
    camera.position.y = 2000

    scene = new THREE.Scene()

    lights[0] = new THREE.PointLight(0xffffff, 0.1, 0)
    lights[0].position.set(2000, 0, 0)

    lights[1] = new THREE.PointLight(0xffffff, 0.1, 0)
    lights[1].position.set(0, 2000, 0)

    lights[2] = new THREE.PointLight(0xffffff, 0.1, 0)
    lights[2].position.set(0, 1000, 100)

    lights[3] = new THREE.AmbientLight(0xffffff, 1)

    lights.forEach((light) => {
        scene.add(light)
    })
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    document.querySelector('div#main').appendChild(renderer.domElement)

    controls = new THREE.OrbitControls(camera, renderer.domElement)

    clock = new THREE.Clock()

    stage = new THREE.Mesh(
        new THREE.PlaneGeometry(baseRadius * 250, baseRadius * 250, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide, wireframe: true })
    )
    stage.rotateX(Math.PI / 2)
    stage.translateZ(baseRadius * 5)
    scene.add(stage)
    Ticker.framerate = 60
}

let currentReaction = {stage: 0}

function useReaction(reactionId) {

    const atomMap = (element) => {
        const { id, isotope } = element
        const atom = JSON.parse(localStorage.atoms)[id]
        const protons = atom.protons
        const neutrons = atom.isotopes[isotope]
        const shells = atom.shells
        const symbol = atom.symbol
        
        return new Atom(protons, neutrons, shells, symbol)
    }

    const reagents = JSON.parse(localStorage.reactions)[reactionId]['reagents'].map((element) => {
        return atomMap(element)
    })
    
    const products = JSON.parse(localStorage.reactions)[reactionId]['products'].map((element) => {
        return atomMap(element)
    })
    const protected = JSON.parse(localStorage.reactions)[reactionId]['protected']
    const subProducts = JSON.parse(localStorage.reactions)[reactionId]['subProducts'].map(({color, symbol, sup, lineType}) => {
            if(lineType==0){
                return new WaveParticle(baseRadius*.7, color, symbol, sup)
            }else{
                return new LineParticle(baseRadius*.7, color, symbol, sup)
            }    
    })

    if(currentReaction.stage == 0) {
        scene.children.splice(5, scene.children.length)
        Tween.removeAllTweens()
        currentReaction = {
            reaction: new NuclearReaction(reagents, products, subProducts),
            equation: new ReactionEquation(reagents, products, subProducts),
            stage: 1,
            reactionId,
            protected
        }
        document.querySelector('.reaction-area').innerHTML = currentReaction.equation.getHTML()

        document.querySelector('.control-buttons').querySelectorAll('button').forEach((e) => {e.disabled=false})

    } else if(currentReaction.stage == 1 && currentReaction.reactionId == reactionId) {
        document.querySelector('.control-buttons').querySelectorAll('button').forEach((e) => {e.disabled=true})
        currentReaction.reaction.tweenAnimation(reagents, products, subProducts)
        currentReaction = {...currentReaction, stage: 0, reactionId: null}
    }
}

function addReactionWindow() {
    ipcRenderer.send('add-reaction-window', '')
}

function clearScene(){clear()}
function clear(){
    Tween.removeAllTweens()
    scene.children.splice(5, scene.children.length)
    currentReaction = {stage: 0}
    document.querySelector('.control-buttons').querySelectorAll('button').forEach((e) => {e.disabled=true})
    document.querySelector('.reaction-area').innerHTML = ''
}

function animationToggle(button){
    button.innerHTML = button.innerHTML==='STOP ANIMATION' ? 'RESUME ANIMATION':'STOP ANIMATION'
    allowAnimation = button.innerHTML==='STOP ANIMATION'

}

ipcRenderer.on('get-reactions', (e, reactions) => {
    clear()

    localStorage.reactions = JSON.stringify(reactions)

    ipcRenderer.on('get-atoms', (e, atoms) => {
        localStorage.atoms = JSON.stringify(atoms)

        let html = reactions.reduce( (html, reaction, index) => {

            const currentAtom = atoms[reaction.products[0].id]
            const neutronsCount = currentAtom.isotopes[reaction.products[0].isotope]
            const buttonText = currentAtom.symbol

            return html +  `<button oncontextmenu="reactionContextMenu(${index})" class="use-reaction-button" data-index="${index}" onclick="useReaction(${index})"><span class="supsub"><span>${neutronsCount + currentAtom.protons}</span><span>${currentAtom.protons}</span></span>${buttonText}<span class="undreline-text"><br>${currentAtom.title}</span></button>`
        
        }, '')
        html += `<button onclick="addReactionWindow()"><span class="supsub"><span>A</span><span>Z</span></span>X<span class="undreline-text"><br>-</span></button>`
        document.querySelector('.reaction-buttons').innerHTML = html;

    })
    ipcRenderer.send('get-atoms', '')
})
ipcRenderer.send('get-reactions', '')

var render = (time) => {
    requestAnimationFrame(render);
    renderer.render(scene, camera)
    controls.update()

    let oldTime = clock.getElapsedTime()
    if (!document.hasFocus() && clock.running) {
        clock.stop()
    } else if (document.hasFocus() && !clock.running) {
        clock.start()
        clock.elapsedTime = oldTime
    }

    if (document.hasFocus() && allowAnimation) {
        currentReaction?.reaction?.animate()
    } else {
        clock.stop()
    }
}
requestAnimationFrame(render)

ipcRenderer.on('resized', (e, {height, width}) => {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    camera.position.set(0, 1000, -5000)
    controls.target = new THREE.Vector3(0,0,0)
})

function editReaction(){
    if(currentReaction.protected) {
        return
    }
    ipcRenderer.send('edit-reaction-window', currentReaction.reactionId)
}
function deleteReaction(){
    if(currentReaction.protected) {
        return
    }
    ipcRenderer.send('delete-reaction', currentReaction.reactionId)
}
