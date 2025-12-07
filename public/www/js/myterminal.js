function openTextInNewTab(title, content) {
    var newWindow = window.open("", "_blank"); // Open a new blank tab
    if (newWindow) {
        newWindow.document.write(content);
        newWindow.document.close(); // Close the document stream
    } else {
        alert("Popup blocked! Please allow popups for this site to view the content in a new tab.");
    }
}

function scrollBottom() {
    setTimeout(function () {
        myDiv = document.getElementById('terminalgroup');
        //myDiv.scrollTop = myDiv.scrollHeight; 

        myDiv.scrollTo({
            top: myDiv.scrollHeight,
            behavior: 'smooth'
        });        
    },20)
}

$(function () {
    $('#my-terminal').terminal(function (command) {
        if (command === 'hello') {
            this.echo('Hello, world!');
        } else if (command === 'help') {
            this.echo('Available commands: open, download, hello, help and shell command');
        } else if (command.indexOf('open') != -1) { 
            file = command.split(' ').slice(1).join(' ')
            console.log("open file: " + file)
            $.ajax({
                type: "POST",
                url: "/download",
                data: { file: file },
                success: function (data, status, XHR) {
                    openFile(file, data)
                    scrollBottom()
                },
                dataType: "text"
            });
        } else if (command.indexOf('download') != -1) { 
            file = command.split(' ').slice(1).join(' ')
            console.log("download file: "+file)
            $.ajax({
                type: "POST",
                url: "/download",
                data: { file:file },
                success: function (data, status, XHR) {
                    openTextInNewTab("file", data)
                    scrollBottom()
                },
                dataType: "text"
            });
        } else {
            var that=this
            $.ajax({
                type: "POST",
                url: "/cmd",
                data: { command: command },
                success: function (data, status, XHR) { 
                    console.log(data);
                    that.echo(data);
                    scrollBottom()
                },
                dataType: "text"
            });

        }

    }, {
        greetings: 'Welcome to your simulated terminal!',
        prompt: 'user@web-terminal:~$'
    });
});