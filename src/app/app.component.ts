
// import { Component, OnInit } from '@angular/core';
// import { FlatTreeControl } from '@angular/cdk/tree';
// import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
// import { LocalService } from './service/local.service';

// interface TreeNode {
//   id: number;
//   name: string;
//   N_ID?: string | null;
//   children?: TreeNode[];
//   parent?: number | null;
// }

// interface ExampleFlatNode {
//   [x: string]: any;
//   expandable: boolean;
//   id: number;
//   name: string;
//   level: number;
// }


// const processNode = (node: any): TreeNode => ({
//   id: node.id || null,
//   name: node.attributes?.name || '',
//   N_ID: node.attributes?.N_ID || null,
//   parent: node.attributes?.parent?.data?.id || null,
//   children: node.attributes?.children?.map((child: any) => processNode(child)) || [],
// });


// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
// })
// export class AppComponent implements OnInit {
//   private _transformer = (node: TreeNode, level: number): ExampleFlatNode => {
//     return {
//       expandable: !!node.children && node.children.length > 0,
//       id: node.id,
//       name: node.name,
//       level: level,
//     };
//   };

//   treeFlattener = new MatTreeFlattener(
//     this._transformer,
//     (node) => node.level,
//     (node) => node.expandable,
//     (node) => node.children
//   );

//   parseStringToInt(value: string): number {
//     return parseInt(value, 10);
//   }

//   newNodeName: string = '';
//   nodes: TreeNode[] = [];
//   expandedNodeIds: Set<number> = new Set(); // Track expanded nodes


//   treeControl = new FlatTreeControl<ExampleFlatNode|any>(
//     (node) => node.level,
//     (node) => node.expandable
//   );
//   dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

//   selectedNode: ExampleFlatNode | null = null;
//   editNodeName: string = '';

//   constructor(private localService: LocalService) {}

//   hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

//   ngOnInit(): void {
//     this.fetchNodes();
//   }


// fetchNodes(): void {
//     this.localService.getNodes().subscribe({
//       next: (response) => {
//         console.log('Fetched Nodes:', response);
//         if (response && response.data) {
//           this.nodes = response.data.map((node: any) => processNode(node));
//           this.dataSource.data = this.nodes;
//         } else {
//           console.error('Invalid response format:', response);
//         }
//       },
//       error: (err) => console.error('Error fetching nodes:', err),
//     });
//   }

//   fetchChildrenNodes(node: ExampleFlatNode): void {
//     this.localService.getChildrenNodes(node.id).subscribe({
//       next: (response: any) => {
//         const parent = this.findNodeById(this.nodes, node.id);
//         if (parent) {
//           parent.children = response.data.map((child: any) => processNode(child));
//           this.treeControl.expand(node); // Expand after updating children
//           this.dataSource.data = [...this.nodes]; // Refresh dataSource to reflect changes
//         }
//       },
//       error: (err) => console.error('Error fetching children nodes:', err),
//     });
//   }


//   toggleNode(node: ExampleFlatNode): void {
//     if (this.treeControl.isExpanded(node)) {
//       this.treeControl.collapse(node);
//     } else {
//       const parentNode = this.findNodeById(this.nodes, node.id);
//       if (parentNode && (!parentNode.children || parentNode.children.length === 0)) {
//         this.fetchChildrenNodes(node); // Fetch children if they are not already loaded
//       } else {
//         this.treeControl.expand(node); // Expand node if children are already present
//       }
//     }
//   }




//   addTreeNode(name: string): void {
//     if (name.trim() !== '') {
//       const payload = {
//         data: {
//           name: name,
//         },
//       };
//       if (this.localService.nodeExistsinParent(name, this.nodes)) {
//         alert('Same name as Sibling is present');
//         return;
//       }

//       this.localService.addTreeNode(payload).subscribe({
//         next: () => {
//           this.fetchNodes();
//         },
//         error: (err) => console.error('Error adding node:', err),
//       });
//     } else {
//       alert("ERROR: Node Already Exists Or You've entered Invalid Node");
//     }
//   }

//   deleteTreeNode(id: number): void {
//     const nodeToDelete = this.findNodeById(this.nodes, id);

//     if (!nodeToDelete) {
//       alert('Node not found');
//       return;
//     }

//     if (nodeToDelete.children && nodeToDelete.children.length > 0) {
//       const confirmDelete = confirm(
//         'Selected node has children. Are you sure you want to delete it and all its children?'
//       );
//       if (!confirmDelete) {
//         return;
//       }
//     }

//     this.deleteChildren(nodeToDelete.children);

//     this.localService.deleteTreeNode(id).subscribe({
//       next: () => this.fetchNodes(),
//       error: (err) => console.error('Error deleting node:', err),
//     });
//   }

//   private deleteChildren(children: TreeNode[] | undefined): void {
//     if (!children) return;

//     for (const child of children) {
//       this.deleteChildren(child.children);
//       this.localService.deleteTreeNode(child.id).subscribe({
//         next: () => console.log(`Deleted child node with id: ${child.id}`),
//         error: (err) => console.error('Error deleting child node:', err),
//       });
//     }
//   }

//   editNode(node: ExampleFlatNode): void {
//     this.selectedNode = node;
//     this.editNodeName = node.name;
//   }

//   updateNodeName(node: ExampleFlatNode, newName: string) {
//     const updatedNode = {
//       id: node.id,
//       name: newName,
//       parent: node['parent'],
//     };

//     this.localService.updateNode(node.id, updatedNode).subscribe({
//       next: () => {
//         const confirmation = confirm('Do you really want to rename Node?');
//         if (!confirmation) {
//           return;
//         }
//         this.fetchNodes();
//         this.selectedNode = null;
//       },
//       error: (err) => console.error('Error updating node:', err),
//     });
//   }

//   cancelEdit(): void {
//     this.selectedNode = null;
//   }

//   addSubNode(subNodeName: string, parentNodeId: number): void {
//     if (subNodeName.trim() === '' || isNaN(parentNodeId)) {
//       alert('Error: Invalid input.');
//       return;
//     }

//     const subNode = {
//       name: subNodeName,
//       parent: parentNodeId,
//     };

//     console.log('Adding SubNode:', subNode);

//     if (
//       this.localService.nodeExists(
//         subNodeName,
//         this.findNodeById(this.nodes, parentNodeId)
//       )
//     ) {
//       alert('Error: SubNode already exists or invalid subnode.');
//       return;
//     }

//     this.localService.addSubNode(subNode).subscribe({
//       next: (response) => {
//         console.log('SubNode added successfully:', response);
//         this.fetchNodes();
//       },
//       error: (err) => console.error('Error adding subnode:', err),
//     });
//   }

//   findNodeById(nodes: TreeNode[], id: number): TreeNode | null {
//     for (const node of nodes) {
//       if (node.id === id) {
//         return node;
//       } else if (node.children) {
//         const foundNode = this.findNodeById(node.children, id);
//         if (foundNode) {
//           return foundNode;
//         }
//       }
//     }
//     return null;
//   }

//   moveNode(nodeId: number, newParentId: number): void {
//     const confirmation = confirm(
//       'Do you really want to move the selected node to the new parent node?'
//     );
//     if (!confirmation) {
//       return;
//     }

//     if (nodeId === newParentId) {
//       alert('Error: A node cannot be moved to itself.');
//       return;
//     }

//     this.localService.moveNode(nodeId, newParentId).subscribe({
//       next: (response) => {
//         console.log('Node moved successfully:', response);
//         this.fetchNodes();
//       },
//       error: (err) => alert("Parent Cannot be Child of its Children"),
//     });
//   }

// }

import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface TreeNode {
  id: number;
  name: string;
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
  id: node.id || null,
  name: node.attributes?.name || '',
  N_ID: node.attributes?.N_ID || null,
  parent: node.attributes?.parent?.data?.id || null,
  children: node.attributes?.children?.map((child: any) => processNode(child)) || [],
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private _transformer = (node: TreeNode, level: number): ExampleFlatNode => {
    return {
      expandable: !!node.children && node.children.length > 0,
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

  newNodeName: string = '';
  nodes: TreeNode[] = [];
  expandedNodeIds: Set<number> = new Set(); // Track expanded nodes

  treeControl = new FlatTreeControl<ExampleFlatNode|any>(
    (node) => node.level,
    (node) => node.expandable
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  selectedNode: ExampleFlatNode | null = null;
  editNodeName: string = '';
  filteredDataSource: TreeNode[] = [];

  constructor(private localService: LocalService) {}

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  ngOnInit(): void {
    this.fetchNodes();
  }
    parseStringToInt(value: string): number {
    return parseInt(value, 10);
  }

  fetchNodes(): void {
    this.localService.getNodes().subscribe({
      next: (response) => {
        console.log('Fetched Nodes:', response);
        if (response && response.data) {
          this.nodes = response.data.map((node: any) => processNode(node));
          this.dataSource.data = this.nodes;
          this.treeControl.dataNodes = this.dataSource.data;
          this.treeControl.expandAll();
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching nodes:', err),
    });
  }


  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.trim().toLowerCase();

    this.localService.getNodes().subscribe({
      next: (response) => {
        console.log('Fetched Nodes:', response);
        if (response && response.data) {
          const allNodes = response.data.map((node: any) => processNode(node));
          const filteredNodes = this.filterNodes(allNodes, filterValue);
          this.filteredDataSource = filteredNodes;
          this.dataSource.data = this.filteredDataSource;
          this.treeControl.expandAll()
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching nodes:', err),
    });

    // this.treeControl.expandAll();
  }

  filterNodes(nodes: TreeNode[], filterValue: string): TreeNode[] {
    const filteredNodes: TreeNode[] = [];

    nodes.forEach(node => {

      if (node.name.toLowerCase().includes(filterValue)) {
        filteredNodes.push(node);
      } else if (node.children) {
        const filteredChildren = this.filterNodes(node.children, filterValue);
        if (filteredChildren.length > 0) {
          filteredNodes.push({ ...node, children: filteredChildren });
        }
      }
    });
    // this.treeControl.expandAll()
    return filteredNodes;
  }
  fetchChildrenNodes(node: ExampleFlatNode): void {
    console.log('fetchChildrenNodes called for node id:', node.id); // Debug line
    this.localService.getChildrenNodes(node.id).subscribe({
      next: (response: any) => {
        console.log('Fetched children nodes:', response); // Debug line
        const parent = this.findNodeById(this.nodes, node.id);
        if (parent) {
          parent.children = response.data.map((child: any) => processNode(child));
          this.treeControl.expand(node); // Expand after updating children
          this.dataSource.data = [...this.nodes]; // Refresh dataSource to reflect changes
        }
      },
      error: (err) => console.error('Error fetching children nodes:', err),
    });
  }


  toggleNode(node: ExampleFlatNode): void {
    console.log('Toggling node:', node); // Debug line
    if (this.treeControl.isExpanded(node)) {
      this.treeControl.collapse(node);
    } else {
      const parentNode = this.findNodeById(this.nodes, node.id);
      console.log('Parent node:', parentNode); // Debug line
      if (parentNode && (!parentNode.children || parentNode.children.length === 0)) {
        console.log('Fetching children for node:', node.id); // Debug line
        this.fetchChildrenNodes(node); // Fetch children if they are not already loaded
      } else {
        this.treeControl.expand(node); // Expand node if children are already present
      }
    }}


  addTreeNode(name: string): void {
    if (name.trim() !== '') {
      const payload = {
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
          this.fetchNodes();
        },
        error: (err) => console.error('Error adding node:', err),
      });
    } else {
      alert("ERROR: Node Already Exists Or You've entered Invalid Node");
    }
  }

  deleteTreeNode(id: number): void {
    const nodeToDelete = this.findNodeById(this.nodes, id);

    if (!nodeToDelete) {
      alert('Node not found');
      return;
    }

    if (nodeToDelete.children && nodeToDelete.children.length > 0) {
      const confirmDelete = confirm(
        'Selected node has children. Are you sure you want to delete it and all its children?'
      );
      if (!confirmDelete) {
        return;
      }
    }

    this.deleteChildren(nodeToDelete.children);

    this.localService.deleteTreeNode(id).subscribe({
      next: () => this.fetchNodes(),
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

  editNode(node: ExampleFlatNode): void {
    this.selectedNode = node;
    this.editNodeName = node.name;
  }

  updateNodeName(node: ExampleFlatNode|any, newName: string) {
    const updatedNode = {
      id: node.id,
      name: newName,
      parent: node['parent'],
    };

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
        this.fetchNodes();
      },
      error: (err) => console.error('Error adding subnode:', err),
    });
  }

  findNodeById(nodes: TreeNode[], id: number): TreeNode | null {
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
}

// import { Component, OnInit } from '@angular/core';
// import { FlatTreeControl } from '@angular/cdk/tree';
// import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
// import { LocalService } from './service/local.service';

// interface TreeNode {
//   id: number;
//   name: string;
//   N_ID?: string | null;
//   children?: TreeNode[];
//   parent?: number | null;
//   hasChildren?: boolean;
//   childrenLoaded?: boolean; // New property to indicate if children are loaded
// }

// interface ExampleFlatNode {
//   expandable: boolean;
//   id: number;
//   name: string;
//   level: number;
// }

// const processNode = (node: any): TreeNode => ({
//   id: node.id || null,
//   name: node.attributes?.name || '',
//   N_ID: node.attributes?.N_ID || null,
//   parent: node.attributes?.parent?.data?.id || null,
//   children: node.attributes?.children?.map((child: any) => processNode(child)) || [],
//   hasChildren: node.attributes?.hasChildren || false,
//   childrenLoaded: false, // Initialize as false
// });


// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
// })
// export class AppComponent implements OnInit {
//   private _transformer = (node: TreeNode, level: number): ExampleFlatNode => {
//     return {
//       expandable: !!node.hasChildren,
//       id: node.id,
//       name: node.name,
//       level: level,
//     };
//   };

//   treeFlattener = new MatTreeFlattener(
//     this._transformer,
//     (node) => node.level,
//     (node) => node.expandable,
//     (node) => node.children
//   );

//   newNodeName: string = '';
//   nodes: TreeNode[] = [];
//   expandedNodeIds: Set<number> = new Set();

//   treeControl = new FlatTreeControl<ExampleFlatNode>(
//     (node) => node.level,
//     (node) => node.expandable
//   );
//   dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

//   selectedNode: ExampleFlatNode | null = null;
//   editNodeName: string = '';
//   filteredDataSource: TreeNode[] = [];

//   constructor(private localService: LocalService) {}

//   hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

//   ngOnInit(): void {
//     this.fetchNodes();
//   }

//   parseStringToInt(value: string): number {
//     return parseInt(value, 10);
//   }

//   fetchNodes(): void {
//     this.localService.getNodes().subscribe({
//       next: (response) => {
//         console.log('Fetched Nodes:', response);
//         if (response && response.data) {
//           this.nodes = response.data.map((node: any) => processNode(node));
//           this.filteredDataSource = [...this.nodes];
//           this.dataSource.data = this.filteredDataSource;
//         } else {
//           console.error('Invalid response format:', response);
//         }
//       },
//       error: (err) => console.error('Error fetching nodes:', err),
//     });
//   }

//   applyFilter(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     const filterValue = input.value.trim().toLowerCase();
//     this.filteredDataSource = this.filterNodes(this.nodes, filterValue);
//     this.dataSource.data = this.filteredDataSource;
//     this.treeControl.expandAll();
//   }

//   filterNodes(nodes: TreeNode[], filterValue: string): TreeNode[] {
//     const filteredNodes: TreeNode[] = [];
//     nodes.forEach(node => {
//       if (node.name.toLowerCase().includes(filterValue)) {
//         filteredNodes.push(node);
//       } else if (node.children) {
//         const filteredChildren = this.filterNodes(node.children, filterValue);
//         if (filteredChildren.length > 0) {
//           filteredNodes.push({ ...node, children: filteredChildren });
//         }
//       }
//     });
//     return filteredNodes;
//   }

//   fetchChildrenNodes(node: ExampleFlatNode): void {
//     console.log('fetchChildrenNodes called for node id:', node.id);
//     const parentNode = this.findNodeById(this.nodes, node.id);
//     if (parentNode && !parentNode.childrenLoaded) {
//       this.localService.getChildrenNodes(node.id).subscribe({
//         next: (response: any) => {
//           console.log('Fetched children nodes:', response);
//           parentNode.children = response.data.map((child: any) => processNode(child));
//           parentNode.childrenLoaded = true;
//           this.treeControl.expand(node);
//           this.dataSource.data = [...this.nodes];
//         },
//         error: (err) => console.error('Error fetching children nodes:', err),
//       });
//     } else {
//       this.treeControl.toggle(node);
//     }
//   }

//   toggleNode(node: ExampleFlatNode): void {
//     console.log('Toggling node:', node);
//     const parentNode = this.findNodeById(this.nodes, node.id);
//     console.log('Parent node:', parentNode);
//     if (parentNode && !parentNode.childrenLoaded) {
//       console.log('Fetching children for node:', node.id);
//       this.fetchChildrenNodes(node);
//     } else {
//       this.treeControl.toggle(node);
//     }
//   }

//   addTreeNode(name: string): void {
//     if (name.trim() !== '') {
//       const payload = {
//         data: {
//           name: name,
//         },
//       };
//       if (this.localService.nodeExistsinParent(name, this.nodes)) {
//         alert('Same name as Sibling is present');
//         return;
//       }

//       this.localService.addTreeNode(payload).subscribe({
//         next: () => {
//           this.fetchNodes();
//         },
//         error: (err) => console.error('Error adding node:', err),
//       });
//     } else {
//       alert("ERROR: Node Already Exists Or You've entered Invalid Node");
//     }
//   }

//   deleteTreeNode(id: number): void {
//     const nodeToDelete = this.findNodeById(this.nodes, id);

//     if (!nodeToDelete) {
//       alert('Node not found');
//       return;
//     }

//     if (nodeToDelete.children && nodeToDelete.children.length > 0) {
//       const confirmDelete = confirm(
//         'Selected node has children. Are you sure you want to delete it and all its children?'
//       );
//       if (!confirmDelete) {
//         return;
//       }
//     }

//     this.deleteChildren(nodeToDelete.children);

//     this.localService.deleteTreeNode(id).subscribe({
//       next: () => this.fetchNodes(),
//       error: (err) => console.error('Error deleting node:', err),
//     });
//   }

//   private deleteChildren(children: TreeNode[] | undefined): void {
//     if (!children) return;

//     for (const child of children) {
//       this.deleteChildren(child.children);
//       this.localService.deleteTreeNode(child.id).subscribe({
//         next: () => console.log(`Deleted child node with id: ${child.id}`),
//         error: (err) => console.error('Error deleting child node:', err),
//       });
//     }
//   }

//   editNode(node: ExampleFlatNode): void {
//     this.selectedNode = node;
//     this.editNodeName = node.name;
//   }

//   updateNodeName(node: ExampleFlatNode | any, newName: string) {
//     const updatedNode = {
//       id: node.id,
//       name: newName,
//       parent: node['parent'],
//     };

//     this.localService.updateNode(node.id, updatedNode).subscribe({
//       next: () => {
//         const confirmation = confirm('Do you really want to rename Node?');
//         if (!confirmation) {
//           return;
//         }
//         this.fetchNodes();
//         this.selectedNode = null;
//       },
//       error: (err) => console.error('Error updating node:', err),
//     });
//   }

//   cancelEdit(): void {
//     this.selectedNode = null;
//   }

//   addSubNode(subNodeName: string, parentNodeId: number): void {
//     if (subNodeName.trim() === '' || isNaN(parentNodeId)) {
//       alert('Error: Invalid input.');
//       return;
//     }

//     const subNode = {
//       name: subNodeName,
//       parent: parentNodeId,
//     };

//     console.log('Adding SubNode:', subNode);

//     if (
//       this.localService.nodeExists(
//         subNodeName,
//         this.findNodeById(this.nodes, parentNodeId)
//       )
//     ) {
//       alert('Error: SubNode already exists or invalid subnode.');
//       return;
//     }

//     this.localService.addSubNode(subNode).subscribe({
//       next: (response) => {
//         console.log('SubNode added successfully:', response);
//         this.fetchNodes();
//       },
//       error: (err) => console.error('Error adding subnode:', err),
//     });
//   }

//   findNodeById(nodes: TreeNode[], id: number): TreeNode | null {
//     for (const node of nodes) {
//       if (node.id === id) {
//         return node;
//       }
//       if (node.children && node.children.length > 0) {
//         const foundNode = this.findNodeById(node.children, id);
//         if (foundNode) {
//           return foundNode;
//         }
//       }
//     }
//     return null;
//   }
//   moveNode(nodeId: number, newParentId: number): void {
//       const confirmation = confirm(
//         'Do you really want to move the selected node to the new parent node?'
//       );
//       if (!confirmation) {
//         return;
//       }

//       if (nodeId === newParentId) {
//         alert('A node cannot be moved to itself');
//         return;
//       }

//       this.localService.moveNode(nodeId, newParentId).subscribe({
//         next: (response) => {
//           console.log('Node moved successfully:', response);
//           this.fetchNodes();
//         },
//         error: (err) => alert("Parent Cannot be Child of its Children"),
//       });
//     }

// }

