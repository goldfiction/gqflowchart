import * as PIXI from 'pixi.js';

async function main() {

    // Initialize the PixiJS application
    const app = new PIXI.Application();
    await app.init({ backgroundAlpha: 0, resizeTo: window });
    document.body.appendChild(app.canvas);

    // Create a Graphics object
    const plate = new PIXI.Graphics();

    // Define the plate's properties
    const plateColor = 0x11CCCC; // Light gray color
    const plateAlpha = 0.8;    // 50% transparency
    const plateX = 100;
    const plateY = 100;
    const plateWidth = 200;
    const plateHeight = 100;

    // Draw the transparent plate
    plate.beginFill(plateColor, plateAlpha);
    plate.drawRect(plateX, plateY, plateWidth, plateHeight);
    plate.endFill();

    // Add the plate to the stage
    app.stage.addChild(plate);

    // You can also add a transparent border (lineStyle)
    const borderColor = 0x333333; // Dark gray border
    const borderAlpha = 0.7;
    const borderWidth = 2;

    plate.lineStyle(borderWidth, borderColor, borderAlpha);
    plate.drawRect(plateX, plateY, plateWidth, plateHeight); // Redraw the rectangle to apply the border
}

main()