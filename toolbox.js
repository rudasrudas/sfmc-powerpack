let orderId;
let user;
let items;

function initToolbox(){
    updateInfo();
}

function updateInfo(){
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("request");
        if (request.message === 'order-info'){
            orderId = request.orderId;
            user = request.user;
            items = request.items;
        }
    });

}

initToolbox();