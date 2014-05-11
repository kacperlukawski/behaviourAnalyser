/**
 * @param {jQuery} $
 * @param {SVG} SVG
 */
(function($) {
    $(document).ready(function() {
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

        $.getJSON('/api/all', function(events) {
            $.getJSON('/api/connections', function(connections) {
                var graph = svgGraph('graph');
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

        $('.close').click(function() {
            $(this).parent('div').css('display', 'none');
            return false;
        });

//    $(window).hashchange(function(){
//        console.log('lorem ipsum');
//    });
    });
})(jQuery);