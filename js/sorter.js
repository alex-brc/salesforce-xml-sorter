const sortableTags = [
    "applicationVisibilities",
    "flowAccesses",
    "fieldPermission", 
    "layoutAssignments", 
    "objectPermissions", 
    "recordTypeVisibilities",
    "tabVisibilities",
    "userPermissions"];

const sortBy = [
    "application",
    "flow",
    "field", 
    "layout", 
    "object", 
    "recordType",
    "tab",
    "name"];

function submit() {
    // Grab input
    var inputText = document.getElementById("input-text").value;
    var outputText = "Invalid input";



    
    document.getElementById("output-text").value = outputText;
}