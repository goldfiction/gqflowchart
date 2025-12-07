// Create a new SpeechRecognition object
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Configure recognition settings (e.g., language, continuous listening)
recognition.continuous = true;
recognition.lang = 'en-US';

// Event handlers for recognition
recognition.onstart = function () {
    // Handle when recognition starts (e.g., update UI)
    console.log('Voice recognition started.');
};

recognition.onresult = function (event) {
    // Process the speech recognition result
    const transcript = event.results[event.results.length - 1][0].transcript;
    // Use jQuery to update an input field or display the text
    //$('#myInputField').val(transcript);
    console.log(transcript)
};

recognition.onerror = function (event) {
    // Handle errors during recognition
    console.error('Speech recognition error:', event.error);
};

recognition.onend = function () {
    // Handle when recognition ends
    console.log('Voice recognition ended.');
};

/*
$(document).ready(function () {
    $('#startVoiceInput').on('click', function () {
        recognition.start(); // Start the speech recognition
    });

    $('#stopVoiceInput').on('click', function () {
        recognition.stop(); // Stop the speech recognition
    });
});*/