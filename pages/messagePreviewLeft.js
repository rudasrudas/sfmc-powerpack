const observeForMessageCreateContainer = () => {
    const containerSelector = 'body'; // or a more specific parent if known
    const targetContainer = document.querySelector(containerSelector);
  
    if (!targetContainer) {
        return;
    }
  
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'subtree') {
                const messageCreateContainer = document.querySelector('.messagecreate-container');
                if (messageCreateContainer) {
                    setupMessageTabListener(); // Proceed to setup listener
                }
            }
        });
    });
  
    observer.observe(targetContainer, { childList: true, subtree: true });
};
  
const setupMessageTabListener = () => {
    const messageTab = document.querySelector('.messagepreview-tab[title="Test Send"]');
  
    if (messageTab) {
        if(!messageTab.dataset.eventListenerAdded) {
            messageTab.dataset.eventListenerAdded = 'true';
            onTestSendClick()
        }
    } else {
        // If the tab is not yet present, set a timeout to retry after a short delay
        setTimeout(setupMessageTabListener, 500);
    }
};
  
const onTestSendClick = async () => {
    const testRecipientWrap = document.querySelector('.test-send-wrap');
    const testRecipientBlock = testRecipientWrap.querySelector('.test-send-recipients');
    testRecipientBlock.classList.add('original-block');
    [...testRecipientBlock.children].forEach(child => child.style.display = 'none');

    ///////////////////
    // Recreating ui //
    ///////////////////

    let businessUnit = await getData('businessUnit');

    let tabList = [];
    let addressData = [];

    const tabGroup = document.createElement('ul');
    tabGroup.classList.add('nav', 'nav-tabs', 'mp-tab-group');
    testRecipientBlock.appendChild(tabGroup);

    const appendAddNewTab = () => {
        const button = document.createElement('li');
        button.classList.add('mp-add-new-tab');
        button.innerHTML = `<a href="#"><span class="tab new">+</span></a>`;
        button.addEventListener('click', (e) => {
            if(tabList.length >= 7) return;

            const orgHTML = button.innerHTML;
            button.innerHTML = `<input class="mp-tab-input" type="text" maxlength="10">`
            const input = button.querySelector('input');
            input.focus();

            input.addEventListener('keydown', (e) => {
                if(e.key === 'Enter') {
                    if(input.value.length) {
                        // Create new tab
                        const name = input.value;
                        const id = crypto.randomUUID();
                        const addresses = [];
                        appendTab(name, id, addresses, false);
                        addressData.push({
                            name,
                            id,
                            addresses,
                            valid: false
                        })

                        saveData(`addressData ${businessUnit}`, addressData);

                        button.removeChild(input);
                        button.innerHTML = orgHTML;
                    }
                }
            })

            input.addEventListener('focusout', (e) => {
                button.removeChild(input);
                button.innerHTML = orgHTML;
            })
        });

        tabGroup.appendChild(button);
    }

    const appendTab = (name, id, addresses, active = false) => {
        const tab = document.createElement('li');
        tab.innerHTML = `<a href="#" data-tab="${id}"><span class="tab">${name}</span></a>`;
        tab.addEventListener('click', (e) => {
            if(e.detail === 3) {
                tab.innerHTML = `<input class="mp-tab-input" type="text" maxlength="10">`
                const input = tab.querySelector('input');
                input.value = addressData.find(t => t.id === id).name;
                input.focus();

                input.addEventListener('keydown', (e) => {
                    if(e.key === 'Enter') {
                        if(input.value.length) {
                            // Update tab
                            const newValue = input.value
                            addressData = addressData.map(t => {
                                if(t.id !== id) return t;
                                else return { ...t, name: newValue }
                            })
                            tab.removeChild(input);
                            tab.innerHTML = `<a href="#" data-tab="${id}"><span class="tab">${newValue}</span></a>`;
                        } else {
                            tab.removeChild(input);
                            tabGroup.removeChild(tab);
                            const tabFromArray = tabList.pop(t => t.id === id);
                            testRecipientBlock.removeChild(tabFromArray.contentElement);
                            addressData = addressData.filter(t => t.id !== id);
                        }

                        saveData(`addressData ${businessUnit}`, addressData);
                    }
                })

                input.addEventListener('blur', (e) => {
                    setTimeout(() => {
                        tab.innerHTML = `<a href="#" data-tab="${id}"><span class="tab">${addressData.find(t => t.id === id).name}</span></a>`;
                    }, 0);
                })
            }

            selectTab(id);
        });

        const tabContent = document.createElement('div');
        tabContent.classList.add('test-send-recipients-tab-content');
        tabContent.innerHTML = `
        <div class="test-send-individuals tab-pane" role="tabpanel">
            <div class="pillbox test-send-recipients-pillbox">
                <ul class="mp-pill-group" data-id="${id}">
                    <input type="text" class="mp-pillbox-add-item" placeholder="Add email address and press Enter">
                </ul>
            </div>
        </div>`;
        testRecipientBlock.appendChild(tabContent);
        const addItemInput = tabContent.querySelector('.mp-pillbox-add-item');

        const submitAllNewAddresses = () => {
            //Extract all addresses, and remove empty entries
            const addresses = cleanAscii(addItemInput.value).split(/[, \n]+/).filter(address => address.length);
            addresses.forEach(address => appendAddress(address, true));
            addItemInput.value = '';
        }

        const appendAddress = (address, save = false) => {
            const pillGroup = tabContent.querySelector('.mp-pill-group');

            if(pillGroup.children.length >= 50) return;

            const pill = document.createElement('li');
            pill.classList.add('mp-pill');

            pill.innerText = address;
            pill.addEventListener('click', (e) => {
                pillGroup.removeChild(pill);
                refreshPills();
                addressData = addressData.map(tab => {
                    if(tab.id !== pillGroup.dataset.id) return tab;
                    
                    tab.addresses = tab.addresses.filter(a => a !== address);
                    return tab;
                })
                saveData(`addressData ${businessUnit}`, addressData);
            })

            pillGroup.insertBefore(pill, addItemInput);
            if(save) {
                addressData.find(tab => tab.id === pillGroup.dataset.id).addresses.push(address);
                addressData.find(tab => tab.id === pillGroup.dataset.id).addresses.slice(50, -1);
                saveData(`addressData ${businessUnit}`, addressData);
            }
            refreshPills();
        }

        addItemInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                setTimeout(() => {
                    submitAllNewAddresses();
                }, 0)
            }
        })
        
        addItemInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                submitAllNewAddresses();
            }, 0)
        });

        addItemInput.addEventListener('input', (e) => {
            if(!addItemInput.value.match(/[ ]+$/)) return

            //Extract all addresses, and remove empty entries, except for last one
            const addresses = cleanAscii(addItemInput.value).split(/[, \n]+/).filter((address, index, arr) => address.length || index === arr.length - 1);
            const lastAddress = addresses.pop() || '';

            addresses.forEach(address => appendAddress(address, true));
            //Place last address back as the value
            addItemInput.value = lastAddress;
        })

        const refreshPills = () => {
            const pillGroup = tabContent.querySelector('.mp-pill-group');
            const pills = [...pillGroup.querySelectorAll('.mp-pill')]

            pills.forEach(pill => {
                pill.classList.remove('duplicate', 'invalid');

                if(!pill.innerText.match(/^[\w-\.]+@([\w-]+\.)+[\w-]+$/g)) pill.classList.add('invalid');
                if(pills.find(p => p.innerText === pill.innerText && p !== pill)) pill.classList.add('duplicate');
            })
        }

        addresses.forEach(address => appendAddress(address));
        refreshPills();

        if(active) {
            tab.classList.add('active');
            tabContent.style.display = 'block';
        } else {
            tabContent.style.display = 'none';
        }

        tabList.push({
            name, 
            id, 
            addresses, 
            element: tab,
            contentElement: tabContent
        });
        tabGroup.insertBefore(tab, tabGroup.querySelector('.mp-add-new-tab'));
    }

    const selectTab = (id) => {
        tabList.forEach(tab => {
            if(tab.id === id) {
                tab.element.classList.add('active')
                tab.contentElement.style.display = 'block';
            } else {
                tab.element.classList.remove('active')
                tab.contentElement.style.display = 'none';
            }
        })

        addressData.forEach(tab => {
            tab.active = tab.id === id;
        })
        saveData(`addressData ${businessUnit}`, addressData);
    }

    const updateOriginalAddressList = () => {
        const activeTab = tabList.find(tab => tab.element.classList.contains('active'))

        // Remove all addresses
        const originalPillgroup = testRecipientBlock.querySelector('.pill-group');
        [...originalPillgroup.querySelectorAll('ul > li > span > span')].forEach((e) => e.parentElement.click());

        if(!activeTab) return

        // Add new addresses
        const newAddressList = [...activeTab.contentElement.querySelectorAll('.mp-pill')].map(pill => pill.innerText)
        newAddressList.forEach(address => {
            let input = document.querySelector(".test-send-recipients-pillbox * * input");
            input.value = address;
            input.dispatchEvent(new KeyboardEvent("keydown", { bubbles:!0, keyCode:13 }));
        })
    };
      
    const handleMutations = (mutationsList, observer) => {
        updateOriginalAddressList();
    };
      
    const observeTabListElements = () => {
        tabList.forEach((item) => {
            if (!item.contentElement) return
            const observer = new MutationObserver(handleMutations);
            const config = { attributes: true, childList: true, subtree: true };
        
            observer.observe(item.contentElement, config);
            item.observer = observer;
        });
    };

    addressData = await getData(`addressData ${businessUnit}`);

    if(!addressData) {
        addressData = [
            {
                name: 'Personal',
                id: 'personal',
                addresses: [],
                active: true
            },
            {
                name: 'Shared',
                id: 'shared',
                addresses: [],
                active: false
            },
            {
                name: 'Market',
                id: 'market',
                addresses: [],
                active: false
            }
        ]

        saveData(`addressData ${businessUnit}`, addressData);
    }

    addressData.forEach((tab) => {
        appendTab(tab.name, tab.id, tab.addresses, tab.active);
    })
    appendAddNewTab();

    updateOriginalAddressList();
    observeTabListElements();
};
  
window.addEventListener('load', function() {
    observeForMessageCreateContainer();
});

// UTILS

function cleanAscii(input)  {
    return input.replace(/[^\x00-\x7F]/g, '');
}