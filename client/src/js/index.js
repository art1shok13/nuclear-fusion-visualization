import { Tween, Ticker } from "@createjs/tweenjs"

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function range(start, end, interval = 0) {
    let arr = [];
    interval = interval > 0 ? interval - 1 : 0
    for (let i = start; i < end; i++) {
        arr.push(i)
        i += interval;
    }
    return arr
}

function map(value, range1From, range1To, range2From, range2To) {
    return (value - range1From) * (range2To - range2From) / (range1To - range1From) + range2From;
}

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

let width = window.innerWidth * .8
let height = window.innerHeight

const baseRadius = width / 38.4

init()

function init() {
    const scale = 1
    // camera = new THREE.OrthographicCamera(width * scale / -2, width * scale / 2, height * scale / 2, height * scale / -2, -1000 * scale, 1000 * scale)
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000)
    camera.position.z = -5000
    camera.position.y = 1000

    scene = new THREE.Scene()

    lights[0] = new THREE.PointLight(0xffffff, 0.1, 0)
    lights[0].position.set(200, 0, 0)

    lights[1] = new THREE.PointLight(0xffffff, 0.1, 0)
    lights[1].position.set(0, 200, 0)

    lights[2] = new THREE.PointLight(0xffffff, 0.1, 0)
    lights[2].position.set(0, 100, 100)

    lights[3] = new THREE.AmbientLight(0xffffff, 1)

    lights.forEach((light) => {
        scene.add(light)
    })
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    document.querySelector('div#main').appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)

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

class Atom {

    constructor(protons, neutrons, shells, symbol) {
        this.spin = Math.floor(Math.random() * 2) == 1 ? -1 : 1
        this.symbol = symbol
        this.protons = protons
        this.neutrons = neutrons

        const Atom = new THREE.Group()
        this.atomParameters = { protons, neutrons, shells }

        this.core = this.#createCore(protons, neutrons)
        Atom.add(this.core)

        this.shells = []
        shells.forEach((electrons, number) => {
            const shell = this.#createValence(electrons, number + 1, protons, neutrons)
            this.shells.push(shell)
            Atom.add(shell)
        })

        this.Atom = Atom
    }

    getSymbolInHTML() {
        return `
            <span>
                <span class="supsub">
                    <span>${this.protons + this.neutrons}</span>
                    <span>${this.protons}</span>
                </span>
                ${this.symbol}
            </span> 
        `
    }

    getMesh() {
        return this.Atom
    }

    animate() {
        const { protons, neutrons } = this.atomParameters

        const baseRotation = () => { return (0.01 + Math.floor(Math.random() * 10) + 1 + protons) / 500 }

        this.core.rotateX(baseRotation())
        this.core.rotateY(baseRotation())

        this.shells.forEach((shell, i) => {

            const angle = (baseRotation() + (i + 1) ** -1) / 30 * this.spin
            shell.rotateX(angle)
            shell.rotateY(angle)
            shell.rotateZ(angle)
        })
    }

    #createCore(protons, neutrons) {
        const core = new THREE.Group()

        let verticesParameter = Math.ceil(Math.sqrt(protons + neutrons) + 0.5)
        verticesParameter = verticesParameter == 3 ? verticesParameter + 1 : verticesParameter

        const vertices = this.#getArrayOfVertices(verticesParameter, (protons + neutrons) + baseRadius)

        if (protons + neutrons != 0) {
            const defaultNucleus = new THREE.Mesh(
                new THREE.SphereGeometry((protons + neutrons) + baseRadius / 3, 10, 10),
                new THREE.MeshStandardMaterial({
                    color: Math.floor(Math.random() * 2) == 0 ? Colors.red : Colors.white
                })
            )
            core.add(defaultNucleus)
        }

        const nucleusGeometry = new THREE.SphereGeometry(baseRadius * 1.5, 30, 30)
        while (protons + neutrons > 0) {

            let color
            if (protons != 0) {
                color = Colors.red
                protons--
            } else if (neutrons != 0) {
                color = Colors.white
                neutrons--
            } else {
                break
            }

            const random = Math.floor(Math.random() * vertices.length)

            const nucleus = new THREE.Mesh(
                nucleusGeometry,
                new THREE.MeshStandardMaterial({ color })
            )

            const { x, y, z } = vertices[random]
            nucleus.position.set(x, y, z)
            vertices.splice(random, 1)

            core.add(nucleus)
        }

        return core
    }

    #getArrayOfVertices(verticesParameter, radius) {
        let vertices = []

        range(verticesParameter / -2, verticesParameter / 2 + 1, 1).forEach((y) => {
            const yCord = (radius * 2 / verticesParameter) * y
            const minorCircleRadius = Math.sqrt(radius ** 2 - yCord ** 2)

            range(0, 2 * Math.PI, (2 * Math.PI) / verticesParameter).forEach((angle) => {
                const xCord = minorCircleRadius * Math.cos(angle)
                const zCord = minorCircleRadius * Math.sin(angle) //+ baseRadius * 1.125 * Math.floor( Math.random() * 2)

                vertices.push({ x: xCord, y: yCord, z: zCord, })
            })
        })
        vertices = vertices.map((vertice) => { return JSON.stringify(vertice) })

        let uniqueVertices = []
        vertices.forEach((cord) => {
            if (!uniqueVertices.includes(cord)) {
                uniqueVertices.push(cord)
            }
        })
        uniqueVertices = uniqueVertices.map((vertice) => { return JSON.parse(vertice) })
        return uniqueVertices
    }

    #createValence(electrons, number, protons, neutrons) {

        const valence = new THREE.Group()
        const radius = baseRadius * number * 9 + (protons + neutrons) + baseRadius / 3

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, baseRadius / 8, 50, 50),
            new THREE.MeshStandardMaterial({ color: Colors.white })
        )
        valence.add(ring)

        let angle = 0
        for (let i = 0; i < electrons; i++) {
            const electron = new THREE.Mesh(
                new THREE.SphereGeometry(baseRadius, 50, 50),
                new THREE.MeshStandardMaterial({ color: Colors.blue })
            )
            electron.position.x = radius * Math.cos(angle)
            electron.position.y = radius * Math.sin(angle)

            angle += (Math.PI * 2) / electrons
            valence.add(electron)
        }

        return valence
    }

}

class WaveParticle {
    constructor(length, color, rotate, symbol, sup) {
        this.symbol = symbol
        this.sup = sup || ''

        this.length = length
        this.Positron = new THREE.Group()
        this.color = color

        this.path = this.#getSinusoidalPath(length)
        const material = new THREE.MeshStandardMaterial({ color: this.color })

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(baseRadius, 50, 50),
            material
        )
        this.looptime = length / 5
        this.Positron.add(sphere)
        this.Positron.position.set(0, 0, 0)
        this.Positron.rotateZ(rotate)
    }

    getSymbolInHTML() {
        return `
            <span>
                ${this.symbol}
                <sup>${this.sup}</sup>
            </span>
        `
    }

    getMesh() {
        return this.Positron
    }

    positronCurvePoints = []
    tLast = 0
    animate() {
        const time = clock.getElapsedTime()
        const looptime = this.looptime
        let t = (time % looptime) / looptime

        if (this.Positron.children[1]) {
            this.Positron.remove(this.Positron.children[1])
        }

        if (t < this.tLast) {
            const { x, z } = this.Positron.children[0].position
            this.Positron.children[0].position.set(x, this.positronCurvePoints[this.positronCurvePoints.length - 1].y, z)

            const count = this.positronCurvePoints.length

            for (let i = 0; i < count; i++) {
                const x = this.positronCurvePoints[i].x
                const xsin = Math.sin(x / (3 * baseRadius) * Math.PI + time * Math.PI * 5)
                this.positronCurvePoints[i].y = xsin * 1.5 * baseRadius
            }
        } else {
            this.tLast = t
            this.Positron.children[0].position.copy(this.path.getPointAt(t))
            this.positronCurvePoints.push(this.path.getPointAt(t))
        }

        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this.positronCurvePoints),
            new THREE.LineBasicMaterial({ color: this.color })
        )
        this.Positron.add(line)
    }

    #getSinusoidalPath(length) {
        class CustomSinCurve extends THREE.Curve {
            constructor(scale = 1) {
                super()
                this.scale = scale
            }
            getPoint(t, optionalTarget = new THREE.Vector3()) {
                const tx = t * this.scale * 3 * baseRadius
                const ty = Math.sin(this.scale * Math.PI * t) * 1.5 * baseRadius
                return optionalTarget.set(tx, ty, 0)
            }
        }

        return new CustomSinCurve(length)
    }
}

class LineParticle {
    constructor(length, color, rotate, symbol, sup) {
        this.symbol = symbol
        this.sup = sup || ''

        this.length = length
        this.Positron = new THREE.Group()
        this.color = color

        this.path = this.#getPath(length, 0)
        const material = new THREE.MeshStandardMaterial({ color: this.color })

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(baseRadius, 50, 50),
            material
        )
        this.looptime = length / 5
        this.Positron.add(sphere)
        this.Positron.rotateZ(rotate)
    }

    getSymbolInHTML() {
        return `
            <span>
                ${this.symbol}
                <sup>${this.sup}</sup>
            </span>
        `
    }

    getMesh() {
        return this.Positron
    }

    positronCurvePoints = []
    tLast = 0
    animate() {
        const time = clock.getElapsedTime()
        const looptime = this.looptime
        const t = (time % looptime) / looptime

        if (this.Positron.children[1]) {
            this.Positron.remove(this.Positron.children[1])
        }

        if (t < this.tLast) {
            const { x, y, z } = this.Positron.children[0].position
            this.Positron.children[0].position.set(x, this.path.getPointAt(t).y, z)

        } else {
            this.tLast = t
            this.Positron.children[0].position.copy(this.path.getPointAt(t))
            this.positronCurvePoints.push(this.path.getPointAt(t))
        }

        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this.positronCurvePoints),
            new THREE.LineBasicMaterial({ color: this.color })
        )
        this.Positron.add(line)
    }

    #getPath(length) {
        class CustomCurve extends THREE.Curve {
            constructor(scale = 1) {
                super()
                this.scale = scale
            }
            getPoint(t, optionalTarget = new THREE.Vector3()) {
                const tx = t * this.scale * 3 * baseRadius
                return optionalTarget.set(tx, 0, 0)
            }
        }

        return new CustomCurve(length)
    }
}

class NuclearReaction {
    constructor(reagents, products, subProducts) {
        this.reagents = reagents || []
        this.products = products || []
        this.subProducts = subProducts || []

        this.allowAnimateFunc = false

        this.#setReagents(this.reagents)
    }

    animate() {
        [...this.reagents, ...this.products].forEach((element) => {
            element.animate()
        })

        if (this.allowAnimateFunc) {
            this.subProducts.forEach((subProduct) => {
                subProduct.animate()
            })
        }
    }

    tweenAnimation(reagents, products, subProducts) {
        // first step
        this.reagents.forEach((reagent, i) => {
            Tween.get(reagent.getMesh().position)
                .to({ x: 0, y: 0, z: 0 }, 2000)
            Tween.get(reagent.getMesh().scale)
                .wait(1800)
                .to({ x: .00001, y: .00001, z: .00001 }, 400)
                .call(() => {
                    this.reagents.splice(i, 1)
                    scene.remove(reagent.getMesh())
                })
        })

        //second step
        this.products.forEach((product, i) => {
            product.getMesh().scale.set(.00001, .00001, .00001)
            scene.add(product.getMesh())

            Tween.get(product.getMesh().scale)
                .wait(1800)
                .to({ x: 1, y: 1, z: 1 }, 400)
                .call(() => {
                    this.#tweenProduct(products, product, i)
                })
        })

        setTimeout(() => {
            clock.elapsedTime = 0

            this.allowAnimateFunc = true
            this.subProducts.forEach((subProduct) => {
                scene.add(subProduct.getMesh())
            })
        }, 2200)
    }

    #tweenProduct(products, product, i) {

        if (i === 0) {
            product.getMesh().position.set(0, 0, 0)
        } else {
            const angleIncrement = (Math.PI * 2) / (products.length - 1)

            Tween.get(product.getMesh().position)
                .to({
                    x: baseRadius * 50 * Math.cos(angleIncrement * i),
                    y: 0,
                    z: baseRadius * 50 * Math.sin(angleIncrement * i)
                }, 2000)
        }
    }

    #setReagents(reagents) {
        const angleIncrement = (Math.PI * 2) / reagents.length

        reagents.forEach((reagent, i) => {
            reagent.getMesh().position.set(
                baseRadius * 50 * Math.cos(angleIncrement * i),
                0,
                baseRadius * 50 * Math.sin(angleIncrement * i)
            )
            scene.add(reagent.getMesh())
        })
    }

}

class ReactionEquation {
    constructor(reagents, products, subProducts) {
        this.reagents = reagents || []
        this.products = products || []
        this.subProducts = subProducts || []
    }

    getHTML() {
        let HTML = ''
        this.reagents.forEach((reagent, i) => {
            HTML += reagent.getSymbolInHTML()
            if (i != this.reagents.length - 1) {
                HTML += '<span>+</span>'
            } else {
                HTML += '<span>→</span>'
            }
        })
        this.products.forEach((product, i) => {
            HTML += product.getSymbolInHTML()
            if (i != this.products.length - 1) {
                HTML += '<span>+</span>'
            } else if (this.subProducts.length != 0) {
                HTML += '<span>+</span>'
            }
        })
        this.subProducts.forEach((subProduct, i) => {
            HTML += subProduct.getSymbolInHTML()
            if (i != this.subProducts.length - 1) {
                HTML += '<span>+</span>'
            }
        })
        return HTML
    }
}

const reagents = [
    new Atom(1, 0, [1], 'H'),
    new Atom(1, 0, [1], 'H'),
]

const products = [
    new Atom(1, 1, [1], 'D'),
]

const subProducts = [
    new WaveParticle(baseRadius * 0.5, Colors.purple, Math.PI * .75, 'p', '+'),
    new LineParticle(baseRadius * 0.5, Colors.indigo, Math.PI * 1.25, 'n'),
]

// console.log(new THREE.Color( parseInt('0xCC0000', 16) ))

// const a = new NuclearReaction(reagents, products, subProducts)

// const b = new ReactionEquation(reagents, products, subProducts)


// document.querySelector('.reaction-area').innerHTML = b.getHTML()

let currentReaction = {stage: 0}

function useReaction(reactionId) {
    console.log(reactionId)
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
    const subProducts = []

    if(currentReaction.stage == 0) {
        scene.children.splice(5, scene.children.length)
    
        currentReaction = {
            reaction: new NuclearReaction(reagents, products, subProducts),
            equation: new ReactionEquation(reagents, products, subProducts),
            stage: 1,
            reactionId
        }
        document.querySelector('.reaction-area').innerHTML = currentReaction.equation.getHTML()
    } else if(currentReaction.stage == 1 && currentReaction.reactionId == reactionId) {

        currentReaction.reaction.tweenAnimation(reagents, products, subProducts)
        currentReaction = {...currentReaction, stage: 0, reactionId: null}
    }
}

const observer = new MutationObserver(() => {
    [...document.getElementsByClassName('use-reaction-button')].forEach((button) => {
        button.removeEventListener('click', () => {
            useReaction(Number(button.dataset.index))
        })
        button.addEventListener('click', () => {
            useReaction(Number(button.dataset.index))
        })
    })
})
observer.observe(document.getElementsByClassName('reaction-buttons')[0], { childList: true, subtree: true })


var render = (time) => {
    requestAnimationFrame(render);
    renderer.render(scene, camera)
    controls.update()

    if (document.hasFocus()) {
        currentReaction?.reaction?.animate()
    }

    let oldTime = clock.getElapsedTime()
    if (!document.hasFocus() && clock.running) {
        clock.stop()
    } else if (document.hasFocus() && !clock.running) {
        clock.start()
        clock.elapsedTime = oldTime
    }
}
render()

window.addEventListener('resize', () => {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
}, false)