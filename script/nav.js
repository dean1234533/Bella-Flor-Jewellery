const nav = document.querySelector(".navBar")
const btn = document.querySelector(".btn")


function toggleNav(){

nav.classList.toggle("Active")
btn.setAttribute("aria-expanded", nav.classList.contains("Active") ? "true" : "false")

}

btn.addEventListener("click", () =>{

toggleNav()

} )

