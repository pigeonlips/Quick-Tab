function Manager()
{
    this.help = new Help();
    this.settings = new Settings();
    this.search = new Search(this);

    this.tabReference = document.querySelector('#tabs');
    this.tabArray = this.generateList();
    this.selectedTab = -1;

    this.tabLock = false;

    this.help.show();

    // Block up and down arrows in search box to prevent repositioning of carret to beginning/end
    this.search.searchInputReference.addEventListener('keydown', function(e) {
        keyCode = e.keyCode;

        if(
            keyCode == 38 ||             //Up
            keyCode == 40                //Down
        ){
            e.preventDefault();
        }
    }.bind(this));

    //User pressed a key in the search box
    this.search.searchInputReference.addEventListener('keyup', function(e) {
        if(this.search.isValidSearchChar(e)) {
            this.search.searchInputKeyup(e, this.tabArray);
        }
    }.bind(this));

    //User clicked the clear search button
    this.search.searchClearReference.addEventListener('mousedown', function(e) {
        this.search.clear(this.tabArray);
    }.bind(this));
}

Manager.prototype.showHelp = function()
{
   this.help.show();
};

Manager.prototype.showSettings = function()
{
   this.settings.show();
};

Manager.prototype.generateList = function()
{
  var tabArray = [];
  var query = {};
  if (localStorage['display.tabs.from.all.windows'] === 'false') {
    query.currentWindow = true;
  }

  chrome.tabs.query({}, function(tabs) {
    for(var i=0; i<tabs.length; i++) {
      //Create an object for each tab
      var tab = new Tab(tabs[i].id, tabs[i].windowId, tabs[i].title, tabs[i].url, tabs[i].favIconUrl, this);
      //Add the object to the tab array
      tabArray.push(tab);
      //Add to the tabs view
      this.tabReference.appendChild(tab.view);
    }
  }.bind(this));

  return tabArray;
};

Manager.prototype.setSelectedTab = function(tabId)
{
    if (!this.tabLock) {

        var i = 0;
        while (i < this.tabArray.length) {
            if (this.tabArray[i].id == tabId) {
                this.selectedTab = i;
                break;
            }
            i++;
        }
    }
};

Manager.prototype.resetSelectedTab = function() {
    if (!this.tabLock) {
        this.selectedTab = -1;
    }
};

Manager.prototype.moveSelectedTab = function(down)
{
    var visibleTabs = [];
    var currentTab = -1;

    for(var i=0; i<this.tabArray.length; i++) {
        if(this.tabArray[i].isVisible)
            visibleTabs.push(i);

        if(this.selectedTab == i)
            currentTab = visibleTabs.length - 1;
    }

    if (down) {
        this.selectedTab = visibleTabs[Math.min(visibleTabs.length - 1, currentTab + 1)];
    } else {
        this.selectedTab = visibleTabs[Math.max(0, currentTab-1)];
    }

    this.updateViewOffset();
    this.updateSelectedTab();
    this.tabLock = true;
};

Manager.prototype.updateViewOffset = function()
{
    var top = document.body.scrollTop;
    var bottom = top + window.innerHeight;

    var bounds = this.tabArray[this.selectedTab].view.getBoundingClientRect();
    var tabTop = bounds.top + window.pageYOffset - document.documentElement.clientTop;
    var tabBottom = bounds.bottom + window.pageYOffset - document.documentElement.clientTop;
    var moveDistance = tabBottom - tabTop;

    if (tabTop - top < moveDistance * 2) {
        document.body.scrollTop -= moveDistance;
    }

    if (bottom - tabBottom < moveDistance * 2) {
        document.body.scrollTop += moveDistance;
    }
};

Manager.prototype.updateSelectedTab = function()
{
    for(var i=0; i<this.tabArray.length; i++) {
        if (i == this.selectedTab)
            this.tabArray[i].view.classList.add('tabSelected');
        else
            this.tabArray[i].view.classList.remove('tabSelected');
    }
};


Manager.prototype.switchToSelectedTab = function()
{
    this.tabArray[this.selectedTab].switchTo();
};

Manager.prototype.closeSelectedTab = function()
{
    this.tabArray[this.selectedTab].close();
    this.searchInputReference.focus();
    //this.selectedTab = -1;
};

Manager.prototype.selectFirstTab = function()
{
    for(var i=0; i<this.tabArray.length; i++) {
        if (this.tabArray[i].isVisible) {
            this.selectedTab = i;
            this.updateSelectedTab();
            break;
        }
    }
};

window.onload = function()
{
    document.onmousemove = function() {
        tabManager.tabLock = false;
    };

  document.oncontextmenu = function(e) {
        e.preventDefault();
    };

    document.onkeydown = function(e) {
        switch (e.keyCode) {
            case 37:
            case 38:
                tabManager.moveSelectedTab(false);
                e.preventDefault();
                break;
            case 39:
            case 40:
                tabManager.moveSelectedTab(true);
                e.preventDefault();
                break;
            case 13:
                if (document.querySelector('#searchInput').value == "help") {
                  localStorage.removeItem('help');
                  tabManager.showHelp();
                  break;
                }
                if (document.querySelector('#searchInput').value == "options") {
                  tabManager.showSettings();
                  break;
                }
                // if not switch to selected tab
                tabManager.switchToSelectedTab();
                break;
            case 46:
                tabManager.closeSelectedTab();
                e.preventDefault();
                break;
            case 27:
                window.close();
                break;
            case 191:
              if (e.shiftKey) {
                localStorage.removeItem('help');
                tabManager.showHelp();
              }
              break;
        }

    };

    if (typeof localStorage['popup.width'] == 'undefined') {
        document.body.style.width = '400px';
    } else {
        document.body.style.width = localStorage['popup.width'] * 200 + 'px';
    }

    if (typeof ['display.accentColor'] == 'undefined') {

        // if color option is not set then use a blue by default
        document.documentElement.style.setProperty('--accent-color', "#1565C0");

    } else {

        // if user has set a color to use, override the css var
        document.documentElement.style.setProperty('--accent-color', localStorage['display.accentColor']);

    }

  var tabManager = new Manager();


    //Clicking the "Configure shortcut" button
    document.querySelector('#shortcutLink').addEventListener('click', function() {
        settings.openLink('chrome://extensions/configureCommands');
    });

    document.querySelector('#githubLink').addEventListener('click', function() {
        settings.openLink('https://github.com/tomlerendu/Quick-Tab/issues/new');
    });

    document.querySelector('.popupWidth').addEventListener('change', function(e) {
        localStorage['popup.width'] = e.target.value;
    });

    document.querySelector('#accentColor').addEventListener('change', function(e) {
        localStorage['display.accentColor'] = e.target.value;
    });

    document.querySelector('#displayTabsFromAllWindows').addEventListener('change', function(e) {
        localStorage['display.tabs.from.all.windows'] = e.target.checked;
    });

    var settings = new Settings();
    settings.setupWidthSlider();
    settings.setupAccentColor();
    settings.setupDisplayTabsFromAllWindows();

    // moving this to the bottom as vivaldi fails with 'Uncaught TypeError: Cannot read property 'getAll' of undefined' casuing the rest of the code not to take effect
    settings.displayKeyboardShortcut();

};
