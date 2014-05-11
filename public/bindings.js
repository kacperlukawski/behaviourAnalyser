/**
 * @param {jQuery} $
 * @param {SVG} SVG
 */
(function($) {
    $(document).ready(function() {
        var nodeMenu = {
            node: null,
            menu: $('#menu'),
            options: {
                'Get all cycles from selected node': '#/api/cycles/{_id}'
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

                for (var description in this.options) {
                    var linkHref = this.options[description];
                    for (var key in this.node) {
                        linkHref = linkHref.replace('{' + key + '}', this.node[key])
                    }

                    var listItem = $('<li></li>');
                    var optionLink = $('<a></a>').html(description).attr('href', linkHref).click(function(){
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
            if (requestedAddress) {
                $.getJSON(requestedAddress, function(data) {
                    var nodesUccurences = {};
                    var connectionsOccurences = {};
                    var nodes = [];
                    var connections = [];
                    for (var pathIdx = 0; pathIdx < data.results.length; pathIdx++) {
                        var path = data.results[pathIdx];

                        for (var nodeIdx in path.nodes) {
                            var node = path.nodes[nodeIdx];
                            if (!nodesUccurences[node._id]) {
                                nodesUccurences[node._id] = true;
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
                });
            } else {
                $.getJSON('/api/all', function(events) {
                    $.getJSON('/api/connections', function(connections) {
                        var nodesPositions = graph.calculateNodesPositions(events.results, connections.results);

                        events.results.forEach(function(node, i) {
                            var nodeVertex = graph.drawNode(node.event._id, node.event._e, node.event, nodesPositions[i].x, nodesPositions[i].y);
                            nodeVertex.click(onNodeClick(node.event));
                        });

                        connections.results.forEach(function(connection, i) {
                            var connectionEdge = graph.drawConnection(connection.from._id, connection.to._id, connection.attributes);
                            connectionEdge.mouseover(onEdgeMouseOver(connection.attributes));
                        });

                        graph.adaptSize();
                    });
                });
            }
        });

        $(window).trigger('hashchange');
    });
})(jQuery);