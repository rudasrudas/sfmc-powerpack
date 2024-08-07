// Function to save data
function saveData(key, value) {
    chrome.storage.local.set({ [key]: value }, function() {
        console.log('Data saved:', key, value);
    });
}

// Function to retrieve data
async function getData(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError));
            } else {
                console.log('Data retrieved:', key, result[key]);
                resolve(result[key]);
            }
        });
    });
  }

// Function to clear data
function clearData(key) {
    chrome.storage.local.remove([key], function() {
        console.log('Data cleared:', key);
    });
}