// NEXT VERSION:
// TODO: change drag visual (icon/text).
// TODO: add undo button.
// TODO: add pro version.
// TODO: add character counter to snip add field.
// TODO: add donate button.

let snip = {};
snip.help = {};
snip.item = {};
snip.error = {};

snip.maxItems = 5;
snip.characterLimit = 320;
snip.itemSet = new Set();
snip.ctrlPress = false;

snip.itemsContainer = document.querySelector('.items');

// Header
snip.addItemField = document.querySelector('#addItem');
snip.addItemButton = document.querySelector('button.add');
snip.addItemButtonIcon = document.querySelector('button.add>.icon');

// Snip Item
snip.item.backButton = document.querySelector('.message.full-text button.ok');

// Footer
snip.helpButton = document.querySelector('button.help');

// Help Screen
snip.help.okButton = document.querySelector('.message.help button.ok');

// Error Screen
snip.error.okButton = document.querySelector('.message.error button.ok');

// Statuses
snip.emptyStatus = document.querySelector('.message.empty');

// User Messages
snip.errorMessage = document.querySelector('.message.error');
snip.helpMessage = document.querySelector('.message.help');
snip.fullTextMessage = document.querySelector('.message.full-text');

//---//

// On extension load
window.addEventListener('load', (e) => {

    // Populate local Set and items container
    chrome.storage.sync.get('snipDB', function (items) {
        if (items['snipDB'].length) {
            snip.emptyStatus.classList.add('hidden');
            for (let item = 0; item < items['snipDB'].length; item++) {
                snip.itemSet.add(items['snipDB'][item]);
                snip.itemsContainer.appendChild(snip.createSnip(items['snipDB'][item]));
            }
        }
    });
    snip.addItemField.focus();
});

snip.updateStorage = function () {

    let currentDate = new Date();
    let storageVal = Array.from(snip.itemSet);

    if (!storageVal) {
        return;
    }

    chrome.storage.sync.set({
        'snipDB': storageVal
    }, function () {});

    chrome.storage.sync.get('snipDB', function (items) {});

}

snip.createSnip = function (content) {

    let newItem = document.createElement('div');
    newItem.classList.add('item');
    newItem.setAttribute('draggable', true);
    newItem.textContent = content;

    newItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData("text", e.target.textContent);
    });

    newItem.addEventListener('click', (e) => {
        if (e.ctrlKey) {
            if (e.target.classList.contains('item')) {
                snip.itemSet.delete(e.target.textContent);
                snip.updateStorage();
                e.target.remove();
            } else if (e.target.parentElement.classList.contains('item')) {
                snip.itemSet.delete(e.target.parentElement.textContent);
                snip.updateStorage();
                e.path[1].remove();
            }
        } else {
            snip.fullTextMessage.children[0].children[0].textContent = e.target.textContent;
            snip.toggleDisable();
            snip.fullTextMessage.classList.remove('hidden');
        }

        if (snip.itemsContainer.children.length === 0) {
            snip.emptyStatus.classList.remove('hidden');
        }

    });

    return newItem;
};

snip.addItem = function () {

    if (snip.addItemField.value === "") {
        snip.addItemField.classList.add('invalid');
    } else if (snip.addItemField.value.length > snip.characterLimit) {
        snip.displayError('character limit');
    } else {

        if (snip.itemsContainer.children.length < snip.maxItems) {

            snip.emptyStatus.classList.add('hidden');

            if (snip.itemSet.has(snip.addItemField.value)) {
                snip.displayError('item exists');
            } else {
                snip.itemSet.add(snip.addItemField.value);
                snip.updateStorage();
                snip.itemsContainer.appendChild(snip.createSnip(snip.addItemField.value));
                snip.addItemField.value = "";

                snip.addItemButtonIcon.classList.add('rotate');

            }

        } else if (snip.itemsContainer.children.length === snip.maxItems) {
            snip.displayError('item limit');
        }

    }
};

snip.displayError = function (error) {
    switch (error) {
        case 'item limit':
            snip.errorMessage.children[0].children[0].innerHTML = 'Snip items limit reached.<br>(Max of ' + snip.maxItems + ' allowed)';
            break;
        case 'character limit':
            snip.errorMessage.children[0].children[0].innerHTML = 'Character limit reached.<br>(Max of ' + snip.characterLimit + ' allowed)';
            break;
        case 'item exists':
            snip.errorMessage.children[0].children[0].innerHTML = 'Snip already exists.';
    }
    snip.errorMessage.classList.remove('hidden');
    snip.toggleDisable();
}

snip.toggleDisable = function () {
    if (snip.addItemField.disabled) {
        snip.addItemField.classList.remove('disabled');
        snip.addItemButton.classList.remove('disabled');
        snip.helpButton.classList.remove('disabled');
        snip.addItemField.disabled = false;
        snip.addItemButton.disabled = false;
    } else {
        snip.addItemField.classList.add('disabled');
        snip.addItemButton.classList.add('disabled');
        snip.helpButton.classList.add('disabled');
        snip.addItemField.disabled = true;
        snip.addItemButton.disabled = true;
    }
};

// Item addition
snip.addItemField.addEventListener('keypress', (e) => {
    if (e.key === "Enter") {
        snip.addItem(e);
    } else {
        snip.addItemField.classList.remove('invalid');
    }
});

snip.addItemButton.addEventListener('click', (e) => {
    snip.addItem(e);
});

// Item Removal
let removeIcon = document.createElement('img');
removeIcon.classList.add('state-icon');
removeIcon.setAttribute('src', 'svg/remove-icon.svg');
removeIcon.setAttribute('draggable', 'false');

document.addEventListener('keydown', (e) => {
    if (e.key === "Control" && !snip.ctrlPress) {

        for (let item = 0; item < snip.itemsContainer.children.length; item++) {
            snip.itemsContainer.children[item].classList.add('removable');
            snip.itemsContainer.children[item].appendChild(removeIcon.cloneNode());
        }

        snip.ctrlPress = true;

    }

});

document.addEventListener('keyup', (e) => {
    if (e.key === "Control") {
        for (let item = 0; item < snip.itemsContainer.children.length; item++) {
            snip.itemsContainer.children[item].classList.remove('removable');
            snip.itemsContainer.children[item].children[0].remove();
        }

        snip.ctrlPress = false;

    }
});

// Item add button icon
snip.addItemButtonIcon.addEventListener('transitionend', () => {
    snip.addItemButtonIcon.classList.remove('rotate');
});

// Help button
snip.helpButton.addEventListener('click', () => {
    snip.helpMessage.classList.remove('hidden');
    snip.toggleDisable();
    snip.helpButton.blur();
});

// Messages keypress dismiss
document.addEventListener('keypress', (e) => {
    if (e.key === "Enter")
        if (window.getComputedStyle(snip.errorMessage, null).getPropertyValue('opacity') === '1') {
            snip.errorMessage.classList.add('hidden');
            snip.toggleDisable();
            snip.addItemField.focus();
        } else if (window.getComputedStyle(snip.helpMessage, null).getPropertyValue('opacity') === '1') {
        snip.helpMessage.classList.add('hidden');
        snip.toggleDisable();
        snip.addItemField.focus();
    } else if (window.getComputedStyle(snip.fullTextMessage, null).getPropertyValue('opacity') === '1') {
        snip.fullTextMessage.classList.add('hidden');
        snip.toggleDisable();
        snip.addItemField.focus();
    }
});

// Messages click dismiss
snip.error.okButton.addEventListener('click', () => {
    snip.errorMessage.classList.add('hidden');
    snip.toggleDisable();
    snip.addItemField.focus();
});

snip.item.backButton.addEventListener('click', () => {
    snip.fullTextMessage.classList.add('hidden');
    snip.toggleDisable();
    snip.addItemField.focus();
});

snip.help.okButton.addEventListener('click', () => {
    snip.helpMessage.classList.add('hidden');
    snip.toggleDisable();
    snip.addItemField.focus();
});