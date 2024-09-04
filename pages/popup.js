const logo = document.querySelector('.logo');
const cloudBottomImg = document.querySelector('.cloud-bottom');
const cloudBlockImg = document.querySelector('.cloud-block');

const versionSpan = document.querySelector('.version');

const toggles = document.querySelectorAll('.category input[type="checkbox"]')
toggles.forEach(async (toggle) => {
    const isActive = await getData('settings ' + toggle.id);
    if(isActive !== false) toggle.checked = true;

    if(isActive === false && toggle.id === 'global') {
        logo.classList.add('inactive');
        cloudBottomImg.classList.add('inactive');
        cloudBlockImg.classList.add('inactive');
    }

    toggle.addEventListener('change', function() {
        saveData('settings ' + toggle.id, this.checked ? true : false);
    })
});

const globalToggle = document.querySelector('#global');
globalToggle.addEventListener('change', function() {
    if(this.checked) {
        logo.classList.remove('inactive');
        cloudBottomImg.classList.remove('inactive');
        cloudBlockImg.classList.remove('inactive');
    } else {
        logo.classList.add('inactive');
        cloudBottomImg.classList.add('inactive');
        cloudBlockImg.classList.add('inactive');
    }
})


chrome.management.getSelf((info) => {

    console.log(info);
    versionSpan.innerText = `Version ${info.version}`
})