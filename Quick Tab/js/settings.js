function Settings()
{
    //setInterval(this.displayKeyboardShortcut, 1000);
    this.reference = document.querySelector('#settings');
    this.buttonReference = document.querySelector('#optionsButton');
}

Settings.prototype.show = function()
{
        this.reference.classList.remove('hidden');
        this.buttonReference.addEventListener('click', function(event) {
            this.hide();
        }.bind(this));
};

Settings.prototype.hide = function()
{
    this.reference.classList.add('hidden');
    window.location.reload(true);
};

Settings.prototype.setupWidthSlider = function()
{
    var selected = localStorage['popup.width'];

    if (typeof localStorage['popup.width'] == 'undefined') {
        document.querySelector('.popupWidth').value = 2;
    } else {
        document.querySelector('.popupWidth').value = selected;
    }
};

Settings.prototype.displayKeyboardShortcut = function()
{
    chrome.commands.getAll(function(commands){

        var foundShortcut = false;

        for(command in commands) {
            if(commands[command]['name'] == '_execute_browser_action' && commands[command]['shortcut'] != '') {
                document.querySelector('#keyboardShortcut').innerText = commands[command]['shortcut'];
                foundShortcut = true;
                break;
            }
        }

        if (!foundShortcut) {
            document.querySelector('#keyboardShortcut').innerText = '[Not set]';
        }

    }.bind(this));
};

Settings.prototype.setupAccentColor = function()
{
    var selected = localStorage['display.accentColor'];
    console.log('my color is [' + selected + '] !');
    if (typeof localStorage['display.accentColor'] == 'undefined') {
        document.querySelector('#accentColor').value = "#1565C0";
    } else {
        document.querySelector('#accentColor').value = localStorage['display.accentColor'];
    }
};

Settings.prototype.openLink = function(link)
{
    chrome.tabs.create({
        url: link
    });
};

Settings.prototype.setupDisplayTabsFromAllWindows = function()
{
    var storedValue = localStorage['display.tabs.from.all.windows'];
    if (typeof storedValue === 'undefined') {
        document.querySelector('#displayTabsFromAllWindows').checked = true;
    } else {
        document.querySelector('#displayTabsFromAllWindows').checked = (storedValue === "true");
    }
};
