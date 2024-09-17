import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import axios from "axios";
import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import TreeViewComponent from "../TreeViewComponent.vue";
import * as d3 from "d3";
import MockAdapter from "axios-mock-adapter";

// Disable transitions in test
d3.selection.prototype.transition = function () {
  return this;
};

// vi.mock("axios");

describe("TreeViewComponent.vue", () => {
  let vuewrapper;
  let mockAxios;

  beforeEach(async () => {
    mockAxios = new MockAdapter(axios);
    const mockGraphData = [
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
    ];
    mockAxios.onGet("http://localhost:3100/data").reply(200, mockGraphData);
    vuewrapper = mount(TreeViewComponent);

    await flushPromises();
    await vuewrapper.vm.$nextTick();
  });
  it("renders the svg element properly", () => {
    expect(vuewrapper.find("svg").exists()).toBe(true);
  });

  it("renders the node element properly", async () => {
    const gNode = vuewrapper.find("g.node");
    expect(gNode.exists()).toBe(true);
  });

  it("renders the rect element properly", async () => {
    const gNode = vuewrapper.find("g.node");
    const rect = gNode.find("rect");
    expect(rect.exists()).toBe(true); // Check if the <rect> exists
  });

  it("renders the cardInformation properly", async () => {
    const gNode = vuewrapper.find("g.node");
    const rect = gNode.find("rect");
    await gNode.trigger("click");
    expect(vuewrapper.find("#cardInformation").exists()).toBe(true);
  });

  // it("select a node and then display the information card", async () => {
  //   vuewrapper.setData({
  //     getGraphData: [
  //       { name: "A", description: "This is a description of A", parent: "" },
  //       { name: "B", description: "This is a description of B", parent: "A" },
  //     ],
  //   });
  //   await vuewrapper.vm.intializeTreeStructure();

  //   const node = vuewrapper.find(".node");
  //   await node.trigger("click");

  //   expect(vuewrapper.vm.selectedNode.name).toBe("A");
  //   expect(vuewrapper.vm.showMyCard).toBe(true);
  //   expect(vuewrapper.find("#cardInformation").exists()).toBe(true);
  // });

  // it("clicks on the close button to close the card", async () => {
  //   VueWrapper.setData({
  //     showMyCard: true,
  //     selectedNode: {
  //       name: "A",
  //       description: "This is a description of A",
  //       parent: "",
  //     },
  //   });

  //   const closeButton = vuewrapper.find(".close");
  //   await closeButton.trigger("click");
  // });
});
