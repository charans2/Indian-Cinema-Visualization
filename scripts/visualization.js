
var width = 700,
    height = 500,
    nodes,
    links,
    visible_nodes = [],
    visible_links = [],
    start_year,
    end_year,
    cur_year,
    simuulation,
    node,
    link;

function init() {
  d3.csv("/data/nodes.csv").then(data => {
    data.forEach((node) => {
      node.entry = parseInt(node.entry);
      node.size = parseInt(node.size);
    });
    nodes = data;
    d3.csv("/data/edges.csv").then(data => {
      links = data;
      start_year = d3.min(nodes, function(d) { return d.entry; });
      end_year = d3.max(nodes, function(d) { return d.entry; });
      cur_year = start_year;
      setupGraph();
      update();
      setupSlider();
    });
  });
}

function update() {
  visible_nodes = nodes.filter(node => node.entry <= cur_year);
  visible_links = [];
  for (var i = 0; i < links.length; i++) {
    var source = findNodeByID(links[i].source_id, visible_nodes);
    var target = findNodeByID(links[i].target_id, visible_nodes);
    if (source && target) {
      visible_links.push({
        "source": source,
        "target": target,
        "relation": links[i].relation
      });
    }
  }

  node = node.data(visible_nodes, function(d) { return d.id; });
  node.exit().remove();
  node = node .enter().append("circle")
              .attr("fill", "blue")
              .attr("r", 5)
              .merge(node);
  link = link.data(visible_links);
  link.exit().remove();
  link = link .enter().append("line")
              .attr("stroke", "#000")
              .attr("stroke-width", "2px")
              .merge(link);
  simulation.nodes(visible_nodes);
  simulation.force("link").links(visible_links);
  simulation.alpha(1).restart();
}

function ticked() {
    node.call(updateNode);
    link.call(updateLink);
}

function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
}

function updateLink(link) {
    link.attr("x1", function(d) { return fixna(d.source.x); })
        .attr("y1", function(d) { return fixna(d.source.y); })
        .attr("x2", function(d) { return fixna(d.target.x); })
        .attr("y2", function(d) { return fixna(d.target.y); });
}

function updateNode(node) {
    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
}

function findNodeByID(id, list) {
  var final;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      final = list[i];
      break;
    }
  }
  return final;
}

function setupSlider() {
  d3.select("#slider")
    .attr("min", 0)
    .attr("max", end_year-start_year)
    .attr("value", cur_year-start_year);
  d3.select("#slider-label").text("Year: " + cur_year);
  d3.select("#slider").on("change", function(d){
    cur_year = start_year + parseInt(this.value);
    d3.select("#slider-label").text("Year: " + cur_year);
    update();
  });
}

function setupGraph() {
  simulation = d3.forceSimulation(visible_nodes)
    .force("link", d3.forceLink(visible_links).distance(20).strength(1))
    .force("charge", d3.forceManyBody().strength(-5))
    .force("center", d3.forceCenter(width/2, height/2))
    .on("tick", ticked);
  svg = d3.select("#graph").attr("width", width).attr("height", height);
  container = svg.append("g");
  link = container.append("g").attr("class", "links")
    .selectAll("line")
    .data(visible_links)
    .enter()
    .append("line")
    .attr("stroke", "#000")
    .attr("stroke-width", "2px");
  node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(visible_nodes)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", "blue")
}
