import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface FoodNode { // interface from angular mui taken
  id?: number;
  name: string;
  children?: FoodNode[];
}

interface TreeNode {
  id: number;
  name: string;
  N_ID: string | null;
  children?: TreeNode[];
  parent?: number | null; // Add this line
}


interface ExampleFlatNode { // interface for flat nodes given in documentation
  expandable: boolean;
  id: number;
  name: string;
  level: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private _transformer = (node: FoodNode, level: number): ExampleFlatNode => {
    return { // transforms the shape when expanding and collasping
      expandable: !!node.children && node.children.length > 0, // to find out if expandable or not also hides and shows in button form in html
      id: node.id ?? 0,
      name: node.name,
      level: level,
    };
  };

  newNodeName: string = ''; // for adding new node of type string
  nodes: TreeNode[] = []; // node is of type array using interface of treenode

  treeControl = new FlatTreeControl<any>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener); // assinging datasource contains also control and flattener

  selectedNode: ExampleFlatNode | null = null;  // value taken of selected node, it would be array of children or single parent
  editNodeName: string = ''; // variable for edit the existig node name

  constructor(private localService: LocalService) {} // injecting service

  ngOnInit(): void {
    this.fetchNodes(); // on page intializes fetch the whole tree node

  }

  hasChild = (_: number, node: any) => node.expandable; // variable to findout if child exists or not
  parseStringToInt(value: string): number { // used because sometimes by default it consider id as string
    return parseInt(value, 10); // integer conversion not decimal
  }
  fetchNodes(): void {
    this.localService.getNodes().subscribe({
      next: (response) => {
        // Process the response to handle nested structures
        const processNode = (node: any): TreeNode => ({
          id: node.id,
          name: node.attributes.name,
          N_ID: node.attributes.N_ID,
          parent: node.attributes.parent?.data?.id || null,
          children: node.attributes.children?.data.map((child: any) => processNode(child)) || []
        });

        // Map the response data to the TreeNode structure
        let nodes = response.data.map((item: any) => processNode(item));

        // Filter out nodes that are not root (i.e., have a parent)
        const rootNodes = nodes.filter((node: { parent: any; }) => !node.parent);

        // Construct the hierarchical tree structure
        const nodeMap: { [key: number]: TreeNode|any } = {};
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
      error: (err) => console.error('Error fetching nodes:', err)
    });
  }

  addTreeNode(name: string): void {
    if (name.trim() !== '') {// check for non empty string
      const payload = { // made payload because strapi needs it
        data: {
          name: name, // we can also add another attributes other than name as well
        }
      };
      if (this.localService.nodeExiststest(name, this.nodes)) { // need fixing
        console.error('Node name already exists');
        alert("Same name as Sibling is present")
        return;
      }

      this.localService.addTreeNode(payload).subscribe({
        next: () => {
          this.fetchNodes();
        },
        error: (err) => console.error('Error adding node:', err)
      });
    } else {
      alert("ERROR: Node Already Exists Or You've entered Invalid Node");
    }
  }

  deleteTreeNode(id: number): void {
    const nodeToDelete = this.findNodeById(this.nodes, id);
    if (nodeToDelete && nodeToDelete.children && nodeToDelete.children.length > 0) {
      console.error('Node has children and cannot be deleted');
      alert("Node has children and cannot be deleted")
      return;
    }
    this.localService.deleteTreeNode(id).subscribe({
      next: () => this.fetchNodes(),
      error: err => console.error('Error deleting node:', err)
    });
  }

  editNode(node: ExampleFlatNode): void {
    this.selectedNode = node;
    this.editNodeName = node.name;
  }

  updateNodeName(node: any, newName: string) {
    if (this.localService.nodeExists(newName, null)) {
      console.error('Node name already exists');
      return;
    }

    const updatedNode = {
      id: node.id,
      name: newName,
      parentId: node.parentId
    };

    this.localService.updateNode(node.id, updatedNode).subscribe({
      next: (data: any) => {
        console.log('Node updated successfully:', data);
        node.name = newName;
        this.fetchNodes();
      },
      error: (error: any) => {
        console.error('Error updating node:', error);
      }
    });
  }
  addSubNode(parentNodeId: number, subNodeName: string): void {
    const parentNode = this.findNodeById(this.nodes, parentNodeId);

    if (!parentNode) {
      console.error('Parent node not found');
      return;
    }

    if (this.localService.nodeExists(subNodeName, parentNode)) {

      console.error('Subnode name already exists under this parent');
      alert("Subnode name already exists under this parent")
      return;
    }

    const newSubNode = {
      name: subNodeName,
      parent: parentNodeId
    };

    this.localService.addSubNode(newSubNode).subscribe({
      next: (response) => {
        const addedNode = response.data;
        const newNode: TreeNode = {
          id: addedNode.id,
          name: addedNode.attributes.name,
          N_ID: addedNode.attributes.N_ID,
          parent: parentNodeId,
          children: addedNode.attributes.children?.data.map((child: any) => ({
            id: child.id,
            name: child.attributes.name,
            N_ID: child.attributes.N_ID,
            parent: addedNode.id,
            children: child.attributes.children || []
          })) || []
        };
        parentNode.children = parentNode.children || [];
        parentNode.children.push(newNode);
        this.dataSource.data = [...this.dataSource.data];
      },
      error: (err) => console.error('Error adding sub node:', err)
    });
  }

  findNodeById(nodes: TreeNode[], id: number): TreeNode | undefined {
    for (let node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
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
      error: err => console.error('Error moving node:', err)
    });
  }

  updateDataSource(): void {
    this.localService.getTreeData().subscribe(data => {
      this.dataSource.data = data;
    });
  }
}
