var Search = Class.create
({
	initialize : function()
	{

	},
	
	clear : function(tabArray)
	{
		//Focus the search box and remove it's value
		$('searchInput').focus();
		$('searchInput').value = '';
		//Hide the clear button
		$('searchClear').hide();
		//Show all tabs
		tabArray.each(function(tab) {
			tab.visible(true);
		});
		//Hide the no tabs matched notice
		$('noTabs').hide();
	},
	
	query : function(term, tabArray)
	{	
		//The term that must be matched
		var regex = new RegExp('(' + term + ')', 'gi');
		var tabCounter = 0;
	
		//Match against each tab
		tabArray.each(function(tab) {
			if(tab.title.match(regex) || tab.url.match(regex))
			{
				tab.visible(true);
				tabCounter++;
			}
			else
				tab.visible(false);
		});
		
		//No tabs matched message
		if(tabCounter == 0)
			$('noTabs').show();
		else
			$('noTabs').hide();
	},

	searchInputKeydown : function(e, tabArray)
	{
		if(!this.isValidSearchChar(e, 0))
			return;

		var term;

		if (e.keyCode == 13) {
            // enter
            var el = $$('.tab').find(function(el) { return el.visible(); });
            var tabId = parseInt(el.id.replace('tab-', ''));
            if (tabId) {
                chrome.tabs.update(tabId, {selected: true});
                window.close();
            }
            return;
        } else if (e.keyCode == 8) {
			term = $('searchInput').value.substring(0, $('searchInput').value.length - 1);
        }
		else {
			term = $('searchInput').value + String.fromCharCode(e.keyCode);
        }

		if(term.length != 0)
		{
			$('searchClear').show();
			this.query(term, tabArray);
		}
		else
			this.clear(tabArray);
	},

	isValidSearchChar : function(e, modifier)
	{
		//The keypressed event has keycodes that are 32 higher than the keydown event
		keyCode = e.keyCode - modifier;

		if(	(keyCode >= 48 && keyCode <= 57) ||    //Numbers
			(keyCode >= 65 && keyCode <= 90) ||    //Alphabet
			(keyCode >= 96 && keyCode <= 105) ||   //Num keys
			keyCode == 32 ||					   //Space bar
			keyCode == 8  ||						   //Backspace
            keyCode == 13
		)
			return true;

		return false;
	}
});

var Manager = Class.create
({
	initialize : function()
	{	
		this.help = new Help();
		this.search = new Search();

		this.tabArray = this.generateList()


        this.help.show();

		//User pressed a key in the search box
		$('searchInput').addEventListener('keydown', function(e) {
			this.search.searchInputKeydown(e, this.tabArray);
		}.bind(this));

		$('searchInput').addEventListener('keypress', function(e){
			if(!this.search.isValidSearchChar(e, 32))
				e.preventDefault();
		}.bind(this));

		//User clicked the clear search button
		$('searchClear').addEventListener('mousedown', function(e) {
			this.search.clear(this.tabArray);
		}.bind(this));

		//User clicked within the tab list
		$('tabs').addEventListener('mousedown', function(e) {

			//Go up the DOM until the actual tab element is found
			var el = e.target;
			while(el.className != 'tab')
				el = el.parentNode;
			
			//Get the ID for the tab
			var tabId = parseInt(el.id.replace('tab-', ''));

			switch(e.which)
			{
				case 1:
					//Left click, switch to the tab
					this.switchTab(tabId);
					window.close();
					break;
				case 3:
					//Right click, close the tab
					this.closeTab(tabId);
					break;
			}
		}.bind(this));
	},
	
	generateList : function()
	{
		var tabArray = new Array();
		chrome.tabs.getAllInWindow(null, function(tabs)
		{
			for(var i=0; i<tabs.length; i++)
			{
				//Create an object for each tab
				tabArray[tabs[i].id] = new Tab(tabs[i].id, tabs[i].title, tabs[i].url, tabs[i].favIconUrl);
				//Add to the tabs view		
				$('tabs').appendChild(tabArray[tabs[i].id].view);
			}
		});
		
		return tabArray;
	},
	
	closeTab : function(tabId)
	{
		//Remove the tab
		chrome.tabs.remove(tabId);
	
		//Remove the view
		this.tabArray[tabId].close();
	
		//Remove the tab from the tab list
		this.tabArray.splice(tabId, 1);
	},
	
	switchTab : function(tabId)
	{
		chrome.tabs.update(
			tabId,
			{selected: true}
		);
	}
});

window.onload = function() {
	document.oncontextmenu = function() { return false };
	var tabManager = new Manager();
};