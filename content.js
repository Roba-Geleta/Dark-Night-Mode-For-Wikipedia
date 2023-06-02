//content script that handles the calculation of the colours to darken the tabs

let tabID = {
    tabID: "hello",
} //message to send to background

let msg={
    txt:"pass",
}//message to send to background

chrome.runtime.sendMessage(tabID); //send message

chrome.runtime.onMessage.addListener(gotMessage);//receive msg

//function to handle the darkening process of the tab
function gotMessage(message, sender, sendResponse)
{

    if(message.txt==="attempt")
    {
        sendResponse(msg);
    }else
    if(message.txt === "hello")
    {

        if(!document.getElementById('DarkerWikiInject'))
        {
            let link = document.createElement("link");
            link.href = chrome.runtime.getURL('DarkerWikiInject.css');
            link.id = 'DarkerWikiInject';
            link.type = "text/css";
            link.rel = "stylesheet";
            document.getElementsByTagName("head")[0].appendChild(link);

            let elements;

            let check= ["DIV", "CODE", "FIGURE", "FIGCAPTION", "BLOCKQUOTE", "OL", "BUTTON", "LABEL","PRE", "NAV"];
            let tags =["TD","H1", "H2", "H3", "H4", "H5", "H6","P","TABLE", "TBODY", "TR", "TD", "TH", "UL", "LI", "DL", "DT", "DD","SPAN", "B", "I","DIV", "CODE", "FIGURE", "FIGCAPTION", "BLOCKQUOTE", "OL", "BUTTON", "LABEL","PRE", "NAV"];
            let tables=["TABLE", "TBODY", "TR", "TD", "TH"];

            //iterate through each tag
            tags.forEach(e =>{
                //find elements with the specific tag
                elements = document.getElementsByTagName(e);

                //iterate through each element with the specific tag
                for (let elt of elements)
                {

                    // console.log(elt.classList)
                    let style = window.getComputedStyle(elt).backgroundColor;
                    style = style.replaceAll("rgba",'').replaceAll("rgb",'').replaceAll('(','').replaceAll(')','').replaceAll(' ','');
                    let totalrgba = style.split(",");

                    for(let val in totalrgba){
                        totalrgba[val]=parseInt(totalrgba[val]);
                    }

                    let tclr='';
                    //rgba(1,2,3)  rgba(1,2,3,0-1)
                    if((totalrgba.length == 4 && totalrgba[3]!=0) || (totalrgba.length == 3)) {

                        // console.log(elt.textContent+"  "+elt);
                        let innerText=elt.textContent.trim();
                        if(innerText.length!=0) //if element has no inner text
                        {

                            if (check.includes(e)) //if element is of bigger containing elements
                            {
                                changeVal(totalrgba,0.1);
                                let clr = 'rgba(' + (totalrgba[0]) + ',' + (totalrgba[1]) + ',' + (totalrgba[2]) + ',0.9)';
                                elt.style.setProperty('background-color', clr, 'important');
                            }
                            else
                            {
                                if(elt.parentElement.tagName!=e && elt.parentElement.tagName!='A') //if element is not a child of another element of same tag and not under a link
                                {
                                    changeVal(totalrgba,0.15);
                                    if(tables.includes(e)) //if element part of table
                                    {
                                        let clr = 'rgba(' + (totalrgba[0]) + ',' + (totalrgba[1]) + ',' + (totalrgba[2]) + ',0.99)';
                                        elt.style.setProperty('background-color', clr, 'important');
                                    }
                                    else //element not part of table
                                    {
                                        let clr = 'rgba(' + (totalrgba[0]) + ',' + (totalrgba[1]) + ',' + (totalrgba[2]) + ',0.95)';
                                        elt.style.setProperty('background-color', clr, 'important');
                                    }
                                }

                            }
                        }

                    }

                    //prepare text color values
                    tclr = 'rgba(' + (255 - totalrgba[0]) + ',' + (255 - totalrgba[1]) + ',' + (255 - totalrgba[2]) + ',0.97)';
                    let p=false;

                    if(!elt.closest('A')) //if element not under link
                    {
                        if(elt.parentElement.tagName=='PRE')
                        {
                            let Textstyle = window.getComputedStyle(elt).color;
                            Textstyle = Textstyle.replaceAll("rgba",'').replaceAll("rgb",'').replaceAll('(','').replaceAll(')','').replaceAll(' ','');
                            let textrgba = Textstyle.split(",");

                            for(let val in textrgba){
                                textrgba[val]=parseInt(textrgba[val]);
                            }

                            tclr = 'rgba(' + (255 -textrgba[0]) + ',' + (255 -textrgba[1]) + ',' + (255 -textrgba[2]) + ',0.96)';
                            p=!p;

                        }

                            elt.style.setProperty('color',tclr, 'important');
                    }

                }


            });

        }


    }
}

//change the values of within the array based on the num
function changeVal(arr,num)
{
    arr[0]=arr[0]*num;
    arr[1]=arr[1]*num;
    arr[2]=arr[2]*num;
}