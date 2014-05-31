(function(window) {
    window.svgGraph = function(graphParentId) {
        return {
            graphParentId: graphParentId,
            nodeLabelFontColor: '#fff',
            connectionLineSettings: {
                width: 3,
                color: '#ccc'
            },
            connectionArrowSettings: {
                width: 1,
                color: '#ddd'
            },
            fontSettings: {
                family: 'Helvetica',
                size: 14,
                anchor: 'middle',
                leading: '1.5em'
            },
            /**
             * SVG document
             */
            graph: SVG(graphParentId).fixSubPixelOffset(),
            nodes: [],
            connections: [],
            others: [],
            /**
             * Generates HTML id of the node
             * @param {String} id
             * @returns {String}
             */
            getNodeId: function(id) {
                return 'node_' + id;
            },
            /**
             * Calculates position of each node
             * @param {type} nodes
             * @param {type} connections
             * @returns {Array}
             */
            calculateNodesPositions: function(nodes, connections) {
                var results = [];

                var nodesInputConnectionsCount = [];
                var nodesOutputConnectionsCount = [];
                for (var nodeIdx in nodes) {
                    var node = nodes[nodeIdx];
                    var nodeId = node.event ? node.event._id : node._id;
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

                var maxWidth = 1000;
                var nodesInLine = 4;
                var linesNodesCount = {};
                for (var i = 0; i < nodes.length; i++) {
                    results.push({
                        x: (i % nodesInLine) * (maxWidth / nodesInLine),
                        y: parseInt(i / nodesInLine) * 350
                    });
                }

                return results;
            },
            /**
             * Draws node in given position
             * @param {String} id
             * @param {String} label
             * @param {Object} attributes
             * @param {Int} x
             * @param {Int} y
             * @returns {Object}
             */
            drawNode: function(id, label, attributes, x, y) {
                var graph = this;
                var nodeId = graph.getNodeId(id);

                var nodeVertex = graph.graph.ellipse(150, 75)
                        .move(x, y)
                        .attr('id', nodeId)
                        .attr('app-data', JSON.stringify(attributes))
                        .attr('app-x-pos', x)
                        .attr('app-y-pos', y);

                if (label) {
                    graph.graph.text(label)
                            .font(graph.fontSettings)
                            .move(x + 75, y + 25)
                            .fill(graph.nodeLabelFontColor);
                }

                graph.nodes.push(nodeVertex);

                return nodeVertex;
            },
            /**
             * Draws a connection by given parameters             
             * @param {String} fromId
             * @param {String} toId
             * @param {Object} attributes
             * @returns {Object}      
             */
            drawConnection: function(fromId, toId, attributes) {
                var graph = this;
                var startNodeBackground = SVG.get(graph.getNodeId(fromId));
                var endNodeBackground = SVG.get(graph.getNodeId(toId));

                var startXPosition = startNodeBackground.cx();
                var startYPosition = startNodeBackground.cy() + startNodeBackground.height() / 2;
                var direction = (startNodeBackground.cy() - endNodeBackground.cy() > 0) ? 1 : -1;
                var endXPosition = endNodeBackground.cx();
                var endYPosition = endNodeBackground.cy() + direction * endNodeBackground.height() / 2;

                var nodesDifference = endXPosition - startXPosition;
                if (nodesDifference === 0) {
                    nodesDifference = endYPosition - startYPosition;
                }
                var directionCoeff = nodesDifference / Math.abs(nodesDifference);
                var middleXPosition = (startXPosition + endXPosition) / 2 + directionCoeff * 100;
                var middleYPosition = (startYPosition + endYPosition) / 2;

                var connectionLine = graph.graph.polyline([
                    [startXPosition, startYPosition],
                    [middleXPosition, middleYPosition],
                    [endXPosition, endYPosition]]
                        );
                connectionLine.fill('none');
                connectionLine.stroke(graph.connectionLineSettings);
                connectionLine.attr('app-from', fromId);
                connectionLine.attr('app-to', toId);
                connectionLine.attr('app-data', JSON.stringify(attributes));
                connectionLine.back();

                graph.connections.push(connectionLine);
                graph.drawConnectionArrow(middleXPosition, middleYPosition, endXPosition, endYPosition);

                return connectionLine;
            },
            /**
             * Draws an arrow at the end of the connection between nodes
             * @param {Int} startXPosition
             * @param {Int} startYPosition
             * @param {Int} endXPosition
             * @param {Int} endYPosition
             */
            drawConnectionArrow: function(startXPosition, startYPosition, endXPosition, endYPosition) {
                var graph = this;

                if (endXPosition === startXPosition) {
                    // there is a special case, because both points has the same
                    // x value
                    return;
                }

                var distance = 20;
                var direction = (startYPosition - endYPosition > 0) ? 1 : -1;

                var oldACoeff = (endYPosition - startYPosition) / (endXPosition - startXPosition);
                var oldBCoeff = endYPosition - oldACoeff * endXPosition;

                var newACoeff = (oldACoeff === 0) ? 0 : -1 / oldACoeff;
                var newBCoeff = (oldACoeff - newACoeff) * endXPosition + oldBCoeff + direction * distance;

                var centerXPosition = (newBCoeff - oldBCoeff) / (oldACoeff - newACoeff);
                var points = graph.getEquidistantPoints(newACoeff, newBCoeff, centerXPosition, distance);

                var arrow = graph.graph.polyline([
                    [endXPosition, endYPosition],
                    [points[0], newACoeff * points[0] + newBCoeff],
                    [points[1], newACoeff * points[1] + newBCoeff]
                ]);
                arrow.fill(graph.connectionArrowSettings.color);
                arrow.stroke(graph.connectionArrowSettings);
                arrow.back();
                graph.others.push(arrow);

                return arrow;
            },
            /**
             * Gets x coefficents of points that lay in the given line and have the same distance to the specified point
             * @param {Float} aCoeff
             * @param {Float} bCoeff
             * @param {Float} x
             * @param {Float} distance
             * @returns {Array}
             */
            getEquidistantPoints: function(aCoeff, bCoeff, x, distance) {
                var y = aCoeff * x + bCoeff;
                var a = Math.pow(aCoeff, 2.0) + 1;
                var b = -2 * x - 2 * y * aCoeff + 2 * aCoeff * bCoeff;
                var c = Math.pow(x, 2.0) + Math.pow(y, 2.0) - 2 * y * bCoeff + Math.pow(bCoeff, 2.0) - Math.pow(distance / 2, 2.0);
                var delta = Math.pow(b, 2.0) - 4 * a * c;

                var results = [];

                if (delta < 0) {
                    return results;
                }

                var deltaSqrt = Math.sqrt(delta);

                results.push((-b - deltaSqrt) / (2 * a));
                results.push((-b + deltaSqrt) / (2 * a));
                return results;
            },
            /**
             * Adapts size of the image
             */
            adaptSize: function() {
                var graph = this;
                var bbox = graph.graph.bbox();
                $('#' + graph.graphParentId).css({
                    width: bbox.width,
                    height: bbox.height + 120
                });
            },
            /**
             * Cleans up the image
             */
            clear: function() {
                this.nodes.forEach(function(node) {
                    node.remove();
                });

                this.connections.forEach(function(connection) {
                    connection.remove();
                });

                this.others.forEach(function(other) {
                    other.remove();
                });

                this.nodes = this.connections = this.others = [];
            }
        };
    };
})(window || this);