var tabsData = [];
var aceEditor;

window.addEventListener('load', function() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(async (mutation) => {
            if (mutation.type === 'childList') {
                const orgEditor = document.querySelector('#editor');
                const mainPageElement = document.querySelector('.main-page');

                if (orgEditor && mainPageElement) {
                    observer.disconnect();
                    insertTabs();
                }
            }
        })
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    insertTabs();
});

const initEditor = () => {
    const orgEditor = document.querySelector('#editor');
    const existingEditor = document.querySelector('#editor-copy');
    if(!orgEditor || existingEditor || ace === undefined) return;

    const copyEditor = orgEditor.cloneNode(true);
    copyEditor.id = 'editor-copy';
    copyEditor.classList.add('qs-editor');
    copyEditor.classList.add('active');

    aceEditor = ace.edit(copyEditor);
    const activeTab = tabsData.find(t => t.active)
    aceEditor.getSession().setValue(activeTab?.code || '');
    aceEditor.gotoPageDown();
    // aceEditor.focus();
    aceEditor.setTheme('ace/theme/sqlserver');
    aceEditor.session.setMode('ace/mode/sqlserver');
    aceEditor.getSession().on('change', async () => {
        tabsData = tabsData.map(t => ({
            ...t, 
            code: t.active ? aceEditor.getSession().getValue() : t.code
        }))
        await saveData('queryStudio', tabsData);
        updateOriginalEditor();
    });

    orgEditor.parentElement.appendChild(copyEditor);
}

const updateOriginalEditor = () => {
    const originalEditor = document.querySelector('#editor');
    if(!originalEditor) return;

    const textArea = originalEditor.querySelector('textarea');
    if(!textArea) return;

    const activeTab = tabsData.find(t => t.active);
    const activeTabQuery = activeTab ? activeTab.code : '';
    textArea.value = activeTabQuery;

    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    textArea.dispatchEvent(inputEvent);
}

const insertTabs = async () => {
    const mainPageElement = document.querySelector('.main-page');
    if(!mainPageElement || mainPageElement.classList.contains('initialized')) return;
    mainPageElement.classList.add('initialized');

    const optionsPanelElement = mainPageElement.querySelector('.slds-grid.options-panel');
    if(!optionsPanelElement) return;

    const prevTabsContainer = mainPageElement.querySelector('.qs-tabs-container');
    if(prevTabsContainer) return;

    const tabsContainer = document.createElement('ul');
    tabsContainer.classList.add('qs-tabs-container');

    await loadTabs(tabsContainer);

    mainPageElement.insertBefore(tabsContainer, optionsPanelElement);
}

const createTabElement = (tabsContainer, tab) => {
    const element = document.createElement('li');
    element.classList.add('qs-tab', 'slds-button', 'slds-button_neutral');
    if(tab.active) {
        element.classList.add('slds-button_brand', 'active');
    }
    element.innerHTML = tab?.name || 'Query';
    
    const addX = () => {
        const x = document.createElement('span');
        x.classList.add('close')
        x.innerText = '×';
        element.appendChild(x);
        x.addEventListener('click', async (e) => {
            if(tabsData.length <= 1) return;

            const editorElement = document.getElementById(tab.id);
            if(editorElement) {
                editorElement.parentElement.removeChild(editorElement);
            }
            tabsContainer.removeChild(element);
            tabsData = tabsData.filter(t => t.id !== tab.id);
            await selectTab(tabsContainer, tabsData[0]);
        });
    }

    addX();

    element.dataset.id = tab.id;
    element.addEventListener('click', async (e) => {
        if(e.detail === 2) {
            element.innerHTML = `<input class="qs-tab-input" type="text" maxlength="20">`;
            const input = element.querySelector('input');
            input.value = tabsData.find(t => t.id === tab.id).name;
            input.focus();

            input.addEventListener('keydown', async (e) => {
                if(e.key === 'Enter') {
                    element.removeChild(input);

                    if(input.value.length) {
                        // Update tab
                        const newValue = input.value
                        tabsData = tabsData.map(t => {
                            if(t.id !== tab.id) return t;
                            else return { ...t, name: newValue }
                        })
                        element.innerHTML = newValue;
                        addX();
                    } else {
                        if(tabsData.length <= 1) return;
                        
                        const editorElement = document.getElementById(tab.id);
                        if(editorElement) {
                            editorElement.parentElement.removeChild(editorElement);
                        }
                        tabsContainer.removeChild(element);
                        tabsData = tabsData.filter(t => t.id !== tab.id);
                        await selectTab(tabsContainer, tabsData[0]);
                    }

                    await saveData('queryStudio', tabsData);
                }
            })

            input.addEventListener('focusout', (e) => {
                setTimeout(() => {
                    if(tabsContainer.contains(element) && element.querySelector('.qs-tab-input')) {
                        element.removeChild(input);   
                        element.innerHTML = tabsData.find(t => t.id === tab.id).name;
                        addX();
                    }
                }, 0);
            })
        } else {
            await selectTab(tabsContainer, tab);
        }
    })

    return element;
}

const insertAddNewTabElement = (tabsContainer) => {
    const element = document.createElement('li');
    element.classList.add('qs-add-new-tab', 'slds-button', 'slds-button_neutral');
    element.innerText = '+';
    element.addEventListener('click', async (e) => {

        if(tabsData.length >= 10) return

        const firstAvailableNumber = () => {
            const arr = tabsData.map(t => {
                const match = t.name.match(/Query (\d+)/);
                return match ? match[1] : null
            }).filter(n => n !== null);

            return [...new Set(arr)].sort((a, b) => a - b).reduce((prev, curr) => (curr == prev ? prev + 1 : prev), 1);
        }

        const tab = {
            id: crypto.randomUUID(),
            name: `Query ${firstAvailableNumber()}`,
            code: '',
            active: false
        }
        tabsData.push(tab);
        await saveData('queryStudio', tabsData);

        const tabElement = createTabElement(tabsContainer, tab);
        tabsContainer.insertBefore(tabElement, element);
        
        await selectTab(tabsContainer, tab);
    })

    tabsContainer.appendChild(element);
}

const selectTab = async (tabsContainer, tab) => {
    //Update tab data
    tab = tabsData.find(t => t.id === tab.id);

    tabsData = tabsData.map(t => ({ ...t, active: t.id === tab.id }));
    await saveData('queryStudio', tabsData);

    [...tabsContainer.querySelectorAll('.qs-tab')].forEach(tabElement => {
        tabElement.classList.remove('active', 'slds-button_brand');
        
        if(tabElement.dataset.id === tab.id) {
            tabElement.classList.add('active', 'slds-button_brand');
        }
    });

    if(!aceEditor) return;

    aceEditor.getSession().setValue(tab.code);
    aceEditor.gotoPageDown();
    // aceEditor.focus();
}

const loadTabs = async (tabsContainer) => {
    const EMPTY_TABS = [{
        id: '1',
        name: 'Query 1',
        code: ''
    }];

    tabsData = await getData('queryStudio') || EMPTY_TABS;

    if(!tabsData.find(t => t.active)) {
        tabsData[0].active = true;
        await saveData('queryStudio', tabsData);
    }

    tabsData.forEach(tab => {
        const tabElement = createTabElement(tabsContainer, tab);
        tabsContainer.appendChild(tabElement);
    })

    insertAddNewTabElement(tabsContainer);

    initEditor();
    updateOriginalEditor();
}