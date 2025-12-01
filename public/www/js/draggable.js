function handle_mousedown(elem,e,cb) {

    window.my_dragging = {};
    my_dragging.pageX0 = e.pageX;
    my_dragging.pageY0 = e.pageY;
    my_dragging.elem = this;
    my_dragging.offset0 = elem.offset();

    function handle_dragging(e) {
        var left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
        var top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
        $(elem)
            .offset({ top: top, left: left });
        if (cb) cb(e);
    }

    function handle_mouseup(e) {
        $('body')
            .off('mousemove', handle_dragging)
            .off('mouseup', handle_mouseup);
        if (cb) cb(e);
    }

    $('body')
        .on('mouseup', handle_mouseup)
        .on('mousemove', handle_dragging);
}

//$('#b').mousedown(handle_mousedown);