window.addEventListener('load', async function() {
    const isDESearchActive = await isFeatureActive('de-search');
    if(isDESearchActive) {
    
        activateCss();

        window.addEventListener('message', (e) => {
            if(e.data.type === 'searchDataExtensions') {
                searchDataExtensions(e.data.value);
            } else if(e.data.type === 'searchCategory') {
                searchCategory(e.data.value);
            }
        });
    }
});

const searchDataExtensions = async (value) => {
    const response = await fetch(window.origin + `/contactsmeta/fuelapi/data-internal/v1/customobjects?$pageSize=10&$orderBy=modifiedDate&$search=%25${encodeURI(value)}%25`);
    const result = await response.json();

    window.parent.postMessage({ type: 'searchDataExtensionsResults', value: result?.items}, '*');
}

const searchCategory = async (value) => {
    const response = await fetch(window.origin + `/contactsmeta/fuelapi/legacy/v1/beta/folder/${encodeURI(value)}`);
    const result = await response.json();

    window.parent.postMessage({ type: 'searchCategoryResults', value: result }, '*');
}