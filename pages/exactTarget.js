window.addEventListener('load', function() {
    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body, {
        childList: true, // Observe direct children
        subtree: true    // Observe all descendants
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