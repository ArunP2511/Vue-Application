<template>
  <div id="myapp">
    <div id="containter">
      <svg ref="svg" :height="svgHeight" :width="svgWidth"></svg>
      <div v-if="showMyCard" id="cardInformation">
        <span class="close" @click="closeCard"><bold>X</bold></span>
        <h2>Node Information</h2>
        <span
          ><h3>Name:{{ selectedNode?.name }}</h3></span
        >
        <span
          ><h3>Description:{{ selectedNode?.description }}</h3></span
        >
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import { ref, onMounted } from "vue";
import axios from "axios"; // Assuming Axios is used for HTTP requests

export default {
  setup() {
    const svgHeight = ref(500);
    const svgWidth = ref(800);
    const graphicalData = ref([]);
    const selectedNode = ref(null);
    const showMyCard = ref(false);
    const svg = ref(null);
    const mainHierarchy = ref(null);

    onMounted(() => {
      getGraphData();
    });
    const getGraphData = async () => {
      const data = {
        data: [
          { name: "A", description: "This is a description of A", parent: "" },
          { name: "B", description: "This is a description of B", parent: "A" },
          { name: "C", description: "This is a description of C", parent: "A" },
          { name: "D", description: "This is a description of D", parent: "A" },
          {
            name: "B-1",
            description: "This is a description of B-1",
            parent: "B",
          },
          {
            name: "B-2",
            description: "This is a description of B-2",
            parent: "B",
          },
          {
            name: "B-3",
            description: "This is a description of B-3",
            parent: "B",
          },
          {
            name: "C-1",
            description: "This is a description of C-1",
            parent: "C",
          },
          {
            name: "C-2",
            description: "This is a description of C-2",
            parent: "C",
          },
          {
            name: "C-3",
            description: "This is a description of C-3",
            parent: "C",
          },
        ],
      };
      // graphicalData.value = data.data;
      // intializeTreeStructure();
      try {
        const myresponse = await axios.get("http://localhost:3100/data");
        graphicalData.value = await myresponse.data;
        intializeTreeStructure();
      } catch (error) {
        console.error(error);
      }
    };

    // Initialize tree layout using D3 library
    const intializeTreeStructure = () => {
      const rootElement = generateHierarchy(graphicalData.value);
      const treeviewLayout = d3
        .tree()
        .size([svgHeight.value - 100, svgWidth.value - 150]);
      const svgElement = d3.select(svg.value);

      const gSVG = svgElement
        .append("g")
        .attr("transform", "translate(50, 50)");

      mainHierarchy.value = d3.hierarchy(rootElement);
      mainHierarchy.value.x0 = svgHeight.value / 2;
      mainHierarchy.value.y0 = 0;

      // collapse all children except the root
      mainHierarchy.value.children.forEach(collapseNode);
      updateNode(mainHierarchy.value, treeviewLayout, svgElement, gSVG);
    };

    // Build a hierarchical structure from nodes and links
    const generateHierarchy = (data) => {
      const map = {};
      data.forEach((item) => {
        map[item.name] = { ...item, children: [] };
      });
      const root = [];
      data.forEach((item) => {
        if (item.parent === "") {
          root.push(map[item.name]);
        } else {
          map[item.parent].children.push(map[item.name]);
        }
      });
      return root[0];
    };

    // collapseNode function for nodes
    const collapseNode = (d) => {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        d._children.forEach(collapseNode);
      }
    };
    // updateNode function for update nodes on every actions
    const updateNode = (nodeSource, treeviewLayout, svgElement, gSVG) => {
      let i = 0;
      const treeValue = treeviewLayout(mainHierarchy.value);

      const nodes = treeValue.descendants();
      const maxX = d3.max(nodes, (d) => d.x);
      const maxY = d3.max(nodes, (d) => d.y);

      svgHeight.value = Math.max(maxX + 200, svgHeight.value);
      svgWidth.value = Math.max(maxY + 500, svgWidth.value);

      svgElement.attr("width", svgWidth.value).attr("height", svgHeight.value);

      const link = gSVG
        .selectAll(".link")
        .data(treeValue.links(), (d) => d.target.id);

      link
        .enter()
        .append("path")
        .attr("class", "link")
        .style("stroke-width", 1)
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x)
        )
        .merge(link);
      link.exit().remove();

      const node = gSVG
        .selectAll(".node")
        .data(treeValue.descendants(), (d) => d.id || (d.id = ++i));

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr(
          "transform",
          (d) => `translate(${nodeSource.y0},${nodeSource.x0})`
        )
        .on("click", (event, response) => {
          nodeClicked(
            event.currentTarget,
            response,
            treeviewLayout,
            svgElement,
            gSVG
          );
        });

      nodeEnter
        .append("rect")
        .attr("width", 80)
        .attr("height", 40)
        .attr("x", -20)
        .attr("y", -20);

      nodeEnter
        .append("text")
        .attr("dy", 3)
        .attr("x", (d) => (d.children || d._children ? -25 : 25))
        .style("text-anchor", (d) =>
          d.children || d._children ? "end" : "start"
        )
        .text((d) => d.data.name);

      const nodeupdateNode = nodeEnter.merge(node);
      nodeupdateNode
        .transition()
        .duration(250)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodeupdateNode
        .select("rect")
        .style("fill", (d) => (d._children ? "#ffd166" : "#06d6a0"));

      node
        .exit()
        .transition()
        .duration(250)
        .attr("transform", (d) => `translate(${nodeSource.y},${nodeSource.x})`)
        .remove();

      treeValue.descendants().forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      d3.forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(link)
            .id((d) => d.id)
            .distance(100)
        )
        .force("charge", d3.forceManyBody().strength(-400))
        .force(
          "center",
          d3.forceCenter(svgWidth.value / 2, svgHeight.value / 2)
        )
        .force(
          "collide",
          d3.forceCollide().radius((d) => d.radius + 10)
        )
        .on("tick", (event, d) => {
          link
            .attr("x1", (d) => {
              d.source.x;
            })
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

          node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        });
    };
    //to make the node clickable
    const nodeClicked = (ele, d, treeviewLayout, svgElement, gSVG) => {
      showMyCard.value = true;
      cardSelected(ele, d);

      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (!d.children && !d._children) {
        return;
      } else {
        d.children = d._children;
        d._children = null;
      }
      updateNode(d, treeviewLayout, svgElement, gSVG);
    };

    // to make the node selectable
    const cardSelected = (ele, d) => {
      if (d.data) {
        d3.selectAll(".node").classed("selected", false);
      }
      d3.select(ele).classed("selected", true);
      selectedNode.value = d.data;
    };
    // to close the card
    const closeCard = () => {
      showMyCard.value = false;
      deSelectNode();
    };
    // to make the node unselectable
    const deSelectNode = () => {
      selectedNode.value = null;
      d3.select(".node.selected").classed("selected", false);
    };
    return {
      svgHeight,
      svgWidth,
      svg,
      showMyCard,
      selectedNode,
      closeCard,
    };
  },
};
</script>

<style>
#container {
  display: flex;
  height: 100%;
  width: 100%;
}

.tree-svg {
  flex: 1;
}

#cardInformation {
  position: absolute;
  left: 0;
  top: 0;
  width: 200px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  display: block;
}

#cardInformation h2 {
  margin: 0;
}

.close {
  font-size: 18px;
  cursor: pointer;
  position: absolute;
  right: 10px;
  top: 10px;
  float: right;
  color: red;
}

.node text {
  font: 12px sans-serif;
  fill: #333;
}

.node.selected rect {
  stroke: #ef476f;
  stroke-width: 4px;
}

.link {
  fill: none;
  stroke: #140e0e;
  stroke-width: 2px;
}
</style>
