//background script to handle the state of the extension
console.log("Darker Wikipedia now running.");
chrome.storage.sync.get(["STATE"], (STATE)=>{

    if(STATE["STATE"]==false)
    {
        chrome.action.setIcon({
            path:{
                "16": "/icons/Lighter16.png",
                "32": "/icons/Lighter32.png",
                "48": "/icons/Lighter48.png",
                "128": "/icons/Lighter128.png"
            }
        },()=>{});
    }
});

let tabs=[];            //holds the tab id
let tabLinks={};        //holds the links for the specific tab ids
let reloaded='';        //holds tab id of the last reloaded/updated tab

let msg = {
    txt: "hello",
} //message to send to content script

let msg2 = {
    txt: "attempt",
} //message to send to content script

//methods to deal with the state of the tabs
chrome.tabs.onUpdated.addListener(updated);
chrome.tabs.onActivated.addListener(activated);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    reloaded=sender.tab.id;
});


//when the button is clicked
chrome.action.onClicked.addListener(buttonClicked)
function buttonClicked(tab){

    chrome.storage.sync.get(["STATE"], (STATE)=>{

        if(STATE["STATE"]==undefined)
        {
            chrome.storage.sync.set({"STATE":false}, ()=>{});
            chrome.action.setIcon({
                path:{
                    "16": "/icons/Lighter16.png",
                    "32": "/icons/Lighter32.png",
                    "48": "/icons/Lighter48.png",
                    "128": "/icons/Lighter128.png"
                }
            },()=>{});
            tabs=[];
        }else
        if(STATE["STATE"]==true)
        {
            chrome.storage.sync.set({"STATE":false}, ()=>{});
            deactivate(tab.id, tab.url);
            chrome.action.setIcon({
                path:{
                    "16": "/icons/Lighter16.png",
                    "32": "/icons/Lighter32.png",
                    "48": "/icons/Lighter48.png",
                    "128": "/icons/Lighter128.png"
                }
            },()=>{});
        }else
        if(STATE["STATE"]==false)
        {
            chrome.storage.sync.set({"STATE":true}, ()=>{});
            let data={tabId: tab.id};
            activated(data);
            chrome.action.setIcon({
                path:{
                    "16": "/icons/Dark16.png",
                    "32": "/icons/Dark32.png",
                    "48": "/icons/Dark48.png",
                    "128": "/icons/Dark128.png"
                }
            },()=>{});
        }

    });
}

//if the tab was already in darkmode, remove dark mode
function deactivate(tabId, url)
{
    if (tabs.includes(tabId) && checkUrl(url))
    {
        removeIt(tabId);
        chrome.tabs.reload(tabId);
    }
}

//check the url
function checkUrl(url)
{
    let ret=false;
    for(let index of [".wikipedia.org",
        ".mediawiki.org",
        ".wikimedia.org",
        ".wikidata.org",
        "wikibooks.org",
        ".wikinews.org",
        ".wikiquote.org",
        ".wikisource.org",
        ".wikiversity.org",
        ".wikivoyage.org",
        ".wiktionary.org"])
    {
        if(url.includes(index))
        {
            ret=true;
            break;
        }
    }
    return ret;

}


//darken the tab
function tabDarken(tabId)
{

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs)
    {
        //send a message to content to see if it exists
        chrome.tabs.sendMessage(tabId, msg2, function(response)
        {
            //content exists, we can/should insert css
            if(response!=undefined && response.txt=="pass")
            {
                chrome.tabs.sendMessage(tabId, msg);
            }
            if(chrome.runtime.lastError)
            {
                //just to ignore error flag
            }
        });

    });

    reloaded=-1;
}

//callback function for when a tab is activated
function activated(data)
{
    if(data.tabId!=undefined)
    {

        chrome.tabs.get(data.tabId, function (tab) {

            //check if the url is of the desired type
            if (checkUrl(tab.url))
            {
                chrome.storage.sync.get(["STATE"], (STATE) => {
                    if (STATE["STATE"] == undefined)
                    {
                        chrome.storage.sync.set({"STATE": false}, () => {});
                    }
                    else if (STATE["STATE"] == true)
                    {
                        //add the tabId if it is not in the list and darken tab
                        if (!tabs.includes(data.tabId))
                        {
                            tabs.push(data.tabId);
                            tabDarken(data.tabId);
                        }
                    }
                    else if (STATE["STATE"] == false)
                    {
                        deactivate(data.tabId, tab.url);
                    }
                });
            }
        });
    }
}

//callback function for when a tab is updated
function updated(tabId, changeInfo, tab)
{

    //need to check on changeInfo status because wikipedia has many instances of iframes loading which
    //fires the onUpdated method. status needs to be complete
    if(checkUrl(tab.url) && changeInfo.status==="complete")
    {
        chrome.tabs.get(tabId, function (tab) {

            chrome.storage.sync.get(["STATE"], (STATE) => {

                if (STATE["STATE"] == undefined)
                {
                    chrome.storage.sync.set({"STATE": false}, () => {});
                }
                else if (STATE["STATE"] == true)
                {
                    if (!tabs.includes(tabId))
                    {
                        tabs.push(tabId);
                    }

                    if(tab.url)
                    {
                        //check if the new link is an extension of previous link under the same tab/tabId
                        //wikipedia has anchors that fire the onUpdated function but do not change the status of the page(new content being loaded)
                        let previousURL="";

                        if(tabLinks[tabId]!=undefined)
                        {
                            previousURL=tabLinks[tabId];
                        }

                        let extended=false;
                        if(previousURL!= tab.url)
                        {
                            let url=tab.url.toString();
                            let preurl=previousURL.toString();

                            //check if url is extended. anchors extend by #
                            if(url.length>0&&preurl.length>0)
                            {
                                let fi=url.indexOf('#');
                                let pi=preurl.indexOf('#');
                                for(let i in url)
                                {
                                    if(url[i]!==preurl[i])
                                    {
                                        if(url[i]=='#')
                                        {
                                            extended=true;
                                            break;
                                        }
                                    }
                                }

                                //if the previous search failed. incase the first loading of the url is an extended link of another link
                                if(!extended)
                                {
                                    fi=url.substring(0, fi);
                                    pi=preurl.substring(0, pi);
                                    if(fi==pi)
                                    {
                                        extended=true;
                                    }

                                }

                            }

                        }

                        //if either the tab was reloaded, or new link is not extension
                        if((!extended && (previousURL!== tab.url)) || (reloaded==tab.id))
                        {
                            tabDarken(tab.id);
                        }

                        //if it is not an extension, save the link for this tabId
                        if(!extended)
                        {
                            tabLinks[tabId]=tab.url;
                        }
                    }
                }
                else if (STATE["STATE"] == false)
                {
                    deactivate(tabId, changeInfo.url);
                }
            });
        });
    }
}


//check for tab closure and remove the tab id if it exists in tabs array
chrome.tabs.onRemoved.addListener(function(tabid, removed)
{
    removeIt(tabid);
});

//remove the tab from the tabs array
function removeIt(tabID)
{
    if(tabs.includes(tabID))
    {
        let index=tabs.indexOf(tabID);
        tabs.splice(index,1);
        delete tabLinks[tabID];
    }
}
