const sortableTags = new Map();
sortableTags.set("applicationVisibilities", "application");
sortableTags.set("customPermissions", "name");
sortableTags.set("flowAccesses", "flow");
sortableTags.set("fieldPermissions", "field");
sortableTags.set("layoutAssignments", "layout");
sortableTags.set("objectPermissions", "object");
sortableTags.set("recordTypeVisibilities", "recordType");
sortableTags.set("tabVisibilities", "tab");
sortableTags.set("userPermissions", "name");
sortableTags.set("custom", "N/A");
sortableTags.set("description", "N/A");

const supportedMetadata = ["Profile"];

var charPointer = 0;

function submit() {
    // Grab input
    var inputText = document.getElementById("input-text").value.trim();

    // Parse the XML
    var parser = new DOMParser();
    var inputXML = parser.parseFromString(inputText,"text/xml"); 

    var mapOfMaps = new Map();

    var simpleNodeCount = 0;
    var complexNodeCount = 0;
    var totalCount = 0;

    // For all permission nodes
    for(let currentNode of inputXML.getElementsByTagName("Profile")[0].childNodes){
        if(currentNode.nodeType != Node.ELEMENT_NODE)
            continue;


        // For simple nodes, write text to map
        if(isSimpleNode(currentNode)){
            console.log("Encountered simple node: \"" + currentNode.nodeName + "\"");
            mapOfMaps.set(currentNode.nodeName, currentNode);
            simpleNodeCount++;
            continue;
        }

        // Does node belong to an existing map?     Is this node supported?
        if(!mapOfMaps.has(currentNode.nodeName) && sortableTags.has(currentNode.nodeName)) {
            // If supported but has no map yet, create a new map for these nodes
            mapOfMaps.set(currentNode.nodeName, new Map());
            complexNodeCount++;
        }
        // Else if not supported, raise error
        else if(!sortableTags.has(currentNode.nodeName)) {
            console.log("Unsupported type: " + currentNode.nodeName);
            return;
        }
        
        totalCount++;

        var currentNodeKey = getCorrespondingKey(currentNode);
        // If there is no value already for this key
        if(!mapOfMaps.get(currentNode.nodeName).has(currentNodeKey))
            // Add this node to the map it belongs to
            // Use the corresponding child node value as key
            mapOfMaps.get(currentNode.nodeName)
                .set(currentNodeKey, currentNode);
        else {
            alert("Duplicate permission found for \"" + currentNodeKey + 
            "\" in node " + currentNode.nodeName + "#" + totalCount + 
            "! Remove duplicates before proceeding.");
            return;
        }
    }


    console.log("Found " + simpleNodeCount + " simple and " + complexNodeCount + 
    " complex node types under Profile, for a total of " + totalCount + " tags.");

    // Sort!
    const sortByKey = (a, b) => String(a[0]).localeCompare(b[0])

    // Reconstruct a map with sorted entries
    var mapOfSortedMaps = new Map();
    for (let [nodeName, nodeMap] of mapOfMaps.entries()) {
        // If it's simple node, skip (no map for it)
        if(isSimpleNode(nodeMap)){
            mapOfSortedMaps.set(nodeName, nodeMap);
            continue;
        }

        // Insert new sorted map, with the same key
        mapOfSortedMaps.set(nodeName, new Map([...nodeMap.entries()].sort(sortByKey)))
    }

    // Sort map of maps as well
    var sortedMapOfSortedMaps = new Map([...mapOfSortedMaps.entries()].sort(sortByKey));

    // Iterate the structure and rebuild the XML text
    var serialiser = new XMLSerializer();
    
    var outputText = '<?xml version="1.0" encoding="UTF-8"?>\n<Profile xmlns="http://soap.sforce.com/2006/04/metadata">\n';

    for (let nodeMap of sortedMapOfSortedMaps.values()) {
        // For simple nodes, write it out directly
        if(isSimpleNode(nodeMap)){
            outputText += xmlToString(serialiser, nodeMap);
            continue;
        }

        // For maps, iterate values and write to output
        for (let node of nodeMap.values())
            outputText += xmlToString(serialiser, node);
    }
    outputText += '</Profile>';

    // Check result to prevent data loss
    var outputXML = parser.parseFromString(outputText, "text/xml"); 
    var inputTags = inputXML.getElementsByTagName("Profile")[0].childElementCount;
    var outputTags = outputXML.getElementsByTagName("Profile")[0].childElementCount;

    if(inputTags == outputTags)
        document.getElementById("output-text").value = outputText;
    else
        alert("Mismatch input and output: " + inputTags + " != " + outputTags);
}

function getCorrespondingKey(node) {
    var found = false;
    // For each child node,
    for(let child of node.childNodes) {
        if(child.nodeType != Node.ELEMENT_NODE)
            continue;

        // Check if its nodeName matches the node we use to sort this permission typee
        if(child.nodeName == sortableTags.get(node.nodeName)){
            found = true;
            return child.childNodes[0].nodeValue;
        }
    }
    
    if(!found)
        console.log("Not found corresponding key for node named: " + node.nodeName);

}

function isSimpleNode(node) {
    return sortableTags.get(node.nodeName) == "N/A";
}

function xmlToString(serialiser, xml){
    return '    ' + serialiser.serializeToString(xml).replaceAll(' xmlns="http://soap.sforce.com/2006/04/metadata"', '') + '\n';
}