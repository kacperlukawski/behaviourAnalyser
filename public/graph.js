(function(window) {
    window.svgGraph = function(graphParentId) {
        return {
            graphParentId: graphParentId,
            nodeLabelFontColor: '#fff',
            arrowSettings: {
                width: 3,
                color: '#ccc'
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
                var startYPosition = startNodeBackground.cy();// + startNodeBackground.height() / 2;
                var endXPosition = endNodeBackground.cx();
                var endYPosition = endNodeBackground.cy();// - endNodeBackground.height() / 2;

                var arrow = graph.graph.line(startXPosition, startYPosition, endXPosition, endYPosition);
                arrow.stroke(graph.arrowSettings);
                arrow.attr('app-from', fromId);
                arrow.attr('app-to', toId);
                arrow.attr('app-data', JSON.stringify(attributes));
                arrow.back();
                
                graph.connections.push(arrow);

                return arrow;
            },
            adaptSize: function() {
                var graph = this;
                var bbox = graph.graph.bbox();
                $('#' + graph.graphParentId).css({
                    width: bbox.width,
                    height: bbox.height + 120
                });
            },
            clear: function(){
                this.nodes.forEach(function(node){
                    node.remove();
                });
                
                this.connections.forEach(function(connection){
                    connection.remove();
                });
                
                this.nodes = this.connections = [];
            }
        };
    };
})(window || this);