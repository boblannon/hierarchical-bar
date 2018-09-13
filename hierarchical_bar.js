
var w = 960,
    h = 6000,
    i = 50,
    barHeight = 20,
    barWidth = w * .8,
    indent = barHeight/4,
    triangleBase = barHeight/2,
    maxBar = 670,
    duration = 400,
    root;

var st_data;
var mykeys = [];
var mytree;

var x_scale;

var colorScale;
colorScale = d3.scale.ordinal().domain([1,2,3]).range(['#006D2C','#31A354','#74C476']);

var grayScale;
grayScale = d3.scale.ordinal().domain([1,2,3]).range([0.3,0.2,0.1]);

var tree = d3.layout.tree()
    .size([h, 100])
    .value(function(d) {  return d.value; });

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", w)
    .attr("height", h)
  .append("svg:g")
    .attr("transform", "translate(20,30)");

var name_map;


function sum(a,attr_name) {
        // TODO: IF a is scalar, return the attr
        // return a[attr_name];
        // ELIF a is an array,
        var tot = _.reduce(
                       a,
                       function(memo,obj){
                          return memo + parseFloat(obj[attr_name]);
                       },
                        0);
        return tot;
}

function sum(a,attr_name) {
        // TODO: IF a is scalar, return the attr
        // return a[attr_name];
        // ELIF a is an array,
        var tot = _.reduce(
                       a,
                       function(memo,obj){
                          return memo + parseFloat(obj[attr_name]);
                       },
                        0);
        return tot;
}

/*
function indexNode(d,attr_name_list) {
    var index = [];
    for (i in attr_name_list) {
        k = attr_name_list[i];
        if (d.hasOwnProperty(k)) {
            index.push(d[k]);
        }
        else {
            index.push(d[0][k]);
        }
    }
    return index.join('_');

}

function make_subtrees(flat_data, attr_name_list, value_attr) {
    var tree_data;
    while (attr_name_list.length >= 0){
        // sort by value
        tree_data = _.sortBy(st_data, function(d){ return -1 * sumNode(d,value_attr); }) ;
        // group by parent path
        tree_data = _.groupBy(tree_data, function(d){ return indexNode(attr_name_list); });
    }

}
*/

d3.json("industry_names.json",function(names) {
        name_map = names;

    d3.json("subindustry_totals.json",function(st){
            var subtrees;
            st_data = st;
            subtrees =   _.sortBy(
                            _.groupBy(
                                _.sortBy(
                                    _.groupBy(
                                            _.sortBy(
                                                st_data,
                                                function(sd) { return -1 * parseFloat(sd.total_contributions); }
                                                ),
                                            function(d){ var index = d.sector_id+"_"+d.industry_id; return index; }
                                            ),
                                        function(a){return -1*sum(a,'total_contributions');}
                                        ),
                                     function(i){return i[0].sector_id;}
                                     ),
                                  function(ja){ var ind = 0;
                                    for (j in ja) {  ind += sum(ja[j],'total_contributions');}
                                    return -1 * ind;}
                                );
            //console.log(subtrees);
            mytree = {'name':'All Sectors','value':0.0,'children':[]};
            for (i in subtrees) {
                    var tr = {};
                    tr['name'] = name_map[subtrees[i][0][0].sector_id];
                    tr['value'] = 0;
                    tr['children'] = [];
                    for (j in subtrees[i]) {
                            var itr = {};
                            itr['name'] = name_map[subtrees[i][j][0].industry_id];
                            itr['value'] = 0;
                            itr['children'] = [];
                            for (k in subtrees[i][j]) {
                                    var sitr = {};
                                    sitr['name'] = name_map[subtrees[i][j][k].subindustry_id];
                                    sitr['value'] = parseFloat(subtrees[i][j][k].total_contributions);
                                    itr['children'].push(sitr)
                                    itr['value'] += sitr['value']
                            }
                    tr['children'].push(itr)
                    tr['value'] += itr['value']
                    }
            mytree['children'].push(tr);
            mytree['value'] += tr['value'];
            }
            maxval = d3.max(mytree.children,function(x){ return x.value });
            x_scale = d3.scale.linear().domain([0,maxval]).range([0,maxBar]);
            mytree.children.forEach(toggleAll);
            update(root = mytree);
        }
    );
});

function update(source) {

  var nodes = tree.nodes(mytree);
  testvar = nodes;

  //Compute the "layout".
  nodes.forEach(function(n, i) {
          n.x = i * barHeight;
  });

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); })
      .classed("selected",function(d) { if (d.children) {
                                            return true;
                                        } else {
                                            return false;
                                            }})
      .classed("notselected",function(d) { if (d.children) {
                                            return false;
                                        } else {
                                            return true;
                                            }});

  var nodeEnter = node.enter().append("svg:g")
      .classed("node",true)
      .classed("selected",function(d) { if (d.children) {
                                            return true;
                                        } else {
                                            return false;
                                            }})
      .classed("notselected",function(d) { if (d.children) {
                                            return false;
                                        } else {
                                            return true;
                                            }})
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .style("opacity", 1e-6)
      .on("click",click);

  // Enter any new nodes at the parent's previous position.
  nodeEnter.append("svg:rect")
      .classed("selector",true)
      .attr("y", -barHeight / 2)
      .attr("height", function(d){ if (d.depth > 0) { return barHeight}; })
      .attr("width", 290)
      .style("fill",function(d) { if (d.depth > 0) { return 'black'; }})
      .style("fill-opacity",function(d){ return grayScale(d.depth); });
      //.on("click",click);

  nodeEnter.append("svg:path")
      .attr("d",function(d) {
              return 'M '+(indent*d.depth)+' -'+(barHeight/4)+' l 0 '+(triangleBase)+' l 5 -5 l -5 -5';
              })
      .style("fill",function(d) {
              if (d.children || d._children) {
                if (d.depth > 0) {
                    return 'black';
                } else {
                    return 'none';
                }
              } else {
                return 'none';
              }});

  // rotates selected arrows 90 degrees
  d3.selectAll(".selected path")
      .attr("transform", function(d) {
                    //if ( d.children ) {
                        x = indent*d.depth;
                        y = barHeight/4;
                        tstring = "rotate(90," + x + ",-" + y +")";
                        tstring += " translate(0,-" + triangleBase + ")";
                        return tstring;
                        });
                    //} else if ( d._children ) {

  // rotates deselected arrows back
  d3.selectAll(".notselected path")
      .attr("transform", function(d) {
                        return "rotate(0)translate(0,0)";
                    });

  nodeEnter.append("svg:text")
      .attr("dy", 3.5)
      .attr("dx", 5.5)
      .text(function(d) { if (d.depth > 0) { return d.name; }})
      .attr("x",280)
      .style("text-anchor","end");

  nodeEnter.append("svg:rect")
      .attr("x",300)
      .attr("y", -barHeight / 2 + 2.5)
      .attr("height", function (d){ if (d.depth > 0) {return barHeight - 5;}})
      .attr("width",function(d){ return x_scale(d.value);})
      .attr("fill",function(d){ return colorScale(d.depth);});

  nodeEnter.transition()
      .duration(duration)
      .attr("transform", function(d) {
                            return "translate(" + 0 + "," + d.x + ")"; })
      .style("opacity", 1);

  node.transition()
      .duration(duration)
      .attr("transform", function(d) {
                            return "translate(" + 0 + "," + d.x + ")"; })
      .style("opacity", 1);

  // Transition exiting nodes to the parent's new position.
  node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
                            return "translate(" + 0 + "," + source.x + ")"; })
      .style("opacity", 1e-6)
      .remove();

  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}


// Toggle values on click and update.
function click(d) {
    toggle(d);
    update(d);
}

function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

function toggleAll(d) {
    if (d.children) {
        d.children.forEach(toggleAll);
        toggle(d);
    }
}
