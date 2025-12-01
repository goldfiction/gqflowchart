(function () {
    'use strict';

    const Container = PIXI.Container,
        autoDetectRenderer = PIXI.autoDetectRenderer,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Sprite = PIXI.Sprite,
        Point = PIXI.Point,
        width = window.innerWidth,
        height = window.innerHeight;

    const renderer = autoDetectRenderer(width, height),
        stage = new Container();

    document.body.appendChild(renderer.view);

    loader
        .add('pixel', 'https://pbs.twimg.com/profile_images/751168765191081988/3y6h5fRA.jpg')
        .load(go);

    function go() {
        const pixelContainer = new Container(),
            pixel = new Sprite(resources.pixel.texture);

        pixelContainer.name = 'pixelContainer';
        pixelContainer.interactive = true;
        pixelContainer.on('mousedown', event => {
            console.log(`Container clicked (${pixelContainer.name})`);
        });

        pixel.name = 'pixel';
        pixel.width = width;
        pixel.height = height;
        pixel.interactive = true;
        pixel.on('mousedown', event => {
            console.log(`Sprite clicked (${pixel.name})`);
        });

        pixelContainer.addChild(pixel);
        stage.addChild(pixelContainer);

        renderer.render(stage);

        setTimeout(simulateClick, 3000);
    }

    const el = document.querySelector('canvas');

    el.addEventListener('click', event => {
        console.log('Canvas clicked');
    });

    function simulateClick(mode) {
        const x = 10,
            y = 10,
            ev = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true,
                'clientX': x,
                'clientY': y
            });

        if (mode) document.elementFromPoint(x, y).dispatchEvent(ev);
        else el.dispatchEvent(ev);
    };
})();
