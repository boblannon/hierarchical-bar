
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
var myroot;

var x_scale;

var colorScale;
colorScale = d3.scaleOrdinal().domain([1,2,3]).range(['#006D2C','#31A354','#74C476']);

var grayScale;
grayScale = d3.scaleOrdinal().domain([1,2,3]).range([0.3,0.2,0.1]);

var tree = d3.tree()
    .size([h, 100]);
    // .value(function(d) {  return d.value; });


// var diagonal = d3.svg.diagonal()
//     .projection(function(d) { return [d.y, d.x]; });

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

d3.json("industry_names.json").then(function(names) {
        // console.log("loaded industry_names");
        name_map = names;

    d3.json("subindustry_totals.json").then(function(st){
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
            let autoinc = 0;
            myroot = {'name':'All Sectors', 'id': autoinc, 'value':0.0, 'depth': 0, 'children':[]};
            for (i in subtrees) {
                    var tr = {};
                    tr['name'] = name_map[subtrees[i][0][0].sector_id];
                    tr['value'] = 0;
                    tr['children'] = [];
                    tr['selected'] = false;
                    tr['id'] = ++autoinc;
                    //tr['depth'] = 1;
                    for (j in subtrees[i]) {
                            var itr = {};
                            itr['name'] = name_map[subtrees[i][j][0].industry_id];
                            itr['value'] = 0;
                            //itr['depth'] = 2;
                            itr['id'] = ++autoinc;
                            itr['children'] = [];
                            itr['selected'] = false;
                            for (k in subtrees[i][j]) {
                                    var sitr = {};
                                    sitr['name'] = name_map[subtrees[i][j][k].subindustry_id];
                                    sitr['value'] = parseFloat(subtrees[i][j][k].total_contributions);
                                    //sitr['depth'] = 3;
                                    sitr['id'] = ++autoinc;
                                    sitr['selected'] = false;
                                    itr['children'].push(sitr)
                                    itr['value'] += sitr['value']
                            }
                    tr['children'].push(itr)
                    tr['value'] += itr['value']
                    }
                myroot['children'].push(tr);
                myroot['value'] += tr['value'];
            }
            myhier = d3.hierarchy(myroot);
            console.log(myhier);
            maxval = d3.max(myhier.children,function(x){ return x.value });
            x_scale = d3.scaleLinear().domain([0,maxval]).range([0,maxBar]);
            //myhier.children.forEach(toggleAll);
            update(myhier);
        }
    );
});

function update(source) {

  // toggle(source);
  console.log(source);
  var new_node_data = source.children;
  // testvar = nodes;

  //Compute the "layout".
  let lowest = barHeight;
  new_node_data.forEach(function(n, i) {
          n.y = i * barHeight;
          n.x = source.x || 0;
          lowest += barHeight;
  });

  // Update the nodes…
  var nodes = vis.selectAll("g.node")
      .classed("selected",function(d) { if (d.id == source.id) {
          return !d.selected;
      } else { return d.selected; } });

      new_nodes = nodes.data(new_node_data).enter().append("svg:g")
          .classed("node",true)
          .attr("transform", function(d) { return `translate(${d.x},${d.y})`; })
          //.style("opacity", 1e-6)
          .on("click",click);
      new_nodes.append("svg:rect")
          .classed("selector",true)
          .attr("y", -barHeight / 2)
          .attr("height", function(d){ if (d.depth > 0) { return barHeight}; })
          .attr("width", 290)
          .style("fill",function(d) { if (d.depth > 0) { return 'black'; }})
          .style("fill-opacity",function(d){ return grayScale(d.depth); });
      new_nodes.append("svg:path")
          .attr("d",function(d) {
                  let depth = d.depth;
                  let depthIndent = indent * depth;
                  return 'M '+ depthIndent +' -'+(barHeight/4)+' l 0 '+(triangleBase)+' l 5 -5 l -5 -5';
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
      new_nodes.append("svg:text")
          .attr("dy", 3.5)
          .attr("dx", 5.5)
          .text(function(d) { if (d.depth > 0) { return d.name; }})
          .attr("x",280)
          .style("text-anchor","end");
      new_nodes.append("svg:rect")
          .attr("x",300)
          .attr("y", -barHeight / 2 + 2.5)
          .attr("height", function (d){ if (d.depth > 0) {return barHeight - 5;}})
          .attr("width",function(d){ return x_scale(d.value);})
          .attr("fill",function(d){ return colorScale(d.depth);});

  // rotates deselected arrows back
  d3.selectAll(".selected path")
      .attr("transform", function(d) {
                        return "rotate(0)translate(0,0)";
                    });

  // rotates selected arrows 90 degrees
  d3.selectAll(":not(.selected) path")
      .attr("transform", function(d) {
                    //if ( d.children ) {
                        x = indent*d.depth;
                        y = barHeight/4;
                        tstring = "rotate(90," + x + ",-" + y +")";
                        tstring += " translate(-" + triangleBase + ", 0)";
                        return tstring;
                        });
                    //} else if ( d._children ) {

  new_nodes.merge(nodes);

  nodes.transition()
      .duration(duration)
      .attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")"; })
      .style("opacity", 1);


  //Transition exiting nodes to the parent's new position.
  nodes.exit().transition()
       .duration(duration)
       .attr("transform", function(d) {
           new_y = d.y + lowest;
           return "translate(" + d.x + "," + new_y + ")"; });
      //.remove();
  testvar = nodes;
  nodes.each(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}


// Toggle values on click and update.
function click(d) {
    update(d);
}

function toggle(d) {
    d.selected = !d.selected
}

function toggleAll(d) {
    d.children.forEach(toggleAll);
    toggle(d);
}
