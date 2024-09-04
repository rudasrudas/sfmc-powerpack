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

    ///////////////////
    // Recreating ui //
    ///////////////////

    let individualsTabContent = undefined;
    let addressData = [];

    const tabGroup = document.createElement('ul');
    tabGroup.classList.add('nav', 'nav-tabs', 'mp-tab-group');
    testRecipientBlock.appendChild(tabGroup);

    const initIndividualsTab = (addresses) => {
        const tabContainer = document.querySelector('.test-send-recipients-tab-content')
        individualsTabContent = document.createElement('div');
        individualsTabContent.classList.add('test-send-individuals', 'tab-pane', 'mp-tab-container');
        individualsTabContent.role = "tabpanel";
        individualsTabContent.innerHTML = `
            <div class="pillbox test-send-recipients-pillbox">
                <ul class="mp-pill-group">
                    <input type="text" class="mp-pillbox-add-item" placeholder="Add email address and press Enter">
                </ul>
            </div>`;
            tabContainer.appendChild(individualsTabContent);

        const addItemInput = individualsTabContent.querySelector('.mp-pillbox-add-item');

        const submitAllNewAddresses = () => {
            //Extract all addresses, and remove empty entries
            const addresses = cleanAscii(addItemInput.value).replace(/\s/g, ' ').split(/[\s,]+/).filter(address => address.length);
            addresses.forEach(address => appendAddress(address, true));
            addItemInput.value = '';
        }

        const appendAddress = (address, save = false) => {
            if(!address.length) return;
            const pillGroup = individualsTabContent.querySelector('.mp-pill-group');

            if(pillGroup.children.length >= 50) return;

            const pill = document.createElement('li');
            pill.classList.add('mp-pill');

            pill.innerText = address;
            pill.addEventListener('click', (e) => {
                pillGroup.removeChild(pill);
                refreshPills();
                addressData = addressData.filter(a => a !== address);
            })

            pillGroup.insertBefore(pill, addItemInput);
            if(save) {
                addressData.push(address);
                addressData = addressData.slice(50, -1);
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
            const pillGroup = individualsTabContent.querySelector('.mp-pill-group');
            const pills = [...pillGroup.querySelectorAll('.mp-pill')]

            pills.forEach(pill => {
                pill.classList.remove('duplicate', 'invalid');

                if(!pill.innerText.match(/^[\w-\.]+@([\w-]+\.)+[\w-]+$/g)) pill.classList.add('invalid');
                if(pills.find(p => p.innerText === pill.innerText && p !== pill)) pill.classList.add('duplicate');
            })
        }

        addresses.forEach(address => appendAddress(address));
        refreshPills();
    }

    const loadFromOriginalAddressList = () => {
        const emails = [];

        const originalPillgroup = testRecipientBlock.querySelector('.pill-group');
        [...originalPillgroup.querySelectorAll('ul > li > span:first-child')].forEach((e) => emails.push(e.innerText));

        return emails;
    }

    const updateOriginalAddressList = () => {
        const individualsTab = document.querySelector('.mp-tab-container');

        // Remove all addresses
        const originalPillgroup = testRecipientBlock.querySelector('.pill-group');
        [...originalPillgroup.querySelectorAll('ul > li > span > span')].forEach((e) => e.parentElement.click());

        if(!individualsTab) return

        // Add new addresses
        const newAddressList = [...individualsTab.querySelectorAll('.mp-pill')].map(pill => pill.innerText)
        newAddressList.forEach(address => {
            let input = document.querySelector(".test-send-recipients-pillbox * * input");
            input.value = address;
            input.dispatchEvent(new KeyboardEvent("keydown", { bubbles:!0, keyCode:13 }));
        })
    }

    const mutateAddressList = () => {
        updateOriginalAddressList();
    }
      
    const observeTab = () => {
        if (!individualsTabContent) return
        console.log('mutating')
        const observer = new MutationObserver(mutateAddressList);
        const config = { attributes: true, childList: true, subtree: true };
    
        observer.observe(individualsTabContent, config);
    };

    addressData = loadFromOriginalAddressList(); // READ EXISTING EMAILS
    initIndividualsTab(addressData);
    observeTab();
};
  
window.addEventListener('load', async function() {
    const isActive = await isFeatureActive('test-recipients');
    if(!isActive) return;
    
    activateCss();

    observeForMessageCreateContainer();
});

// UTILS

function cleanAscii(input)  {
    return input.replace(/[^\x00-\x7F]/g, '');
}