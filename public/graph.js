$(document).ready(function() {
    var nodeLabelFontColor = '#fff';
    var arrowSettings = {
        width: 3,
        color: '#ccc'
    };
    var fontSettings = {
        family: 'Helvetica',
        size: 14,
        anchor: 'middle',
        leading: '1.5em'
    };

    var nodeMenu = {
        node: null,
        menu: $('#menu'),
        setCurrentNode: function(node) {
            this.node = node;
        },
        display: function(e) {
            this.menu.find('ul li').remove();

            for (var key in this.node) {
                var listItem = $('<li></li>');
                listItem.append($('<b></b>').html(key));
                listItem.append(' ' + this.node[key]);
                this.menu.find('ul').append(listItem);
            }

            this.menu.css({
                left: e.pageX,
                top: e.pageY,
                display: 'block'
            });
        }
    };

    var graph = SVG('graph')
            .fixSubPixelOffset()
            /*.size('100%', '100%')
             .attr()*/;

    /**
     * Generates HTML id of the node
     * @param {String} id
     * @returns {String}
     */
    var getNodeId = function(id) {
        return 'node_' + id;
    };

    /**
     * Calculates position of each node
     * @param {type} nodes
     * @param {type} connections
     * @returns {Array}
     */
    var calculateNodesPositions = function(nodes, connections) {
        var results = [];

        var nodesInputConnectionsCount = [];
        var nodesOutputConnectionsCount = [];
        for (var nodeIdx in nodes) {
            var node = nodes[nodeIdx];
            var nodeId = node.event._id;
            var inputConnectionsCount = 0;
            var outputConnectionsCount = 0;

            connections.forEach(function(connection) {
                if (connection.from._id === nodeId) {
                    outputConnectionsCount++;
                }

                if (connection.to._id === nodeId) {
                    inputConnectionsCount++;
                }
            });

            nodesInputConnectionsCount.push(inputConnectionsCount);
            nodesOutputConnectionsCount.push(outputConnectionsCount);
        }

        var maxValue = Math.max.apply(null, nodesInputConnectionsCount);
        var maxIndex = nodesInputConnectionsCount.indexOf(maxValue);

        console.log(nodesInputConnectionsCount);
        console.log(nodesOutputConnectionsCount);

        var linesNodesCount = {};
        for (var i = 0; i < nodes.length; i++) {
            if (nodesInputConnectionsCount[i] === 0) {
                if (!linesNodesCount[0]) {
                    linesNodesCount[0] = 0;
                }

                results.push({
                    x: (linesNodesCount[0] * 200),
                    y: 0,
                });

                linesNodesCount[0]++;

                continue;
            }

            results.push({
                x: ((i + 1) * 100) % 1000,
                y: ((i + 1) * 100) % 1500
            });
        }

        return results;
    };

    /**
     * Draws node in given position
     * @param {Object} node
     * @param {Int} x
     * @param {Int} y
     */
    var drawNode = function(node, x, y) {
        var nodeId = getNodeId(node.event._id);

        graph.ellipse(150, 75)
                .move(x, y)
                .attr('id', nodeId)
                .attr('app-x-pos', x)
                .attr('app-y-pos', y)
                .click(function(e) {
                    nodeMenu.setCurrentNode(node.event);
                    nodeMenu.display(e);
                });

        if (node.event._e) {
            graph.text(node.event._e)
                    .font(fontSettings)
                    .move(x + 75, y + 25)
                    .fill(nodeLabelFontColor);
        }
    };

    /**
     * Draws a connection by given parameters
     * @param {Object} connection
     */
    var drawConnection = function(connection) {
        var startNodeBackground = SVG.get(getNodeId(connection.from._id));
        var endNodeBackground = SVG.get(getNodeId(connection.to._id));

        if (startNodeBackground && endNodeBackground) {
            var startXPosition = startNodeBackground.cx();
            var startYPosition = startNodeBackground.cy();// + startNodeBackground.height() / 2;
            var endXPosition = endNodeBackground.cx();
            var endYPosition = endNodeBackground.cy();// - endNodeBackground.height() / 2;
            
            var arrow = graph.line(startXPosition, startYPosition, endXPosition, endYPosition);
            arrow.stroke(arrowSettings)
            arrow.back()
            arrow.attr('app-data', JSON.stringify(connection))
            arrow.mouseover(function() {
                $('#description').html(this.attr('app-data'))
            });
        }
    };

    var drawGraph = function(nodes, connections) {
        var nodesPositions = calculateNodesPositions(nodes, connections);

        nodes.forEach(function(node, i) {
            drawNode(node, nodesPositions[i].x, nodesPositions[i].y);
        });

        connections.forEach(function(connection, i) {
            drawConnection(connection);
        });
    };

    $.getJSON('/api/all', function(events) {
        $.getJSON('/api/connections', function(connections) {
            drawGraph(events.results, connections.results);

            var bbox = graph.bbox();
            $('#graph').css({
                width: bbox.width,
                height: bbox.height
            });
        });
    });
    
    $('.close').click(function(){
        $(this).parent('div').css('display', 'none');
        return false;
    });

//    $(window).hashchange(function(){
//        console.log('lorem ipsum');
//    });
});