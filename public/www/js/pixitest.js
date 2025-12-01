// main.js
const app = new PIXI.Application();

// Initialize the application with desired options (e.g., background color, size)
app.init({
    background: '#272822',
    resizeTo: window // Make the canvas fill the window
}).then(async () => {
    // Append the application's canvas to the document body
    document.body.appendChild(app.canvas);

    // Now you can start adding elements to the stage
    // For example, create and add a sprite:
    // const texture = PIXI.Texture.from('path/to/your/image.png');
    // const sprite = new PIXI.Sprite(texture);
    // app.stage.addChild(sprite);

    // Load the animation sprite sheet
    const spritesheet = await PIXI.Assets.load(
        'https://pixijs.com/assets/spritesheet/0123456789.json',
    );

    // Create an array to store the textures
    const textures = [];
    let i;

    for (i = 0; i < 10; i++) {
        const framekey = `0123456789 ${i}.ase`;
        const texture = PIXI.Texture.from(framekey);
        const time = spritesheet.data.frames[framekey].duration;

        textures.push({ texture, time });
    }

    const scaling = 4;

    // Create a slow AnimatedSprite
    const slow = new PIXI.AnimatedSprite(textures);

    slow.anchor.set(0.5);
    slow.scale.set(scaling);
    slow.animationSpeed = 0.5;
    slow.x = (app.screen.width - slow.width) / 2;
    slow.y = app.screen.height / 2;
    slow.play();
    app.stage.addChild(slow);

    // Create a fast AnimatedSprite
    const fast = new PIXI.AnimatedSprite(textures);

    fast.anchor.set(0.5);
    fast.scale.set(scaling);
    fast.x = (app.screen.width + fast.width) / 2;
    fast.y = app.screen.height / 2;
    fast.play();
    app.stage.addChild(fast);

    // Start animating
    app.start();
});