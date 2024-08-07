window.addEventListener('load', function() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(async (mutation) => {
            if (mutation.type === 'childList') {
                const legacyElement = document.querySelector('#legacy');
                const windowName = window.name;

                if (windowName === 'fraLeftNav') {
                    await updateExpandArrow();
                } else if (legacyElement) {
                    await updateNavbarWidth();
                }
            }
        })
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

const updateExpandArrow = async () => {
    const oldArrow = document.querySelector('#navbarHeaderArea td > img');
    if(!oldArrow || oldArrow.classList.contains('s-expand-arrow')) return;
    
    const arrowSrc = oldArrow.src;

    const wrapper = oldArrow.parentElement;
    wrapper.removeChild(oldArrow);

    const newArrow = document.createElement('img');
    newArrow.classList.add('s-expand-arrow', 'arrow');
    newArrow.src = 'https://cdn0.iconfinder.com/data/icons/flat-round-arrow-arrow-head/512/Red_Arrow_Head_Left-2-512.png'

    const isExpanded = await getData('subscribersExpanded');
    if(isExpanded) {
        newArrow.classList.add('flip');
    }

    newArrow.addEventListener('click', (e) => {
        const newState = !newArrow.classList.contains('flip');
        saveData('subscribersExpanded', newState);
        window.parent.postMessage({ action: 'toggleSubscribersExpand' }, '*');
        newArrow.classList.toggle('flip');
    });

    wrapper.appendChild(newArrow);
}

const updateNavbarWidth = async () => {
    const legacyElement = document.querySelector('#legacy');
    const isExpanded = await getData('subscribersExpanded');
    if(!isExpanded) {
        legacyElement.classList.add('wide');
    }

    window.addEventListener('message', async (e) => {
        if(e.data.action === 'toggleSubscribersExpand') {
            const legacyElement = document.querySelector('#legacy');
            const isExpanded = await getData('subscribersExpanded');

            if(legacyElement) {
                if(isExpanded) {
                    legacyElement.classList.remove('wide');
                } else {
                    legacyElement.classList.add('wide');
                }
            }
        }
    })
}