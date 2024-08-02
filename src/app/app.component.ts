import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface FoodNode {
  // interface from angular mui taken
  id?: number;
  name: string;
  children?: FoodNode[];
}

interface TreeNode {
  // interface according to the Strapi
  id: number;
  name: string;
  N_ID: string | null;
  children?: TreeNode[];
  parent?: number | null;
}

interface ExampleFlatNode {
  // interface for flat nodes given in documentation
  expandable: boolean;
  id: number;
  name: string;
  level: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private _transformer = (node: FoodNode, level: number): ExampleFlatNode => {
    return {
      // transforms the shape when expanding and collasping
      expandable: !!node.children && node.children.length > 0, // to find out if expandable or not also hides and shows in button form in html
      id: node.id ?? 0,
      name: node.name,
      level: level,
    };
  };

  newNodeName: string = ''; // for adding new node of type string
  nodes: TreeNode[] = []; // node is of type array using interface of treenode

  treeControl = new FlatTreeControl<ExampleFlatNode|any|FoodNode|TreeNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener); // assinging datasource contains also control and flattener

  selectedNode: ExampleFlatNode | null = null; // value taken of selected node, it would be array of children or single parent
  editNodeName: string = ''; // variable for edit the existig node name

  constructor(private localService: LocalService) {} // injecting service

  ngOnInit(): void {
    this.fetchNodes(); // on page intializes fetch the whole tree node
    this.treeControl.expandAll()
  }

  hasChild = (_: number, node: any) => node.expandable; // variable to findout if child exists or not
  parseStringToInt(value: string): number {
    // used because sometimes by default it consider id as string
    return parseInt(value, 10); // integer conversion not decimal
  }
  fetchNodes(): void {
    // function to display tree data
    this.localService.getNodes().subscribe({
      next: (response) => {
        // Process the response to handle nested structures
        const processNode = (node: any): TreeNode => ({
          id: node.id, // id from strapi
          name: node.attributes.name, // name of node
          N_ID: node.attributes.N_ID, // optional, used for storing only on frontend
          parent: node.attributes.parent?.data?.id || null, // check for node
          children:
            node.attributes.children?.data.map((child: any) =>
              processNode(child)
            ) || [], // check for children if not exists then display empty array
        });

        // Map the response data to the TreeNode structure
        let nodes = response.data.map((item: any) => processNode(item));

        // Filter out nodes that are not root (i.e., have a parent)
        const rootNodes = nodes.filter((node: { parent: any }) => !node.parent);

        // Construct the hierarchical tree structure
        const nodeMap: { [key: number]: TreeNode | any } = {};
        nodes.forEach((node: TreeNode) => {
          nodeMap[node.id] = node;
        });
        nodes.forEach((node: TreeNode) => {
          if (node.parent && nodeMap[node.parent]) {
            nodeMap[node.parent].children = nodeMap[node.parent].children || [];
            nodeMap[node.parent].children.push(node);
          }
        });

        this.nodes = rootNodes;
        this.dataSource.data = this.nodes;
        this.treeControl.dataNodes = this.dataSource.data;
        this.treeControl.expandAll();
      },
      error: (err) => console.error('Error fetching nodes:', err),
    });
  }

  addTreeNode(name: string): void {
    if (name.trim() !== '') {
      // check for non empty string
      const payload = {
        // made payload because strapi needs it
        data: {
          name: name, // we can also add another attributes other than name as well
        },
      };
      if (this.localService.nodeExistsinParent(name, this.nodes)) {
        // check only in root nodes
        alert('Same name as Sibling is present');
        return;
      }

      this.localService.addTreeNode(payload).subscribe({
        next: () => {
          this.fetchNodes();
        },
        error: (err) => console.error('Error adding node:', err),
      });
    } else {
      alert("ERROR: Node Already Exists Or You've entered Invalid Node");
    }
  }

  deleteTreeNode(id: number): void {
    const nodeToDelete: any = this.findNodeById(this.nodes, id);

    // Check if the node exists
    if (!nodeToDelete) {
      alert('Nahhhhh..!!! Node not found');
      return;
    }

    // Confirm deletion if the node has children
    if (nodeToDelete.children && nodeToDelete.children.length > 0) {
      const confirmDelete = confirm(
        'Selected node has children. Are you sure you want to delete it and all its children?'
      );
      if (!confirmDelete) {
        return;
      }
    }

    // Recursively delete all children
    this.deleteChildren(nodeToDelete.children);

    // Proceed to delete the parent node
    this.localService.deleteTreeNode(id).subscribe({
      next: () => this.fetchNodes(),
      error: (err) => console.error('Error deleting node:', err),
    });
  }

  // Helper function to delete all children recursively
  private deleteChildren(children: Node[] | any): void {
    for (const child of children) {
      this.deleteChildren(child.children); // Recursively delete child nodes
      this.localService.deleteTreeNode(child.id).subscribe({
        next: () => console.log(`Deleted child node with id: ${child.id}`),
        error: (err) => console.error('Error deleting child node:', err),
      });
    }
  }
  editNode(node: ExampleFlatNode): void {
    this.selectedNode = node;
    this.editNodeName = node.name;
  }

  updateNodeName(node: any, newName: string) {
    if (this.localService.nodeExists(newName, node)) {
      alert('Node name already exists');
      return;
    }

    const updatedNode = {
      id: node.id,
      name: newName,
      parentId: node.parentId,
    };

    this.localService.updateNode(node.id, updatedNode).subscribe({

      next: (data: any) => {
        const confirmation=confirm("Do you really want to rename Node?")
        if(!confirmation){
           return
        }
        console.log('Node updated successfully:', data);
        node.name = newName;
        this.fetchNodes();
      },
      error: (error: any) => {
        console.error('Error updating node:', error);
      },
    });
  }
  addSubNode(parentNodeId: number, subNodeName: string): void {
    const parentNode = this.findNodeById(this.nodes, parentNodeId);

    if (!parentNode) {
      alert('Parent node not found or you have entered wrong node');
      return;
    }

    if (this.localService.nodeExists(subNodeName, parentNode)) {
      alert('Subnode name already exists under this parent');
      return;
    }

    const newSubNode = {
      name: subNodeName,
      parent: parentNodeId,
    };

    this.localService.addSubNode(newSubNode).subscribe({
      // making subnode tree like structure and push it into it
      next: (response) => {
        const addedNode = response.data;
        const newNode: TreeNode = {
          id: addedNode.id,
          name: addedNode.attributes.name,
          N_ID: addedNode.attributes.N_ID,
          parent: parentNodeId,
          children:
            addedNode.attributes.children?.data.map((child: any) => ({
              id: child.id,
              name: child.attributes.name,
              N_ID: child.attributes.N_ID,
              parent: addedNode.id,
              children: child.attributes.children || [],
            })) || [],
        };
        parentNode.children = parentNode.children || [];
        parentNode.children.push(newNode);
        this.dataSource.data = [...this.dataSource.data];
      },
      error: (err) => console.error('Error adding sub node:', err),
    });
  }

  findNodeById(nodes: TreeNode[], id: number): TreeNode | undefined {
    // function to find node using its id in tree array
    for (let node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        // finding in its children if it exists
        const childNode = this.findNodeById(node.children, id);
        if (childNode) {
          return childNode;
        }
      }
    }
    return undefined;
  }

  moveNode(nodeId: number, newParentId: number): void {
    this.localService.moveNode(nodeId, newParentId).subscribe({
      next: () => this.updateDataSource(),
      error: (err) => console.error('Error moving node:', err),
    });
  }

  updateDataSource(): void {
    // legacy code i used in frontend only helpful if want to fetch data only on level 1
    this.localService.getTreeData().subscribe((data) => {
      this.dataSource.data = data;
    });
  }
}
