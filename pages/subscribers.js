let proxyIframe;

window.addEventListener('load', async function() {
    const isDESearchActive = await isFeatureActive('de-search');
    if(isDESearchActive) {
    
        activateCss();

        const folderExpandObserver = new MutationObserver((mutations) => {
            mutations.forEach(async () => {
                if (window.name === 'canvas-b2ca1f50-3cc4-4fd7-a3a3-88bf09fb59fa') {
                    if(!proxyIframe)
                    proxyIframe = initProxyFrame();
                    insertSearchBar(proxyIframe);
                }
            })
        });

        if (window.name === 'SubsFrame') {
            initOpenFolder();
        } else if (window.name === 'fraTree') {
            const subsArea = await waitForElement('#SubsArea');
            const displayObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    window.parent.parent.postMessage({ type: 'updateSearchBarDisplay', value: isElementVisible(mutation.target) });
                });
            });
            displayObserver.observe(subsArea, { attributes: true, attributeFilter: ['style'] });
        } else if (window.name === 'canvas-b2ca1f50-3cc4-4fd7-a3a3-88bf09fb59fa') {
            const divLeftNav = await waitForElement('#divLeftNav');
            const displayObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    window.postMessage({ type: 'updateSearchBarDisplay', value: isElementVisible(mutation.target) });
                });
            });
            displayObserver.observe(divLeftNav, { attributes: true, attributeFilter: ['style'] });
        }

        folderExpandObserver.observe(document.body, { childList: true, subtree: true });
    }

    const isFolderExpandActive = await isFeatureActive('folder-expand');
    if(isFolderExpandActive) {
    
        activateCss();

        const folderExpandObserver = new MutationObserver((mutations) => {
            mutations.forEach(async () => {
                const windowName = window.name;
                if (windowName === 'fraLeftNav') {
                    await updateExpandArrow();
                } else if (windowName === 'canvas-b2ca1f50-3cc4-4fd7-a3a3-88bf09fb59fa') {
                    await updateNavbarWidth();
                }
            })
        });

        folderExpandObserver.observe(document.body, { childList: true, subtree: true });
    }

    const isFolderIdActive = await isFeatureActive('folder-id');
    if(isFolderIdActive) {
    
        activateCss();
        const folderIdObserver = new MutationObserver((mutations) => {
            mutations.forEach(async () => {
                if (window.name === 'canvas-b2ca1f50-3cc4-4fd7-a3a3-88bf09fb59fa') {
                    updateFolder();
                }
            })
        });

        if(window.name === 'SubsFrame') {
            window.addEventListener('message', async (event) => {
                if (event.data && event.data.type === 'updateFolderId') {
                    const updatedFolderId = getSelectedFolderId();
                    window.parent.parent.parent.postMessage({ type: 'folderIdUpdated', folderId: updatedFolderId });
                }
            });
        } else if (window.name === 'canvas-b2ca1f50-3cc4-4fd7-a3a3-88bf09fb59fa') {
            window.addEventListener('message', (e) => {
                if(e.data && e.data.type === 'folderIdUpdated') {
                    updateFolderIdLabel(e.data.folderId);
                }
            });
        }

        folderIdObserver.observe(document.body, { childList: true, subtree: true });
    }
});

function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

const insertSearchBar = (proxyIframe) => {
    const legacyContainer = document.querySelector('.legacy-container-fluid');
    if(!legacyContainer) return;

    const existingSearchBar = legacyContainer.querySelector('.de-search-bar');
    if(existingSearchBar) return;

    const searchBar = createSearchBar(proxyIframe);
    legacyContainer.insertBefore(searchBar, legacyContainer.firstChild);
}

const removeSearchBar = () => {
    const legacyContainer = document.querySelector('.legacy-container-fluid');
    if(!legacyContainer) return;

    const existingSearchBar = legacyContainer.querySelector('.de-search-bar');
    if(!existingSearchBar) return;

    existingSearchBar.parentElement.removeChild(existingSearchBar);
}

const createSearchBar = (proxyIframe) => {
    const barDiv = document.createElement('div');
    barDiv.classList.add('de-search-bar');
    barDiv.innerHTML = `
        <input type="text" maxlength="50" placeholder="Search for Data Extensions"/>
        <button class="search-icon">
            <img />
        </button>
    `;

    const input = barDiv.querySelector('input');

    const searchIcon = barDiv.querySelector('.search-icon');
    const searchIconImg = searchIcon.querySelector('img');
    searchIconImg.src = chrome.runtime.getURL('static/search.svg');

    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            proxyIframe.contentWindow.postMessage({ type: 'searchDataExtensions', value: input.value }, '*');
        }
    });

    searchIcon.addEventListener('click', (e) => {
        proxyIframe.contentWindow.postMessage({ type: 'searchDataExtensions', value: input.value }, '*');
        searchIcon.focus();
    });

    input.addEventListener('input', (e) => {
        hideResults();
    });

    window.addEventListener('message', (e) => {
        if(e.data.type === 'updateSearchBarDisplay') {
            barDiv.style.display = e.data.value ? 'block' : 'none';
        }
    });

    return barDiv;
}

const showResults = (proxyIframe, results) => {
    const barDiv = document.querySelector('.de-search-bar');
    if(!barDiv) return;

    const existingResults = barDiv.querySelector('.de-results');
    if(existingResults) barDiv.removeChild(existingResults);

    const resultsDiv = document.createElement('div');
    resultsDiv.classList.add('de-results');
    barDiv.appendChild(resultsDiv);

    const input = barDiv.querySelector('input');

    results.forEach(result => appendResult(proxyIframe, resultsDiv, result, input));
}

const hideResults = () => {
    const barDiv = document.querySelector('.de-search-bar');
    if(!barDiv) return;

    const existingResults = barDiv.querySelector('.de-results');
    if(existingResults) barDiv.removeChild(existingResults);
}

const appendResult = (proxyIframe, div, result, input) => {
    const resultElement = document.createElement('button');
    resultElement.innerText = result.name;
    resultElement.classList.add('result');
    resultElement.addEventListener('click', async (e) => {
        const breadcrumbs = await getCategoryBreadcrumbs(proxyIframe, result.categoryId);
        
        const subsFrameElement = document.querySelector('#fraLeftNav').contentWindow.document.querySelector('#fraTree').contentWindow.document.querySelector('#SubsFrame').contentWindow;
        if(!subsFrameElement) return;
        subsFrameElement.postMessage({ type: 'openFolder', value: breadcrumbs }, '*');

        input.value = result.name;

        resultElement.blur();
    });
    div.appendChild(resultElement);

    const openInNewWindow = document.createElement('a');
    openInNewWindow.classList.add('open-new');
    openInNewWindow.href = `https://mc.s50.marketingcloudapps.com/contactsmeta/admin.html#admin/data-extension/${result.id}/properties/`;
    openInNewWindow.target = '_blank';
    openInNewWindow.title = 'Open in Contact Builder';
    openInNewWindow.addEventListener('click', (e) => e.stopPropagation());
    resultElement.appendChild(openInNewWindow);

    const openInNewIcon = document.createElement('img');
    openInNewIcon.src = chrome.runtime.getURL('/static/contacts.svg');
    openInNewWindow.appendChild(openInNewIcon);
}

const getCategoryBreadcrumbs = async (proxyIframe, id, breadcrumbs = []) => {
    proxyIframe.contentWindow.postMessage({ type: 'searchCategory', value: id }, '*');

    const foundCategory = await waitForMessage(proxyIframe, 'searchCategoryResults');
    if (!foundCategory) return breadcrumbs;

    const newBreadcrumbs = [foundCategory, ...breadcrumbs];
    if (foundCategory.parentId === '0') return newBreadcrumbs;

    return getCategoryBreadcrumbs(proxyIframe, foundCategory.parentId, newBreadcrumbs);
};

const waitForMessage = (proxyIframe, expectedType) => {
    return new Promise((resolve) => {
        const messageListener = (event) => {
            if (event.source === proxyIframe.contentWindow && event.data.type === expectedType) {
                window.removeEventListener('message', messageListener);
                resolve(event.data.value);
            }
        };
        window.addEventListener('message', messageListener);
    });
};

const initProxyFrame = () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://mc.s50.marketingcloudapps.com/contactsmeta/#overview/contacts';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    window.addEventListener('message', (event) => {
        if (event.data.type === 'searchDataExtensionsResults') {
            showResults(iframe, event.data.value);
        }
    });

    return iframe;
}

const updateFolder = () => {
    const folderName = document.querySelector('#legacy .dg-head-name')?.innerText.trim();
    if(!folderName) return;

    const subsFrameElement = document.querySelector('#fraLeftNav').contentWindow.document.querySelector('#fraTree').contentWindow.document.querySelector('#SubsFrame').contentWindow;
    if(!subsFrameElement) return;

    subsFrameElement.postMessage({ type: 'updateFolderId', folderName });
}

const getSelectedFolderId = () => {
    return document.querySelector(':has(>.TreeNodeSelect)')?.href?.match(/categoryId: '(\d+)'/)[1] || null;
}

const updateFolderIdLabel = (folderId, repeat) => {

    const wrapper = document.querySelector('#legacy #carbon-legacy-dynamic .dg-head .dg-head-primary');
    if(!wrapper) return;
    
    const label = wrapper.querySelector('.f-folder-label');
    if(!label) {
        const newLabel = document.createElement('span');
        newLabel.classList.add('f-folder-label');
        if(!folderId) return;

        newLabel.listener = newLabel.addEventListener('click', () => {
            window.top.postMessage({ type: 'copyToClipboard', text: folderId }, '*');
        })
        newLabel.title = 'Click to copy';
        newLabel.innerHTML = `<span class="f-folder-pretext">Folder ID:</span><span>${folderId}</span><img src="${chrome.runtime.getURL('static/copy.svg')}"/>`;
        wrapper.appendChild(newLabel);
    } else if (folderId == null) {
        label.removeEventListener('click', label.listener);
        wrapper.removeChild(label);
    } else if (!label.innerHTML.includes(folderId)) {
        label.removeEventListener('click', label.listener);
        label.listener = label.addEventListener('click', () => {
            window.top.postMessage({ type: 'copyToClipboard', text: folderId }, '*');
        })
        label.innerHTML = `<span class="f-folder-pretext">Folder ID:</span><span>${folderId}</span><img src="${chrome.runtime.getURL('static/copy.svg')}"/>`;
    }

    if(!repeat) {
        setTimeout(() => {
            updateFolderIdLabel(folderId, true);
        }, 500);
    }
}

const initOpenFolder = () => {
    window.addEventListener('message', async (e) => {
        if(e.data.type === 'openFolder') {
            const breadcrumbs = e.data.value;
            await openFolder(breadcrumbs);
        }
    })
}

const waitForElement = async (selector, timeout = 1000, interval = 100) => {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const checkExist = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime >= timeout) {
                resolve(null); // Return null if not found within the timeout
            } else {
                setTimeout(checkExist, interval);
            }
        };
        checkExist();
    });
};

const openFolder = async (breadcrumbs) => {
    const firstFolder = await waitForElement(`a.TreeNode[href*="'${breadcrumbs[0].id}'"]`);
    console.log('found element', firstFolder)

    if (!firstFolder) {
        console.error(`Folder ${breadcrumbs[0].id} not found. Exiting.`);
        return;
    }

    if(breadcrumbs.length === 1) {
        [...document.querySelectorAll('.TreeNodeSelect')].forEach(a => a.classList.remove('TreeNodeSelect'));
        [...document.querySelectorAll('.TreeNodeFlash')].forEach(a => a.classList.remove('TreeNodeFlash'));
        firstFolder.click();
        firstFolder.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstFolder.querySelector('span').classList.add('TreeNodeSelect', 'TreeNodeFlash');
    } else {
        let expandButton = firstFolder;

        if(expandButton) {
            while(!expandButton.classList.contains('7') && !expandButton.classList.contains('8')) {
                expandButton = expandButton.previousElementSibling;
            }
    
            if(expandButton.classList.contains('8')) {
                expandButton.click();
            }
    
            breadcrumbs = breadcrumbs.filter((a, i) => i !== 0);
        }

        openFolder(breadcrumbs);
    }
}

const updateExpandArrow = async () => {
    const oldArrow = document.querySelector('#navbarHeaderArea td > img');
    if(!oldArrow || oldArrow.classList.contains('s-expand-arrow')) return;

    const wrapper = oldArrow.parentElement;
    wrapper.removeChild(oldArrow);

    const newArrow = document.createElement('img');
    newArrow.classList.add('s-expand-arrow', 'arrow');
    newArrow.src = chrome.runtime.getURL("static/expand-circle.svg");

    const isExpanded = await getData('subscribersExpanded');
    if(isExpanded) {
        newArrow.classList.add('flip');
    }

    newArrow.addEventListener('click', (e) => {
        const newState = !newArrow.classList.contains('flip');
        saveData('subscribersExpanded', newState);
        window.parent.postMessage({ type: 'toggleSubscribersExpand' }, '*');
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
        if(e.data.type === 'toggleSubscribersExpand') {
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