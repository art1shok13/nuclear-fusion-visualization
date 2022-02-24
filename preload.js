window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })

const r = [
    {
        reagents:[
            { type: "atom", protons: 1, neutorns: 0, shells: [1], symbol: "H"},
            { type: "atom", protons: 1, neutorns: 0, shells: [1], symbol: "H"}
        ],
        products:[
            { type: "atom", protons: 1, neutorns: 1, shells: [1], symbol: "D"}
        ],
        subProduts:[
            { type: "wave", color: "0x8338ec", symbol: "p", sup: "+"},
            { type: "line", color: "0x3a86ff", symbol: "n", sup: "" }
        ]
    }
]
if( window.localStorage.reactions!=r ){
  window.localStorage.reactions = r
}