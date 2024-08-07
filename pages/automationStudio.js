window.addEventListener('load', function() {
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
    const itemsOverviewElement = htmlElement.querySelector('#overviewItemsFilter');
    const wrapper = htmlElement.querySelector('#overviewItemsFilter .folder-header');

    if(!wrapper) return;

    const existingArrow = wrapper.querySelector('.as-expand-arrow');
    if(existingArrow) return;

    const newArrow = document.createElement('img');
    newArrow.classList.add('as-expand-arrow', 'arrow');
    wrapper.classList.add('as-arrow-wrapper');
    wrapper.appendChild(newArrow);
    newArrow.src = 'https://cdn0.iconfinder.com/data/icons/flat-round-arrow-arrow-head/512/Red_Arrow_Head_Left-2-512.png'

    const isExpanded = await getData('automationStudioExpand');
    if(isExpanded) {
        itemsOverviewElement.classList.add('wide');
    } else {
        newArrow.classList.add('flip');
    }

    newArrow.addEventListener('click', (e) => {
        const newState = !newArrow.classList.contains('flip');
        saveData('automationStudioExpand', !newState);
        if(newState) {
            itemsOverviewElement.classList.remove('wide');
        } else {
            itemsOverviewElement.classList.add('wide');
        }
        newArrow.classList.toggle('flip');
    });

}