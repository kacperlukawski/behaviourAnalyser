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

    var graph = SVG('graph');

    var getNodeId = function(id) {
        return 'node_' + id;
    };

    var calculateNodesPositions = function(nodesCount) {
        var results = [];
        for (var i = 0; i < nodesCount; i++) {
            results.push({
                x: ((i + 1) * 100),
                y: ((i + 1) * 100)
            });
        }

        return results;
    };

    var drawNode = function(node, x, y) {
        var nodeBackground = graph.ellipse(150, 75)
                .move(x, y)
                .attr('id', getNodeId(node._id));

        var nodeLabel = graph.text(node._id)
                .font(fontSettings)
                .move(x + 75, y + 25)
                .fill(nodeLabelFontColor);
    };

    var drawConnection = function(connection) {
        var startNodeBackground = SVG.get(getNodeId(connection.from._id));
        var endNodeBackground = SVG.get(getNodeId(connection.to._id));

        if (startNodeBackground && endNodeBackground) {
            var startXPosition = startNodeBackground.cx();
            var startYPosition = startNodeBackground.cy() + startNodeBackground.height() / 2;
            var endXPosition = endNodeBackground.cx();
            var endYPosition = endNodeBackground.cy() - endNodeBackground.height() / 2;
            var arrow = graph.line(startXPosition, startYPosition, endXPosition, endYPosition)
                    .stroke(arrowSettings);
            //.back();        
        }
    };

    var drawGraph = function(nodes, connections) {
        var nodesPositions = calculateNodesPositions(nodes.length);

        nodes.forEach(function(node, i) {
            drawNode(node, nodesPositions[i].x, nodesPositions[i].y);
        });

        connections.forEach(function(connection, i) {
            drawConnection(connection);
        });
    };

    drawGraph([
        {'_id': 'lorem'},
        {'_id': 'ipsum'}
    ], [
        {'from': 'lorem', 'to': 'ipsum', attributes: {
                'lorem': 0.75,
                'ipsum': 1.0,
                'dolor': 70
            }},
        {'from': 'ipsum', 'to': 'lorem', attributes: {
                'lorem': 0.75,
                'ipsum': 1.0,
                'dolor': 70
            }}
    ]);
});