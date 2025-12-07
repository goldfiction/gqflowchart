//custom.js

var editorContent = null;
var editorIDCount = 0;
var myKeyboard = null;
var currentFocusedEditorId = null;

function getEditorContent() {
    return new Promise((resolve) => {
        $.ajax({
            type: "POST",
            url: "/geteditorcontent",
            data: {},
            success: function (data, status, XHR) {
                //console.log(status)
                //console.log(data)
                editorContent = JSON.parse(data)
                resolve()
            },
            error: function (e) {
                console.log(e)
                try {
                    editorContent = localStorage.getItem('editorContent');
                    editorContent = JSON.parse(editorContent)
                    editorContent.editorIDCount = editorContent.editorIDCount || 0
                    editorIDCount = editorContent.editorIDCount;
                    editorContent.editor = editorContent.editor.filter(item => item !== null)
                } catch (e) {
                    console.log(e)
                    editorContent = {}
                    editorContent.editor = []
                    editorContent.editorIDCount = 0
                    editorIDCount = editorContent.editorIDCount;
                    saveEditorContent()
                }
                resolve()
            },
            dataType: "text"
        });
    });
}

var fileFolder=null;
function openFolder(path) {
    $.ajax({
        type: "POST",
        url: "/folder",
        data: { path: path },
        success: function (data, status, XHR) {
            fileFolder = JSON.parse(data)
            updateFolder(fileFolder, path)
            //$('.tree-title').click()
        },
        dataType: "text"
    });
}

function resetTree() {
    $('body').find('.tree').fadeOut(0);

    $('.tree-title').click(function () {
        setStatus($(this));
    });

}

function compactPath(path) { 
    return path.split('/').slice(-2).join('/')
}

function updateFolder(data, path) { 
    //console.log(data)
    
    $('.main-tree').empty()
    $('.main-tree').append("<li class=\"tree-title\">" + compactPath(path) + "</li><ul class=\"tree folder-item\" path=\"" + path + "/../" +"\"></ul>");
    elem = $('.main-tree ul').append("<li class=\"tree-title\">..</li>")
    data.forEach((file) => {
        if (file.type == "folder")
            elem = elem.before("<ul class=\"tree folder-item\" style=\"display: none;\" path=\"" + file.path +"\"><li class=\"tree-title\">"+file.file+"</li></ul>")
    })
    data.forEach((file) => {
        if (file.type == "file") {
            elem = elem.before("<li class=\"tree tree-item file-item\" style=\"display: none;\" path=\""+file.path+"\">" + file.file + "</li>")
        }
    })
    $(".file-item").click(function (elem) {
        console.log("try to open file: " + $(this).attr("path"));
        openFileByPath($(this).attr("path"))
    })
    $(".folder-item").click(function (elem) {
        console.log("try to open folder: " + $(this).attr("path"));
        openFolder($(this).attr("path"))
    })
    resetTree()
    $('body').find('.tree').fadeIn(0);
}

function reopenEditor() {
    if (editorContent.editor) {
        editorContent.editor.forEach(function (editor, id, arr) {
            if (!editor||editor==null||!editor.enabled)
                return null;
            else {
                $.ajax({
                    type: "POST",
                    url: "/download",
                    data: { file: editor.file },
                    success: function (data, status, XHR) {
                        var editorHandle = neweditor(id)
                        var ui = $("#e" + id + " .editorcursor")
                        var resizeable = $("#e" + id + " .editor")
                        console.log("open file: " + editor.file)
                        editorHandle.setValue(data)
                        try {
                            ui.offset(editorContent.editor[id].offset)
                            resizeable.css(editorContent.editor[id].size)
                            if (editorContent.editor[id].size.width < 50 || editorContent.editor[id].size.height < 50)
                                resizeable.css({width:50,height:50})
                        } catch (e) { }
                        syncButtons(id)
                    },
                    dataType: "text"
                });
                
            }
        })
    } else { 
        editorContent.editor = []
        saveEditorContent();
    }
}

function openFileByPath(path) { 
    $.ajax({
        type: "POST",
        url: "/download",
        data: { file: path },
        success: function (data, status, XHR) {
            openFile(path,data)
        },
        dataType: "text"
    });
}

function openFile(file,data) {
    editorContent = JSON.parse(localStorage.getItem("editorContent")) || {}
    editorIDCount = editorContent.editorIDCount || 0;
    editor = neweditor(editorIDCount)
    editor.setValue(data)
    editorContent.editor = editorContent.editor || []
    editorContent.editor[editorIDCount] = editorContent[editorIDCount] || {}
    editorContent.editor[editorIDCount].file = file;
    editorContent.editor[editorIDCount].id = editorIDCount;
    editorContent.editor[editorIDCount].enabled = true;
    editorContent.editorIDCount = ++editorIDCount;
    saveEditorContent()
}

function getElementByXPath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function uploadForm() {
    $('#uploadForm').submit(function (e) {
        e.preventDefault(); // Prevent default form submission

        var formData = new FormData(this); // 'this' refers to the form element

        $.ajax({
            url: '/upload', // Your Node.js upload endpoint
            type: 'POST',
            data: formData,
            processData: false, // Don't process the data
            contentType: false, // Don't set content type (FormData handles it)
            success: function (response) {
                console.log('Upload successful:', response);
                // Handle success (e.g., display message)
            },
            error: function (xhr, status, error) {
                console.error('Upload failed:', error);
                // Handle error
            }
        });
    });    
}

function downloadForm() {
    $('#downloadForm').submit(function (e) {
        e.preventDefault(); // Prevent default form submission

        //var formData = new FormData(this); // 'this' refers to the form element

        var formData = $(this).serializeArray();
        file = formData[0].value

        console.log(file)

        $.ajax({
            type: "POST",
            url: "/download",
            data: { file: file },
            success: function (data, status, XHR) {
                openTextInNewTab("file", data)
            },
            dataType: "text"
        });
    });
}

function saveFile(id) {
    try {
        file = JSON.parse(localStorage.getItem("editorContent")).editor[id].file
        content = ace.edit("editor"+id).getValue() 
        $.ajax({
            type: "POST",
            url: "/write",
            data: { file: file, content: content },
            success: function (data, status, XHR) {
                //alert("File saved: "+file)
                console.log("File saved: " + file)
            },
            dataType: "text"
        });
        
    } catch (e) { 
        console.log(e)
    }
}

function attachHTML(id, html) {
    document.getElementById(id).innerHTML = html;
}

function appendElement(id, html) {
    $(id).append(html);
}


function syncButtons(id) {
    var ui = $("#e" + id + " .editorcursor")
    $("#e" + id + " .editor").css({
        top: ui.offset().top - 1,
        left: ui.offset().left - 1
    })
    $("#e" + id + " .editorclose").css({
        top: ui.offset().top + 15,
        left: ui.offset().left
    })
    $("#e" + id + " .editorsave").css({
        top: ui.offset().top + 30,
        left: ui.offset().left
    })
    return ui;
}

function saveEditorContent(){
    localStorage.setItem("editorContent", JSON.stringify(editorContent))
    $.ajax({
        type: "POST",
        url: "/editorcontent",
        data: { content: JSON.stringify(editorContent) },
        success: function (data, status, XHR) {
            
        },
        dataType: "text"
    });
}

function neweditor(id) {
    elem = $("<div id='e" + id + "' class='ediv posabs'>").html($("#etemplate").html())
    $("#start").after(elem)
    $("#e" + id + " .editor").attr("id", "editor" + id);
    $("#e" + id + " .editorcursor").mousedown(function (e) {
        handle_mousedown($("#e" + id + " .editorcursor"), e, function () {
            var ui=syncButtons(id)
            editorContent.editor[id].offset = ui.offset()
            saveEditorContent();
        })
    });
    $("#e" + id + " .editorclose").click(function () {
        $("#e" + id).remove()
        try {
            actualID = editorContent.editor[id].id
            editorContent.editor[id].enabled = false
            console.log(editorContent.editor[id])                  
        } catch (e) { }
        saveEditorContent()
    })
    $("#e" + id + " .editorsave").click(function () {
        console.log("try to save tab id: " + id)
        saveFile(id)
    })
    //addFocusForKeyboard($("#e" + id + " .editor"))
    //editorContent.editor[id].enabled = true;
    
    /*
    $("#e" + id + " .editor").sizeChanged(function (last,current) { 
        editorContent.editor[id].size = { width: current.width, height: current.height };
        saveEditorContent()
    })

    myResizableDiv = document.getElementById('myResizableDiv');
    */
    myResizableDiv = $("#e" + id + " .editor")[0]
    resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            // console.log(`Div resized! New dimensions: ${width}px x ${height}px`);
            // Perform actions based on the new dimensions, e.g., update other elements, recalculate layouts.
            try {
                const { width, height } = entry.contentRect;
                width = Math.floor(width)
                height = Math.floor(height)
                editorContent.editor[id].size = { width: width, height: height };
                saveEditorContent()                
            }catch(e){}
        }
    });

    resizeObserver.observe(myResizableDiv);


    var editor = ace.edit("editor" + id);
    editor.setTheme("ace/theme/monokai"); // Example theme
    editor.session.setMode("ace/mode/javascript"); // Example mode
    editor.getSession().setValue('');
    editor.editorID = id;

    var ui = $("#e" + id + " .editorcursor")
    ui.offset({ top: 170, left: 20 })
    syncButtons(id)
    
    editor.on("focus", function () {
        currentFocusedEditorId = id;
    });
    
    return editor;
}

function dropzone2() {
    /*
    $('#dropzone').on({
        dragenter: function (e) {
            $(this).css('background-color', 'lightBlue');
        },
        dragleave: function (e) {
            $(this).css('background-color', 'white');
        },
        drop: function (e) {
            e.stopPropagation();
            e.preventDefault();
            console.log(e.dataTransfer.files);
        }
    });*/

    $("#dropzone").droppable({
        drop: function (event, ui) {
            // Logic to handle the dropped element (ui.draggable)
            ui.draggable.detach().appendTo($(this));
        }
    });
}

function dropzone() {
    
    // Get the drop zone element
    const dropZone = document.getElementById('dropzone');

    // Prevent default behavior for files dragged over the zone
    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    // Handle the dropped files and prevent default behavior
    dropZone.addEventListener('drop', function (e) {
        e.preventDefault(); // This is the crucial line

        // Access the files using the DataTransfer object
        const files = e.dataTransfer.files;

        // Your file processing logic goes here (e.g., upload, display, etc.)
        console.log('Files dropped:', files[0]);

        var formData = new FormData();
        // Append files from Dropzone's queue
        
        formData.append("myFile", files[0]);
        

        $.ajax({
            url: '/upload', // Your Node.js upload endpoint
            type: 'POST',
            data: formData,
            processData: false, // Don't process the data
            contentType: false, // Don't set content type (FormData handles it)
            success: function (response) {
                console.log('Upload successful:', response);
                // Handle success (e.g., display message)
            },
            error: function (xhr, status, error) {
                console.error('Upload failed:', error);
                // Handle error
            }
        });
        /*
        $.ajax({
            url: '/upload', // Your Node.js upload endpoint
            type: 'POST',
            data: { myFile: files[0] },
            processData: false, // Don't process the data
            contentType: false, // Don't set content type (FormData handles it)
            success: function (response) {
                console.log('Upload successful:', response);
                // Handle success (e.g., display message)
            },
            error: function (xhr, status, error) {
                console.error('Upload failed:', error);
                // Handle error
            }
        });*/
    });

    // It's also good practice to prevent the default action on the whole window
    // to avoid accidentally opening files dropped outside the specific drop zone.
    window.addEventListener('dragover', function (e) {
        e.preventDefault();
    });
    window.addEventListener('drop', function (e) {
        e.preventDefault();
    });

}

function scrollable() {
    const scrollableDiv = document.querySelector('.scrollable-div');

    scrollableDiv.addEventListener('wheel', (event) => {
        // Prevent default page scrolling if the div is scrollable
        if (scrollableDiv.scrollHeight > scrollableDiv.clientHeight) {
            event.preventDefault();
        }

        // Adjust scroll position based on wheel delta
        scrollableDiv.scrollTop += event.deltaY;
        // For horizontal scrolling: scrollableDiv.scrollLeft += event.deltaX;
    });
}

function onChange(input) {
    //document.querySelector(".input").value = input;
    console.log("Input changed", input);
}

function onKeyPress(button) {
    console.log("Button pressed", button);
    // Create a keydown event for the Enter key
    keyCode = button.charCodeAt(0)
    console.log(keyCode)
    var enterEvent = jQuery.Event("keydown");
    enterEvent.keyCode = keyCode;
    enterEvent.which = keyCode;
    if (button === "{shift}" || button === "{lock}")
        handleShift()
    else 
        insertCharToEditor("editor" + currentFocusedEditorId, button)

}

function handleShift() {
    let currentLayout = myKeyboard.options.layoutName;
    let shiftToggle = currentLayout === "default" ? "shift" : "default";

    myKeyboard.setOptions({
        layoutName: shiftToggle
    });
}


function addFocusForKeyboard(myInput) {
    myInput[0].addEventListener("focus", () => {
        myKeyboard.setInput(myInput[0].value); // Set keyboard's initial input to the field's current value
    });
}

function insertCharToEditor(editorId,char) { 
    // Assuming 'editor' is your Ace Editor instance
    var editor = ace.edit(editorId); // Replace "yourEditorId" with the ID of your editor's container

    // Get the current cursor position
    var cursorPosition = editor.getCursorPosition();

    // Define the character you want to insert
    var characterToInsert = char; // Or any other character

    // Insert the character at the cursor position
    editor.session.insert(cursorPosition, characterToInsert);
}

function onresize() { 
    $("#editorplus").css({ top: ($(window).height() - 30), left: 10 })
    $("#fileSelector").css({ top: ($(window).height() - 30), left: 100 })
    $("#voiceInput").css({ top: ($(window).height() - 30), left: 200 })
    $(".keyboard-wrapper").css({ top: ($(window).height() - 320) })
}

function attachVoiceRecognition() { 
    $('#startVoiceInput').on('click', function () {
        recognition.start(); // Start the speech recognition
    });

    $('#stopVoiceInput').on('click', function () {
        recognition.stop(); // Stop the speech recognition
    });
}

$(document).ready(async function () {
    await getEditorContent()

    uploadForm();
    downloadForm();
    dropzone();

    $("#editorplus").click(function () { 
        neweditor(++editorIDCount)
    })

    $("#selectFileButton").on("click", function () {
        $("#fileInput").trigger("click"); // Simulate a click on the hidden file input
    });

    $("#fileInput").on("change", function () {
        const selectedFile = this.files[0]; // Get the first selected file
        if (selectedFile) {
            console.log("Selected file name:", selectedFile.name);
            // You can then use the FileReader API to read the file's content if needed
            var formData = new FormData();
            // Append files from Dropzone's queue

            formData.append("myFile", selectedFile);


            $.ajax({
                url: '/upload', // Your Node.js upload endpoint
                type: 'POST',
                data: formData,
                processData: false, // Don't process the data
                contentType: false, // Don't set content type (FormData handles it)
                success: function (response) {
                    console.log('Upload successful:', response);
                    // Handle success (e.g., display message)
                },
                error: function (xhr, status, error) {
                    console.error('Upload failed:', error);
                    // Handle error
                }
            });
        }
    });

    Keyboard = window.SimpleKeyboard.default;

    myKeyboard = new Keyboard({
        onChange: input => onChange(input),
        onKeyPress: button => onKeyPress(button),
        theme: "hg-theme-default hg-layout-default myTheme1"
    });

    $(".keyboard-wrapper").mousedown(function (e) {
        handle_mousedown($(".keyboard-wrapper"), e, function () {
        })
    });

    reopenEditor()
    scrollable()
    openFolder('./')
    //addFocusForKeyboard($("#my-terminal"))
    attachVoiceRecognition()
    onresize()
    $(window).on('resize', function () {
        // Code to execute when the window is resized
        console.log("Window resized!");

        // Example: Get and display the new window dimensions
        var newWidth = $(window).width();
        var newHeight = $(window).height();
        console.log('New width: ' + newWidth + ', New height: ' + newHeight);

        // You can add more complex logic here, such as:
        // - Adjusting element sizes or positions
        // - Changing CSS properties based on window size
        // - Triggering other functions or events
        onresize();
    });
 });