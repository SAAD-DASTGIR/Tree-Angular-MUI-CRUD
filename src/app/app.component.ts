import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { LocalService } from './service/local.service';
import { isEmpty } from 'rxjs';
interface TreeNode {
  id: number;
  name: string;
  N_ID?: string | null;
  children?: TreeNode[];
  parent: number | null | any;
  haschild?: boolean;
}
interface ExampleFlatNode {
  // interface to use i mattree
  expandable: boolean;
  id: number;
  name: string;
  level: number;
  haschild: boolean | any;
  children?: ExampleFlatNode[];
  parent: any;
}

const processNode = (node: any): TreeNode => ({
  id: node.id || null,
  name: node.attributes?.name || '',
  N_ID: node.attributes?.N_ID || null,
  parent: node.attributes?.parent?.data?.id || null,
  haschild: node.attributes?.hasChild, // Use hasChild from backend
  children:
    node.attributes?.children?.map((child: any) => processNode(child)) || [],
});
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private _transformer = (node: TreeNode, level: number): ExampleFlatNode => ({
    expandable: !!node.haschild, // Check if haschild is true
    id: node.id,
    name: node.name,
    level: level,
    haschild: node.haschild,
    parent: node.parent,
  });

  treeFlattener = new MatTreeFlattener( // flattener to transform
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  newNodeName: string = ''; // used in edit functionality to assign name
  nodes: TreeNode[] = []; // nodes of array in tree structure
  expandedNodeId: number | null = null; // Add this line
  expandedNodeIds: Set<number> = new Set(); // Track expanded node IDs
  isFiltered: boolean = false; // Track filtering state

  treeControl = new FlatTreeControl<ExampleFlatNode | any>( // to expand and collaspe
    (node) => node.level,
    (node) => node.expandable
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener); // passing the datasource

  selectedNode: ExampleFlatNode | null = null; // select node to edit
  editNodeName: string = ''; // variable for edited new name
  filteredDataSource: TreeNode[] = []; // return filtered tree structure
  filterValue: any;

  constructor(private localService: LocalService) {}

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable; // to ind out whether it has children or not

  ngOnInit(): void {
    // on intializes fetch load nodes mainly parents
    this.fetchNodes();
  }

  parseStringToInt(value: string): number {
    // used to get parent id because sometimes it consider as string
    return parseInt(value, 10); // q0 for integer
  }

  fetchNodes(page: number = 1, pageSize: number = 10): void {
    // used pagination data
    this.localService.getNodes(page, pageSize).subscribe({
      next: (response) => {
        console.log('Fetched Nodes:', response);
        if (response && response.data) {
          this.nodes = response.data.map((node: any) => processNode(node));
          // console.log('Processed Tree Structure:', JSON.stringify(this.nodes, null, 2));
          const flattenedData = this.flattenTree(this.nodes);
          this.dataSource.data = flattenedData;
          // this.treeControl.expandAll()
          this.treeControl.dataNodes = flattenedData;
          // this.treeControl.expandAll()
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching nodes:', err),
    });
  }
  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement; // get value from user
    this.filterValue = input.value.trim().toLowerCase(); // convert into lowercase
    this.isFiltered = false; // to check current state that filteration is doing or not

    // Clear expandedNodeIds when applying a new filter
    this.expandedNodeIds.clear();

    // Fetch filtered nodes from the backend
    this.localService.getFilterNodes(this.filterValue).subscribe({
      next: (response) => {
        console.log('Fetched Filtered Nodes:', response);
        if (response && response.data) {
          if (this.filterValue) {
            const allNodes = response.data.map((node: any) =>
              processNode(node)
            ); // give hirearchy
            const filteredNodes = this.filterNodes(allNodes, this.filterValue);
            this.isFiltered = this.filterValue !== ''; //means we are doing filteration

            this.filteredDataSource = filteredNodes; // give filtered nodes
            this.dataSource.data = this.filteredDataSource; // pass to datasource

            this.treeControl.dataNodes.forEach((node) => {
              // this we check it parents and children yo show filter value and expand_more btn
              if (node.name.toLowerCase().includes(this.filterValue)) {
                this.expandNodeAndAncestors(node);
                // this.expandNodeAndDescendants(node);
              }
            });
          }
          // this.treeControl.expandAll(); // This ensures all nodes are expanded
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching filtered nodes:', err),
    });

    if (!this.filterValue) {
      // If the filter is empty, reload the original nodes with pagination
      this.fetchNodes();
    }
  }

  // Helper method to expand a node and all its ancestors
  private expandNodeAndAncestors(node: any): void {
    let parent = this.getParentNode(node); //get parentt
    while (parent) {
      // if any then track it all ids
      this.expandedNodeIds.add(parent.id);
      this.treeControl.expand(parent);
      parent = this.getParentNode(parent);
    }
    // this.expandedNodeIds.add(node.id); //otherwise it is root then grab its id
    // this.treeControl.expand(node);
  }

  // Helper method to expand a node and all its descendants
  private expandNodeAndDescendants(node: any): void {
    const descendants = this.treeControl.getDescendants(node); //get values of all of its children
    descendants.forEach((descendant) => {
      this.expandedNodeIds.add(descendant.id);
      this.treeControl.expand(descendant);
    });
  }

  // Helper method to get the parent node of a given node
  private getParentNode(node: any): any | null {
    const currentLevel = this.treeControl.getLevel(node); // use level to get parent
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1; // give its value in hireachy
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (this.treeControl.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  filterNodes(nodes: TreeNode[], filterValue: string): TreeNode[] {
    // function to findout matched nodes from database
    const filteredNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      if (node.name.toLowerCase().includes(filterValue)) {
        // convert each to lowercase
        filteredNodes.push(node);
      } else if (node.children) {
        const filteredChildren = this.filterNodes(node.children, filterValue);
        if (filteredChildren.length > 0) {
          filteredNodes.push({ ...node, children: filteredChildren });
        }
      }
    });
    return filteredNodes;
  }
  fetchChildrenNodes(node: ExampleFlatNode): void {
    console.log(`Fetching children for node ID: ${node.id}`);

    this.localService.getChildrenNodes(node.id).subscribe({
      // giving parent id find its children
      next: (response) => {
        if (response && response.data) {
          if (this.filterValue) {
          }
          const childrenNodes = response.data.map((child: any) =>
            processNode(child)
          );
          const parentNode = this.findNodeById(this.nodes, node.id);
          if (parentNode) {
            parentNode.children = childrenNodes; // Add fetched children
            this.updateTreeData(); // Update tree data and re-flatten the tree
            this.treeControl.expand(
              this.treeControl.dataNodes.find((n) => n.id === node.id)
            );
          } else {
            console.error('Parent node not found for ID:', node.id);
          }
        }
      },
      error: (err) => console.error('Error fetching children nodes:', err),
    });
  }
updateTreeData() {
  const flattenedData = this.flattenTree(this.nodes);
  this.dataSource.data = flattenedData;
  this.expandedNodeIds.forEach(id => {
    const node = this.treeControl.dataNodes.find(n => n.id === id);
    if (node) {
      this.treeControl.expand(node);
    }
  });
  this.treeControl.dataNodes = flattenedData;

  // Manually manage the expansion state instead of using expandAll

}


  flattenTree(
    nodes: TreeNode[],
    level: number = 0,
    addedIds: Set<number> = new Set()
  ): ExampleFlatNode[] {
    let result: ExampleFlatNode[] = [];
    nodes.forEach((node) => {
      // Skip the node if its ID is already in the set
      if (addedIds.has(node.id)) {
        return;
      }
      // Create a flat node with the current level
      const flatNode: ExampleFlatNode = {
        id: node.id,
        haschild: node.haschild,

        name: node.name,
        level: level,
        expandable: false,
        children: [],
        parent: undefined
      };

      // Add the node's ID to the set to avoid duplicates
      addedIds.add(node.id);
      // Add the flat node to the result list
      result.push(flatNode);

      // Recursively flatten the children, incrementing the level
      if (node.children && node.children.length > 0) {
        const childrenFlatNodes = this.flattenTree(
          node.children,
          level + 1,
          addedIds
        );
        flatNode.children = childrenFlatNodes; // Attach flattened children to the parent node's children array
      }
    });

    return result;
  }

  toggleNode(node: ExampleFlatNode): void {
    if (!node.expandable) {
      return;
    }

    const parentNode = this.findNodeById(this.nodes, node.id);

    if (
      parentNode &&
      (!parentNode.children || parentNode.children.length === 0)
    ) {
      if (!this.filterValue) {
        this.fetchChildrenNodes(node);
      }
      this.expandedNodeId = node.id;
      this.treeControl.toggle(node);
    } else {
      this.treeControl.toggle(node);
      if (this.treeControl.isExpanded(node)) {
        this.expandedNodeId = node.id;
      } else {
        this.expandedNodeId = null;
      }
    }

    if (this.expandedNodeIds.has(node.id)) {
      this.expandedNodeIds.delete(node.id);
      this.treeControl.collapse(node);
      console.log("test close")
      // this.expandedNodeIds.clear()
      // this.fetchNodes()
      // Collapse all descendants
      this.collapseDescendants(node);
    } else {
      this.expandedNodeIds.add(node.id);
      console.log("hehe")
      this.treeControl.expand(node);
      this.collapseDescendants(node);


      let parentNode = this.findNodeById(this.nodes, node.parent);
      while (parentNode) {
        this.expandedNodeIds.add(parentNode.id);
        const flatNode = this.treeControl.dataNodes.find(
          (n) => n.id === parentNode!.id
        );
        if (flatNode) {
          this.treeControl.expand(flatNode);
        }
        parentNode = this.findNodeById(this.nodes, parentNode.parent);
      }
    }
  }

  // Helper method to collapse all descendants of a node
  private collapseDescendants(node: ExampleFlatNode): void {
    const descendants = this.treeControl.getDescendants(node);
    descendants.forEach((descendant) => {
      this.expandedNodeIds.delete(descendant.id);
      this.treeControl.collapse(descendant);
      // console.log("test")
    });
  }


  addTreeNode(name: string): void {
    if (name.trim() !== '') {
      const payload = { data: { name: name } };

      if (this.localService.nodeExistsinParent(name, this.nodes)) {
        alert('Same name as Sibling is present');
        return;
      }

      this.localService.addTreeNode(payload).subscribe({
        next: () => {
          this.expandedNodeIds.clear();
          this.fetchNodes();
        },
        error: (err) => console.error('Error adding node:', err),
      });
    } else {
      alert("ERROR: Node Already Exists Or You've entered Invalid Node");
    }
  }
deleteTreeNode(id: number): void {
  // Find the node to delete in the filtered data if filtered, otherwise in the original data
  const nodeToDelete = this.isFiltered
    ? this.findNodeById(this.filteredDataSource, id)
    : this.findNodeById(this.nodes, id);

  if (!nodeToDelete) {
    alert('Node not found');
    return;
  }

  // If node has children, confirm deletion
  if (nodeToDelete.children && nodeToDelete.children.length > 0) {
    const confirmDelete = confirm(
      'Selected node has children. Are you sure you want to delete it and all its children?'
    );
    if (!confirmDelete) {
      return;
    }
  }

  // Delete node and its children
  this.deleteChildren(nodeToDelete.children);

  this.localService.deleteTreeNode(id).subscribe({
    next: () => {
      this.expandedNodeIds.clear();
      this.fetchNodes(); // Refresh tree after deletion
      console.log(this.fetchNodes())
    },
    error: (err) => console.error('Error deleting node:', err),
  });
}
private deleteChildren(children: TreeNode[] | undefined): void {
  if (!children) return;

  for (const child of children) {
    this.deleteChildren(child.children);
    this.localService.deleteTreeNode(child.id).subscribe({
      next: () => console.log(`Deleted child node with id: ${child.id}`),
      error: (err) => console.error('Error deleting child node:', err),
    });
  }
}

  findNodeById(tree: TreeNode[], id: number): TreeNode | undefined {
    for (let node of tree) {
      if (node.id === id) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  editNode(node: ExampleFlatNode): void {
    this.selectedNode = node;
    this.editNodeName = node.name;
  }
  updateNodeName(node: ExampleFlatNode | any, newName: string) {
    if (!newName.trim()) {
      alert('ERROR: Name cannot be empty.');
      return;
    }

    // Find the parent node
    const parentNode = this.findNodeById(this.nodes, node.parent);

    // Check if the new name already exists among the siblings (excluding the node itself)
    if (
      parentNode &&
      parentNode.children?.some(
        (child: TreeNode) =>
          child.name.trim().toLowerCase() === newName.trim().toLowerCase() &&
          child.id !== node.id
      )
    ) {
      alert(
        'A sibling with this name already exists. Please choose a different name.'
      );
      return;
    }

    const updatedNode = {
      id: node.id,
      name: newName,
      parent: node.parent,
    };

    const confirmation = confirm('Do you really want to rename this node?');
    if (!confirmation) {
      return;
    }

    this.localService.updateNode(node.id, updatedNode).subscribe({
      next: () => {
        console.log('Node updated successfully');
        this.expandedNodeIds.clear();
        this.fetchNodes(); // Refresh the nodes after update
        this.selectedNode = null;
      },
      error: (err) => {
        console.error('Error updating node:', err);
        alert('Error updating node');
      },
    });
  }



  cancelEdit(): void {
    // will use in future to optimize
    this.selectedNode = null;
  }

  addSubNode(subNodeName: string, parentNodeId: number): void {
    if (subNodeName.trim() === '' || isNaN(parentNodeId)) {
      alert('Error: Invalid input.');
      return;
    }

    const subNode = {
      name: subNodeName,
      parent: parentNodeId,
    };

    console.log('Adding SubNode:', subNode);

    if (
      this.localService.nodeExists(
        subNodeName,
        this.findNodeById(this.nodes, parentNodeId)
      )
    ) {
      alert('Error: SubNode already exists or invalid subnode.');
      return;
    }

    this.localService.addSubNode(subNode).subscribe({
      next: (response) => {
        console.log('SubNode added successfully:', response);
        this.expandedNodeIds.clear();

        this.fetchNodes();
      },
      error: (err) => console.error('Error adding subnode:', err),
    });
  }

  moveNode(nodeId: number, newParentId: number): void {
    const confirmation = confirm(
      'Do you really want to move the selected node to the new parent node?'
    );
    if (!confirmation) {
      return;
    }
    if (nodeId === newParentId) {
      alert('Error: A node cannot be moved to itself.');
      return;
    }
    this.localService.moveNode(nodeId, newParentId).subscribe({
      next: (response) => {
        console.log('Node moved successfully:', response);
        this.expandedNodeIds.clear();
        this.fetchNodes();
      },
      error: (err) => alert('Parent Cannot be Child of its Children'),
    });
  }
}
