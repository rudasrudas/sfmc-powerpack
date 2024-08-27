window.addEventListener('load', async function() {
    const isActive = await isFeatureActive('folder-expand');
    if(!isActive) return;
    
    activateCss();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(async (mutation) => {
            if (mutation.type === 'childList') {
                const htmlElement = document.querySelector('html.fuelux');

                if (htmlElement) {
                    await insertExpandArrow();
                }
            }
        })
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

const insertExpandArrow = async () => {
    const htmlElement = document.querySelector('html.fuelux');
    const wrapper = htmlElement.querySelector('.toggle-locations-header.nav.nav-tabs');

    if(!wrapper) return;

    const existingArrow = wrapper.querySelector('.cb-expand-arrow');
    if(existingArrow) return;

    const newArrow = document.createElement('img');
    newArrow.classList.add('cb-expand-arrow', 'arrow');
    wrapper.classList.add('cb-arrow-wrapper')
    wrapper.appendChild(newArrow);
    newArrow.src = chrome.runtime.getURL("static/expand-circle.png");

    const isExpanded = await getData('contentBuilderExpand');
    if(isExpanded) {
        htmlElement.classList.add('wide');
    } else {
        newArrow.classList.add('flip');
    }

    newArrow.addEventListener('click', (e) => {
        const newState = !newArrow.classList.contains('flip');
        saveData('contentBuilderExpand', !newState);
        if(newState) {
            htmlElement.classList.remove('wide');
        } else {
            htmlElement.classList.add('wide');
        }
        newArrow.classList.toggle('flip');
    });

}