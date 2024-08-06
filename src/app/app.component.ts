import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface TreeNode {
  // interface required for strapi to make hierical structure
  id: number;
  name: string | any;
  N_ID?: string | null;
  children?: TreeNode[];
  parent?: number | null;
}
interface ExampleFlatNode {
  expandable: boolean;
  id: number;
  name: string;
  level: number;
}
const processNode = (node: any): TreeNode => ({
  //function to map node on frontend
  id: node.id || null,
  name: node.attributes?.name || '',
  N_ID: node.attributes?.N_ID || null,
  parent: node.attributes?.parent?.data?.id || null,
  children: (node.attributes?.children || []).map((child: any) =>
    processNode(child)
  ),
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private _transformer = (node: TreeNode, level: number): ExampleFlatNode => {
    return {
      expandable: !!node.children && node.children.length > 0, // expand if length of child is greater than zero
      id: node.id,
      name: node.name,
      level: level,
    };
  };

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  parseStringToInt(value: string): number | any {
    // used because sometimes by default it consider id as string
    return parseInt(value, 10); // integer conversion not decimal
  }
  newNodeName: string = '';
  nodes: TreeNode[] = []; // array of nodes used both as parent and child

  treeControl = new FlatTreeControl<any | ExampleFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  selectedNode: ExampleFlatNode | null = null;
  editNodeName: string = ''; // varaible to store edited node name

  constructor(private localService: LocalService) {}

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable; // if child then expand

  ngOnInit(): void {
    this.fetchNodes(); // fetch when app intialzes
    // this.treeControl.expandAll()
  }

  fetchNodes(): void {
    this.localService.getNodes().subscribe({
      next: (response) => {
        console.log('API Response:', response); // structured responce from strapi
        if (response && response.data) {
          // if we get response then map
          this.nodes = response.data?.map((node: any) => processNode(node));
          console.log('Processed Nodes:', this.nodes);
          this.dataSource.data = this.nodes;
          this.treeControl.dataNodes = this.nodes;
          this.treeControl.expandAll();
          console.log(this.treeControl.dataNodes);
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching nodes:', err),
    });
  }

  addTreeNode(name: string): void {
    if (name.trim() !== '') {
      const payload = {
        // payload requires because of data from strapi
        data: {
          name: name,
        },
      };
      if (this.localService.nodeExistsinParent(name, this.nodes)) {
        alert('Same name as Sibling is present');
        return;
      }

      this.localService.addTreeNode(payload).subscribe({
        next: () => {
          this.fetchNodes(); //after add display the fetch nodes
        },
        error: (err) => console.error('Error adding node:', err),
      });
    } else {
      alert("ERROR: Node Already Exists Or You've entered Invalid Node");
    }
  }

  deleteTreeNode(id: number): void {
    const nodeToDelete = this.findNodeById(this.nodes, id); // find node to be deleted

    if (!nodeToDelete) {
      // if not present then return
      alert('Node not found');
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

    // Recursively delete all children first
    this.deleteChildren(nodeToDelete.children);

    // Proceed to delete the parent node
    this.localService.deleteTreeNode(id).subscribe({
      next: () => this.fetchNodes(),
      error: (err) => console.error('Error deleting node:', err),
    });
  }

  // Helper function to delete all children recursively
  private deleteChildren(children: TreeNode[] | undefined): void {
    if (!children) return;

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

  updateNodeName(node: ExampleFlatNode | any, newName: string) {
    const updatedNode = {
      // object forr updated node
      id: node.id,
      name: newName,
      parent: node.parent,
    };
    // if (this.localService.nodeExistsinParent(newName, this.nodes)) { // check in main parent do not chnage it
    //   alert('Are You Blind parent? Name you added also exists as Sibling ');
    //   return;
    // }
    // if (!this.localService.nodeExistsinParent(newName, this.nodes)) {
    //   alert('Same name as Sibling is present');
    //   return;
    // }
    // if(this.localService.nodeExists(newName,this.nodes)){
    //   alert('Are you Blind children? Name you add also exsts as Sibling')
    //   return
    // }
    this.localService.updateNode(node.id, updatedNode).subscribe({
      next: () => {
        const confirmation = confirm('Do you really want to rename Node?');
        if (!confirmation) {
          return;
        }
        this.fetchNodes();
        this.selectedNode = null;
      },
      error: (err) => console.error('Error updating node:', err),
    });
  }

  cancelEdit(): void {
    // usage in future for yes no option
    this.selectedNode = null;
  }

  addSubNode(subNodeName: string, parentNodeId: number): void {
    // function to add subnode
    if (subNodeName.trim() === '' || isNaN(parentNodeId)) {
      // if empty name or node id is other than number then return
      alert('Error: Invalid input.');
      return;
    }

    const subNode = {
      // object for storing subnode
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
        this.fetchNodes(); // Ensure you fetch the latest data
      },
      error: (err) => console.error('Error adding subnode:', err),
    });
  }

  findNodeById(nodes: TreeNode[], id: number | any): TreeNode | null {
    // function to find node by its id
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      } else if (node.children) {
        const foundNode = this.findNodeById(node.children, id);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return null;
  }
  // moveNodetest(nodeId: number, newParentId: number) {
  //   const findNode = (nodes: TreeNode[], id: number): TreeNode | null => {
  //     for (const node of nodes) {
  //       if (node.id === id) {
  //         return node;
  //       } else if (node.children) {
  //         const result = findNode(node.children, id);
  //         if (result) {
  //           return result;
  //         }
  //       }
  //     }
  //     return null;
  //   };

  //   const findParent = (nodes: TreeNode[], id: number): TreeNode | null => {
  //     for (const node of nodes) {
  //       if (node.children) {
  //         for (const child of node.children) {
  //           if (child.id === id) {
  //             return node;
  //           }
  //         }
  //         const result = findParent(node.children, id);
  //         if (result) {
  //           return result;
  //         }
  //       }
  //     }
  //     return null;
  //   };

  //   const nodeToMove = findNode(this.nodes, nodeId);
  //   const newParent = findNode(this.nodes, newParentId);

  //   if (nodeToMove && newParent) {
  //     const currentParent = findParent(this.nodes, nodeId);
  //     if (currentParent) {
  //       currentParent.children = currentParent.children!.filter(
  //         (node) => node.id !== nodeId
  //       );
  //     } else {
  //       this.nodes = this.nodes.filter((node) => node.id !== nodeId);
  //     }

  //     if (!newParent.children) {
  //       newParent.children = [];
  //     }
  //     newParent.children.push(nodeToMove);
  //     this.dataSource.data = this.nodes;
  //     this.treeControl.expand(newParent);
  //   }
  // }
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
        this.fetchNodes();
      },
      error: (err) => alert("Parent Cannot be Child of its Children"),

    });
  }

  toggleNode(node: ExampleFlatNode): void {
    this.treeControl.toggle(node);
  }
}

