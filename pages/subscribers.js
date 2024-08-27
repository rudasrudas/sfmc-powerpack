window.addEventListener('load', async function() {
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
                const windowName = window.name;
                if (windowName === 'canvas-b2ca1f50-3cc4-4fd7-a3a3-88bf09fb59fa') {
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

const updateFolder = () => {
    const folderName = document.querySelector('#legacy .dg-head-name')?.innerText.trim();
    if(!folderName) return;

    const subsFrameElement = document.querySelector('#fraLeftNav').contentWindow.document.querySelector('#fraTree').contentWindow.document.querySelector('#SubsFrame').contentWindow;
    if(!subsFrameElement) return;

    subsFrameElement.postMessage({ type: 'updateFolderId', folderName });
}

const getSelectedFolderId = () => {
    return document.querySelector(':has(>.TreeNodeSelect)')?.href.match(/categoryId: '(\d+)'/)[1] || null;
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

const updateExpandArrow = async () => {
    const oldArrow = document.querySelector('#navbarHeaderArea td > img');
    if(!oldArrow || oldArrow.classList.contains('s-expand-arrow')) return;

    const wrapper = oldArrow.parentElement;
    wrapper.removeChild(oldArrow);

    const newArrow = document.createElement('img');
    newArrow.classList.add('s-expand-arrow', 'arrow');
    newArrow.src = chrome.runtime.getURL("static/expand-circle.png");

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