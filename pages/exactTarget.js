window.addEventListener('load', async function() {
    const isActive = await isFeatureActive('folder-id');
    if(!isActive) return;
    
    activateCss();

    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body, {
        childList: true, // Observe direct children
        subtree: true    // Observe all descendants
    });

    window.top.addEventListener('message', event => {
        if (event.data.type === 'copyToClipboard') {
            navigator.clipboard.writeText(event.data.text).catch(() => {});
        } else if (event.data.type === 'openDE') {
            javascript:getTopWindow().launchContent({ content: 'de-grid', object: 'dataextension', categoryId: event.data.value});
        }
    });
});

const handleMutations = (mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Find the target element with the required class
            const targetElement = document.querySelector('.mc-accounts-menu .mc-account-switcher-current-account-details .pull-right');
            if (!targetElement) continue;

            // Extract innerText and save it
            const businessUnit = targetElement.innerText.trim();
            saveData('businessUnit', businessUnit);
            break;
        }
    }
};