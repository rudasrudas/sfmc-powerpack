// Function to save data
async function saveData(key, value) {
    try {
        await new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, function() {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error(error);
    }
}

// Function to retrieve data
async function getData(key) {
    return new Promise((resolve, reject) => {
      chrome.storage?.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError));
            } else {
                resolve(result[key]);
            }
        });
    });
  }

// Function to clear data
function clearData(key) {
    try {
        chrome.storage?.local.remove([key], function() {});
    } catch (err) {
        console.error(error);
    }
}