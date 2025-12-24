// main.js
const app = new PIXI.Application();

// Initialize the application with desired options (e.g., background color, size)
app.init({
    background: '#272822',
    resizeTo: window // Make the canvas fill the window
}).then(async () => {
    // Append the application's canvas to the document body
    document.body.appendChild(app.canvas);
});