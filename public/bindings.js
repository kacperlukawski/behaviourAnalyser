/**
 * @param {jQuery} $
 * @param {SVG} SVG
 */
(function($) {
    $(document).ready(function() {
        var nodeMenu = {
            node: null,
            availableNodes: null,
            menu: $('#menu'),
            options: {
                'Get all cycles from selected node': '#/api/cycles/{_id}',
                'Get most probable move from selected node': '#/api/mostProbableMove/{_id}'
            },
            setCurrentNode: function(node) {
                this.node = node;
            },
            display: function(e) {
                this.menu.find('ul li').remove();

                for (var key in this.node) {
                    if (key[0] === '_') {
                        // do not display internal fields of the nodes
                        // which names start with underscore
                        continue;
                    }

                    var listItem = $('<li></li>');
                    listItem.append($('<b></b>').html(key));
                    listItem.append(' ' + this.node[key]);
                    this.menu.find('ul').append(listItem);
                }

                var options = this.options;

                for (var id in this.availableNodes) {
                    if (!id || !this.availableNodes[id]._id || this.availableNodes[id]._id === this.node._id) {
                        continue;
                    }

                    var nodeDescription = '';
                    for (var key in this.availableNodes[id]) {
                        if (key === '_id' || key === '_parent') {
                            continue;
                        }

                        nodeDescription = nodeDescription + ' ' + key + ' = "' + this.availableNodes[id][key] + '"';
                    }
                    nodeDescription = nodeDescription.trim();

                    console.log(this.availableNodes[id]);

                    Object.defineProperty(options, 'Get shortest path to (' + nodeDescription + ')', {
                        '__proto__': null,
                        'value': '#/api/shortestPath/{_id}/' + this.availableNodes[id]._id,
                        'enumerable': true
                    });

                    Object.defineProperty(options, 'Get most probable path to (' + nodeDescription + ')', {
                        '__proto__': null,
                        'value': '#/api/mostProbablePath/{_id}/' + this.availableNodes[id]._id,
                        'enumerable': true
                    });
                }

                for (var description in options) {
                    var linkHref = options[description];
                    for (var key in this.node) {
                        linkHref = linkHref.replace('{' + key + '}', this.node[key])
                    }

                    var listItem = $('<li></li>');
                    var optionLink = $('<a></a>').html(description).attr('href', linkHref).click(function() {
                        $(this).parent('li').parent('ul').parent('div').css('display', 'none');
                    });
                    listItem.append(optionLink);
                    this.menu.find('ul').append(listItem);
                }

                this.menu.css({
                    left: e.pageX,
                    top: e.pageY,
                    display: 'block'
                });
            }
        };

        var connectionMenu = {
            connection: null,
            menu: $('#description'),
            setCurrentConnection: function(connection) {
                this.connection = connection;
            },
            display: function(e) {
                this.menu.find('ul li').remove();

                for (var key in this.connection) {
                    var listItem = $('<li></li>');
                    listItem.append($('<b></b>').html(key));
                    listItem.append(' ' + this.connection[key]);
                    this.menu.find('ul').append(listItem);
                }
            }
        };

        var onNodeClick = function(attributes) {
            return function(e) {
                nodeMenu.setCurrentNode(attributes);
                nodeMenu.display(e);
            };
        };

        var onEdgeMouseOver = function(attributes) {
            return function(e) {
                connectionMenu.setCurrentConnection(attributes);
                connectionMenu.display(e);
            };
        };

        $('.close').click(function() {
            $(this).parent('div').css('display', 'none');
            return false;
        });

        var graph = svgGraph('graph');
        $(window).on('hashchange', function() {
            var requestedAddress = location.hash.replace(/^#/, '');

            graph.clear();
            if (!requestedAddress || requestedAddress.length === 0) {
                // by default loads full graph
                requestedAddress = '/api/all';
            }

            $.getJSON(requestedAddress, function(data) {
                var nodesOccurences = {};
                var connectionsOccurences = {};
                var nodes = [];
                var connections = [];
                for (var pathIdx = 0; pathIdx < data.results.length; pathIdx++) {
                    var path = data.results[pathIdx];

                    for (var nodeIdx in path.nodes) {
                        var node = path.nodes[nodeIdx];
                        if (!nodesOccurences[node._id]) {
                            nodesOccurences[node._id] = true;
                            nodes.push(node);
                        }
                    }

                    for (var connectionIdx = 0; connectionIdx < path.connections.length; connectionIdx++) {
                        var fromNode = path.nodes[connectionIdx];
                        var toNode = path.nodes[connectionIdx + 1];

                        if (!connectionsOccurences[fromNode._id + '_' + toNode._id]) {
                            var connection = {
                                'from': fromNode,
                                'to': toNode,
                                'attributes': path.connections[connectionIdx]
                            };

                            connectionsOccurences[fromNode._id + '_' + toNode._id] = true;
                            connections.push(connection);
                        }
                    }
                }

                var nodesPositions = graph.calculateNodesPositions(nodes, connections);

                nodes.forEach(function(node, i) {
                    var nodeVertex = graph.drawNode(node._id, node._e, node, nodesPositions[i].x, nodesPositions[i].y);
                    nodeVertex.click(onNodeClick(node));
                });

                connections.forEach(function(connection, i) {
                    var connectionEdge = graph.drawConnection(connection.from._id, connection.to._id, connection.attributes);
                    connectionEdge.mouseover(onEdgeMouseOver(connection.attributes));
                });

                graph.adaptSize();

                nodeMenu.availableNodes = nodes;
            });

            // scroll window to top
            $(window).scrollTop(0);
        });

        $(window).trigger('hashchange');
    });
})(jQuery);