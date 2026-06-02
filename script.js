console.log("Portfolio Ready 🚀");
const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {

    entries.forEach((entry) => {

      if(entry.isIntersecting){
        entry.target.classList.add("active");
      }

    });

  },
  {
    threshold:0.15
  }
);

reveals.forEach((el) => {
  observer.observe(el);
});
/* TYPING ONCE */

const text =
"Data enthusiast, graphic designer, and creative developer passionate about technology and digital creativity.";

let index = 0;

const typingElement =
document.getElementById("typing");

function typeEffect(){

  if(index < text.length){

    typingElement.innerHTML += text.charAt(index);

    index++;

    setTimeout(typeEffect, 55);

  }

}

window.onload = typeEffect;
/* FLASHLIGHT EFFECT */

const imageHover =
document.querySelector(".image-hover");

const flashlight =
document.querySelector(".flashlight");

if(imageHover && flashlight){

  imageHover.addEventListener("mousemove", (e) => {

    const rect =
    imageHover.getBoundingClientRect();

    const x = e.clientX - rect.left;

    const y = e.clientY - rect.top;

    flashlight.style.left = x + "px";

    flashlight.style.top = y + "px";

  });

  imageHover.addEventListener("mouseenter", () => {

    flashlight.style.opacity = "1";

  });

  imageHover.addEventListener("mouseleave", () => {

    flashlight.style.opacity = "0";

  });

}
const cvTrigger = document.getElementById("cvTrigger");
const cvTrigger2 = document.getElementById("cvTrigger2");

const cvModal = document.getElementById("cvModal");
const closeCv = document.querySelector(".close-cv");

cvTrigger.addEventListener("click", () => {
    cvModal.classList.add("show");
});

cvTrigger2.addEventListener("click", () => {
    cvModal.classList.add("show");
});

closeCv.addEventListener("click", () => {
  cvModal.classList.remove("show");
});

cvModal.addEventListener("click", (e) => {
  if (e.target === cvModal) {
    cvModal.classList.remove("show");
  }
});