const nav = document.querySelector(".navBar")
const btn = document.querySelector(".btn")


function toggleNav(){

nav.classList.toggle("Active")

}

btn.addEventListener("click", () =>{

toggleNav()

} )

