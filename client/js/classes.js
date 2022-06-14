function once(fn, context) { 
    var result;
    return function() { 
        if (fn) {
            result = fn.apply(context || this, arguments);
            fn = null;
        }
        return result;
    };
}
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

class Atom {

    constructor(protons, neutrons, shells, symbol, decays) {
        this.spin = Math.floor(Math.random() * 2) == 1 ? -1 : 1
        this.symbol = symbol
        this.protons = protons
        this.neutrons = neutrons
        this.protonsArray = []
        this.neutronsArray = []

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
    getProtonsArrayOfMeshes() {
        return this.protonsArray
    }
    getNeutronsArrayOfMeshes() {
        return this.neutronsArray
    }
    getShellsArrayOfGroups(){
        return this.shells
    }

    allowAnimation = true
    animate() {
        if(this.allowAnimation){
            const { protons, neutrons } = this.atomParameters

            const baseRotation = () => { return (0.01 + Math.floor(Math.random() * 10) + 1 + protons) / 500 }
    
            this.core.rotateX(baseRotation()/10)
            this.core.rotateY(baseRotation()/10)
    
            this.shells.forEach((shell, i) => {
    
                const angle = (baseRotation() + (i + 1) ** -1) / 30 * this.spin
                shell.rotateX(angle)
                shell.rotateY(angle)
                shell.rotateZ(angle)
            })
        }
    }
    stopAnimation(){
        this.allowAnimation = false
    }
    resumeAnimation(){
        this.allowAnimation = true
    }

    #createCore(protons, neutrons) {
        const core = new THREE.Group()
        let verticesParameter = 2.5
        let vertices = this.#getArrayOfVertices(verticesParameter)

        while(protons+neutrons != 0){
            vertices = this.#getArrayOfVertices(verticesParameter)
            const nucleusGeometry = new THREE.SphereGeometry(baseRadius * 1.5, 30, 30)
            while (protons+neutrons > 0 && vertices.length!=0) {
                let color
                let randomColor = Math.floor(Math.random()*2)

                if( randomColor == 0 && protons > 0){
                    color = Colors.red
                    protons--
                } else if( randomColor == 1 && neutrons > 0){
                    color = Colors.white
                    neutrons--
                } else { continue }

                const random = Math.floor(Math.random() * vertices.length)
    
                const nucleus = new THREE.Mesh(
                    nucleusGeometry,
                    new THREE.MeshStandardMaterial({ color, transparent: true })
                )

                if(randomColor){
                    this.neutronsArray.push(nucleus)
                } else {
                    this.protonsArray.push(nucleus)
                }

                const { x, y, z } = vertices[random]
                nucleus.position.set(x, y, z)
                vertices.splice(random, 1)
    
                core.add(nucleus)
            }
            verticesParameter+=1.5
        }

        return core
    }

    #getArrayOfVertices(verticesParameter) {
        let vertices = []
        const radius = (verticesParameter*baseRadius*2.6) / (2*Math.PI)
        let nucleusCount = verticesParameter-(verticesParameter-1)/2

        function horizontalCircle(nucleusCount, minorCircleRadius, yCord, vertices, rotation){
            range(0, 2 * Math.PI, (2 * Math.PI) / (nucleusCount)).forEach((angle) => {
                const xCord = minorCircleRadius * Math.cos(angle)
                const zCord = minorCircleRadius * Math.sin(angle) //+ baseRadius * 1.125 * Math.floor( Math.random() * 2)
                const θ = rotation * Math.PI / 180
                const randomSign = ()=>{ return Math.floor(Math.random()*2)==0 ? -1:1 }
                vertices.push({ 
                    x: (xCord*Math.cos(θ) - zCord*Math.sin(θ)) + baseRadius * 0.75 * Math.random() * randomSign(),
                    y: yCord,
                    z: (xCord*Math.sin(θ) + zCord*Math.cos(θ)) + baseRadius * 0.75 * Math.random() * randomSign(), 
                })
            })
        }
        range(verticesParameter / -2, 0, 1).forEach((y) => {
            const yCord = (radius*2 / (verticesParameter)) * y
            const minorCircleRadius = Math.sqrt(radius ** 2 - yCord ** 2)
            const rotation = Math.floor( Math.random()*360 )
            horizontalCircle(nucleusCount, minorCircleRadius, yCord, vertices, rotation)
            nucleusCount++
        })
        range(0, verticesParameter / 2+1, 1).forEach((y) => {
            const yCord = (radius*2 / (verticesParameter)) * y
            const minorCircleRadius = Math.sqrt(radius ** 2 - yCord ** 2)
            const rotation = Math.floor( Math.random()*360 )
            horizontalCircle(nucleusCount, minorCircleRadius, yCord, vertices, rotation)
            nucleusCount--
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
        ring.material.transparent = true
        valence.add(ring)

        let angle = 0
        for (let i = 0; i < electrons; i++) {
            const electron = new THREE.Mesh(
                new THREE.SphereGeometry(baseRadius, 50, 50),
                new THREE.MeshStandardMaterial({ color: Colors.blue })
            )
            electron.position.x = radius * Math.cos(angle)
            electron.position.y = radius * Math.sin(angle)
            electron.material.transparent = true

            angle += (Math.PI * 2) / electrons
            valence.add(electron)
        }

        valence.rotateX(Math.PI * 2 * Math.random())
        valence.rotateY(Math.PI * 2 * Math.random())
        valence.rotateZ(Math.PI * 2 * Math.random())

        return valence
    }

}

class WaveParticle {
    constructor(length, color, symbol, sup) {
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
        this.Positron.rotateZ(Math.floor(Math.random() * 2*Math.PI))
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
    constructor(length, color, symbol, sup) {
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
        this.Positron.rotateZ(Math.floor(Math.random() * 2*Math.PI))
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

    tweenAnimation() {
        let products = this.products
        let reagents = this.reagents
        let subProducts = this.subProducts

        let productProtonsArray = []
        let productNeutronsArray = []
        let reagentProtonsArray = []
        let reagentNeutronsArray = []

        const reagentTween = once(() => {

            reagentProtonsArray.forEach((proton, i) => {
                const random = i
                let newPostion = new THREE.Vector3()
                if(!productProtonsArray.length) {return}
                productProtonsArray[random].getWorldPosition(newPostion)
                const { x, y, z } = newPostion

                const protonParent = [proton.parent][0]

                scene.attach(proton)
                new Tween.get(proton.position)
                    .to({ x, y, z }, 999)
                    .wait(1)
                    .call(() => {scene.remove(proton)})//protonParent.attach(proton)})
            })
            reagentNeutronsArray.forEach((neutron, i) => {
                const random = i
                let newPostion = new THREE.Vector3()
                if(!productNeutronsArray.length) {return}
                productNeutronsArray[random].getWorldPosition(newPostion)
                const { x, y, z } = newPostion

                const neutronParent = [neutron.parent][0]

                scene.attach(neutron)
                new Tween.get(neutron.position)
                    .to({ x, y, z }, 999)
                    .wait(1)
                    .call(() => {scene.remove(neutron)})//neutronParent.attach(neutron)})
            })
        })
        const getReagentNucleous = once(() => {
            reagents.forEach((reagent) => {
                reagentProtonsArray = [...reagentProtonsArray, ...reagent.getProtonsArrayOfMeshes()]
                reagentNeutronsArray = [...reagentNeutronsArray, ...reagent.getNeutronsArrayOfMeshes()]
            })
            products.forEach((product, i) => {
                this.#tweenProduct(this.products, product, i)
                product.stopAnimation()
                productProtonsArray = [...productProtonsArray, ...product.getProtonsArrayOfMeshes()]
                productNeutronsArray = [...productNeutronsArray, ...product.getNeutronsArrayOfMeshes()]
            })

            const mapper = (mesh) => {                      
                new Tween(mesh.position)
                    .to({x: 0, y: 0, z: 0}, 700)
                new Tween(mesh.scale)
                    .to({x: 10**-6, y: 10**-6, z: 10**-6}, 700)
                    .call(() => { scene.remove(mesh) })
            }
            reagentProtonsArray.splice(0, reagentProtonsArray.length - productProtonsArray.length).forEach(mapper)
            reagentNeutronsArray.splice(0, reagentNeutronsArray.length - productNeutronsArray.length).forEach(mapper)

            if(!(reagentProtonsArray.length >= productProtonsArray.length && reagentNeutronsArray.length >= productNeutronsArray.length)){
                const extraAtom = new Atom(
                    reagentProtonsArray.length < productProtonsArray.length ? productProtonsArray.length - reagentProtonsArray.length : 0,
                    reagentNeutronsArray.length < productNeutronsArray.length ? productNeutronsArray.length - reagentNeutronsArray.length : 0,
                    [],
                    ''
                )
                const mapper = (type) => {
                    if(type){
                        return (mesh) => {
                            mesh.position.set(0,0,0)
                            mesh.scale.set( 10**-6, 10**-6, 10**-6)
                            reagentNeutronsArray.push(mesh)
    
                            scene.add(mesh)                        
                            new Tween(mesh.scale)
                                .to({x: 1, y: 1, z: 1}, 700)
                        }
                    } else {
                        return (mesh) => {
                            mesh.position.set(0,0,0)
                            mesh.scale.set( 10**-6, 10**-6, 10**-6)
                            reagentProtonsArray.push(mesh)
                            scene.add(mesh)                        
                            new Tween(mesh.scale)
                                .to({x: 1, y: 1, z: 1}, 700)
                        }
                    }

                }
                extraAtom.getProtonsArrayOfMeshes().forEach(mapper(0))
                extraAtom.getNeutronsArrayOfMeshes().forEach(mapper(1))  
            }
        })
        const showProducts = once(() => {
            products.forEach( async (product, i) => {
                await scene.add(product.getMesh())
                product.resumeAnimation()
            })
        })
        const showSubProducts = () => {
            clock.elapsedTime = 0

            this.allowAnimateFunc = true
            this.subProducts.forEach((subProduct) => {
                scene.add(subProduct.getMesh())
            })
        }
        reagents.forEach((reagent, i) => {
            new Tween.get(reagent.getMesh().position)
                .call(() => {
                    reagent.stopAnimation()
                    Tween.get(reagent.getMesh().rotation)
                        .to({ x:0, y:0, z:0 }, 1900)
                    Tween.get(reagent.getMesh().children[0].rotation)
                        .to({ x:0, y:0, z:0 }, 1900)
                })
                .call(() => {
                    reagent.getShellsArrayOfGroups().forEach((shell) => {
                        shell.children[0].material.opacity = 1
                        new Tween.get(shell.scale)
                            .wait(600)
                            .to({x: 5, y: 5, z: 5}, 500)
                        new Tween.get(shell.children[0].material)
                            .wait(300)
                            .to({opacity: 0}, 300)
                            .wait(500)
                            .call(() => {   
                                shell.remove(shell.children[0])
                            })
                            
                            shell.children.forEach( (electron, i) => {
                                if(i===0) {return}
                                new Tween.get(electron.scale)
                                    .wait(300)
                                    .to({x: 5**-1, y: 5**-1, z: 5**-1}, 500)
                                new Tween.get(electron.material)
                                    .wait(800)
                                    .to({opacity: 0}, 500)
                                    .call(() => {
                                        shell.remove(electron)
                                    })
                        })
                    })
                })
                .to({ x: 0, y: 0, z: 0 }, 2000)
                .call(getReagentNucleous)
                .call(reagentTween)
                .wait(999)
                .call(showProducts)
                .call( () => {
                    products.forEach((product) => {
                        product.getShellsArrayOfGroups().forEach((shell) => {
                            shell.children[0].material.opacity = 0
                            shell.scale.set(3,3,3)
    
                            new Tween.get(shell.scale)
                                .to({x: 1, y: 1, z: 1}, 500)
                            new Tween.get(shell.children[0].material)
                                .wait(500)
                                .to({opacity: 1}, 700)
                            
                        
                            shell.children.forEach( (electron, i) => {
                                if(i===0) {return}
                                electron.material.opacity = 0
                                electron.scale.set( 3**-1, 3**-1, 3**-1 )
                                new Tween.get(electron.scale)
                                    .to({x: 1, y: 1, z: 1}, 500)
                                new Tween.get(electron.material)
                                    .to({opacity: 1}, 500)
                            })
                        })
                    })
                })
                .call(once(showSubProducts))
        })


    }

    #tweenProduct(products, product, i) {
        if (i === 0) {
            product.getMesh().position.set(0, 0, 0)
        } else {
            const angleIncrement = (Math.PI * 2) / (products.length - 1)
            product.getMesh().position.set(
                baseRadius * 50 * Math.cos(angleIncrement * i),
                0,
                baseRadius * 50 * Math.sin(angleIncrement * i)
            )
            product.stopAnimation()
            product.getMesh().rotation.set( 0, 0, 0 )
            product.getMesh().updateMatrix()
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

/*--------------------------------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------------------------------*/

class SimulateDecay {
    constructor ( atom,  ) {

    }
}