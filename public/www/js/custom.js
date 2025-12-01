var content = localStorage.getItem('editorContent')
var editorContent = null;
var editorIDCount = 0;
if (!content) { 
    editorContent = {}
    editorContent.editor = []
    editorContent.editorIDCount = 0
    editorIDCount = editorContent.editorIDCount;
    localStorage.setItem('editorContent',JSON.stringify(editorContent))
}
else { 
    editorContent = JSON.parse(content)
    editorContent.editorIDCount = editorContent.editorIDCount || 0
    editorIDCount = editorContent.editorIDCount;
    editorContent.editor = editorContent.editor.filter(item => item !== null)
}

function reopenEditor() {
    if (editorContent.editor) {
        editorContent.editor.forEach(function (editor, id, arr) {
            var editorHandle = neweditor(id)
            console.log("open file: " + editor.file)
            $.ajax({
                type: "POST",
                url: "/download",
                data: { file: editor.file },
                success: function (data, status, XHR) {
                    editorHandle.setValue(data)
                },
                dataType: "text"
            });
        })
    } else { 
        editorContent.editor = []
        localStorage.setItem("editorContent",JSON.stringify(editorContent))
    }
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
    editorContent.editorIDCount = ++editorIDCount;
    localStorage.setItem("editorContent", JSON.stringify(editorContent))
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
                alert("File saved: "+file)
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
}

function neweditor(id) {
    elem = $("<div id='e" + id + "' class='ediv posabs'>").html($("#etemplate").html())
    $("#start").after(elem)
    $("#e" + id + " .editor").attr("id", "editor" + id);
    $("#e" + id + " .editorcursor").mousedown(function (e) {
        handle_mousedown($("#e" + id + " .editorcursor"), e, function () {
            syncButtons(id)
        })
    });
    $("#e" + id + " .editorclose").click(function () {
        $("#e" + id).remove()
        actualID = editorContent.editor[id].id
        editorContent.editor = editorContent.editor.filter(item => item.id != actualID)
        console.log(editorContent)
        localStorage.setItem("editorContent", JSON.stringify(editorContent))
        
    })
    $("#e" + id + " .editorsave").click(function () {
        console.log("try to save tab id: " + id)
        saveFile(id)
    })
    var editor = ace.edit("editor" + id);
    editor.setTheme("ace/theme/monokai"); // Example theme
    editor.session.setMode("ace/mode/javascript"); // Example mode
    editor.getSession().setValue('');
    editor.editorID = id;

    var ui = $("#e" + id + " .editorcursor")
    ui.offset({ top: 170, left: 20 })
    syncButtons(id)
    return editor;
}


$(document).ready(function () {

    uploadForm();
    downloadForm();

    $("#editorplus").css({ top: ($(window).height() - 30), left: 10 })
    $("#editorplus").click(function () { 
        editorIDCount++
        neweditor(editorIDCount)
    })

    $("#fileSelector").css({ top: ($(window).height() - 30), left: 50 })
    $("#selectFileButton").on("click", function () {
        $("#fileInput").trigger("click"); // Simulate a click on the hidden file input
    });

    $("#fileInput").on("change", function () {
        const selectedFile = this.files[0]; // Get the first selected file
        if (selectedFile) {
            console.log("Selected file name:", selectedFile.name);
            // You can then use the FileReader API to read the file's content if needed
        }
    });

    reopenEditor()
 });