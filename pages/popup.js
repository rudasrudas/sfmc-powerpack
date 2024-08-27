const logo = document.querySelector('.logo');
const cloudBottomImg = document.querySelector('.cloud-bottom');
const cloudBlockImg = document.querySelector('.cloud-block');

const globalToggle = document.querySelector('#global');
const testRecipientsToggle = document.querySelector('#test-recipients');
const folderExpandToggle = document.querySelector('#folder-expand');
const folderIdToggle = document.querySelector('#folder-id');
const totalExclusionToggle = document.querySelector('#total-exclusion');
const queryStudioToggle = document.querySelector('#query-studio');

const toggles = [globalToggle, testRecipientsToggle, folderExpandToggle, folderIdToggle, totalExclusionToggle, queryStudioToggle];
toggles.forEach(async (toggle) => {
    const isActive = await getData('settings ' + toggle.id);
    if(isActive !== false) toggle.checked = true;

    if(isActive === false && toggle.id === 'global') {
        logo.classList.add('inactive');
        cloudBottomImg.classList.add('inactive');
    }

    toggle.addEventListener('change', function() {
        saveData('settings ' + toggle.id, this.checked ? true : false);
    })
});


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