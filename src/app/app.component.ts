// import { Component, OnInit } from '@angular/core';
// import { FlatTreeControl } from '@angular/cdk/tree';
// import {
//   MatTreeFlatDataSource,
//   MatTreeFlattener,
// } from '@angular/material/tree';
// import { LocalService } from './service/local.service';

// interface TreeNode {
//   id: number; // used bcz automatically generated by the strapi
//   name: string; // name to identify
//   N_ID?: string | null; // optional
//   children?: TreeNode[]; // children array
//   parent?: number | null;
// }

// interface ExampleFlatNode {
//   expandable: boolean;
//   id: number;
//   name: string;
//   level: number;
// }

// const processNode = (node: any): TreeNode => ({ // structure to display as tree
//   id: node.id || null,
//   name: node.attributes?.name || '',
//   N_ID: node.attributes?.N_ID || null,
//   parent: node.attributes?.parent?.data?.id || null,
//   children:
//     node.attributes?.children?.map((child: any) => processNode(child)) || [],
// });

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
// })
// export class AppComponent implements OnInit {
//   private _transformer = (node: TreeNode, level: number): ExampleFlatNode => {// used to display data
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

//   newNodeName: string = ''; // used for edit
//   nodes: TreeNode[] = []; //single each node
//   expandedNodeIds: Set<number> = new Set(); // Track expanded nodes

//   treeControl = new FlatTreeControl<ExampleFlatNode | any>(
//     (node) => node.level,
//     (node) => node.expandable
//   );
//   dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

//   selectedNode: ExampleFlatNode | null = null;
//   editNodeName: string = '';
//   filteredDataSource: TreeNode[] = [];

//   constructor(private localService: LocalService) {}

//   hasChild = (_: number, node: ExampleFlatNode) => node.expandable; // used to findout it has children or not

//   ngOnInit(): void {
//     this.fetchNodes(); // fetch all nodes
//   }
//   parseStringToInt(value: string): number {
//     return parseInt(value, 10); // used to markup to get id as number
//   }

//   fetchNodes(): void { // function to fetch all nods for backend
//     this.localService.getNodes().subscribe({
//       next: (response) => {
//         console.log('API Response:', response); // structured responce from strapi
//         if (response && response.data) {
//           // if we get response then map
//           this.nodes = response.data?.map((node: any) => processNode(node));// shaping data from backend
//           console.log('Processed Nodes:', this.nodes);
//           this.dataSource.data = this.nodes;
//           this.treeControl.expandAll(); // expand all nodes
//           this.treeControl.dataNodes = this.nodes;
//           // this.treeControl.expandAll();
//           console.log(this.treeControl.dataNodes); // display nodes
//         } else {
//           console.error('Invalid response format:', response);
//         }
//       },
//       error: (err) => console.error('Error fetching nodes:', err),
//     });
//   }

//   applyFilter(event: Event): void { // function to fetch using names from whole database
//     const input = event.target as HTMLInputElement; // using bcz of eack keystroke
//     const filterValue = input.value.trim().toLowerCase(); // convert all values into lowercase
//     this.localService.getNodes().subscribe({ // callig services display matched
//       next: (response) => {
//         console.log('Fetched Nodes:', response);
//         if (response && response.data) {
//           const allNodes = response.data.map((node: any) => processNode(node)); // again form the structure of nodes
//           const filteredNodes = this.filterNodes(allNodes, filterValue); // pass the filtered nodes
//           this.filteredDataSource = filteredNodes;
//           this.dataSource.data = this.filteredDataSource; // passed into datasource
//           this.treeControl.expandAll(); //expand all the tree
//         } else {
//           console.error('Invalid response format:', response);
//         }
//       },
//       error: (err) => console.error('Error fetching nodes:', err),
//     });
//   }

//   filterNodes(nodes: TreeNode[], filterValue: string): TreeNode[] { // function to findout matched nodes from database
//     const filteredNodes: TreeNode[] = [];

//     nodes.forEach((node) => {
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
//  //  USED IN PAGINATION   //
//   fetchChildrenNodes(node: ExampleFlatNode): void {
//     console.log('fetchChildrenNodes called for node id:', node.id); // Debug line
//     this.localService.getChildrenNodes(node.id).subscribe({
//       next: (response: any) => {
//         console.log('Fetched children nodes:', response); // Debug line
//         const parent = this.findNodeById(this.nodes, node.id);
//         if (parent) {
//           parent.children = response.data.map((child: any) =>
//             processNode(child)
//           );
//           this.treeControl.expand(node); // Expand after updating children
//           this.dataSource.data = [...this.nodes]; // Refresh dataSource to reflect changes
//         }
//       },
//       error: (err) => console.error('Error fetching children nodes:', err),
//     });
//   }
//  // CUSTOM TOGGLE BECAUSE WILL REUSE IN PAGINATION //
//   toggleNode(node: ExampleFlatNode): void {
//     console.log('Toggling node:', node);
//     if (this.treeControl.isExpanded(node)) {
//       this.treeControl.collapse(node);
//     } else {
//       const parentNode = this.findNodeById(this.nodes, node.id);
//       console.log('Parent node:', parentNode);
//       if (
//         parentNode &&
//         (!parentNode.children || parentNode.children.length === 0)
//       ) {
//         console.log('Fetching children for node:', node.id); // not working bcz i merge into fetched node also
//         this.fetchChildrenNodes(node); // Fetch children if they are not already loaded
//       } else {
//         this.treeControl.expand(node); // Expand node if children are already present
//       }
//     }
//   }

//   addTreeNode(name: string): void { // function to add tree
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

//   deleteTreeNode(id: number): void { // function to delete whole tree data
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
//     if (!newName.trim()) {
//       alert("ERROR: Name cannot be empty.");
//       return;
//     }

//     // Find the parent node
//     const parentNode = this.findNodeById(this.nodes, node.parent);

//     // Check if the new name already exists among the siblings (excluding the node itself)
//     if (
//       parentNode &&
//       parentNode.children?.some((child: TreeNode) =>
//         child.name.trim().toLowerCase() === newName.trim().toLowerCase() && child.id !== node.id
//       )
//     ) {
//       alert('A sibling with this name already exists. Please choose a different name.');
//       return;
//     }

//     const updatedNode = {
//       id: node.id,
//       name: newName,
//       parent: node.parent,
//     };

//     const confirmation = confirm('Do you really want to rename this node?');
//     if (!confirmation) {
//       return;
//     }

//     this.localService.updateNode(node.id, updatedNode).subscribe({
//       next: () => {
//         console.log('Node updated successfully');
//         this.fetchNodes(); // Refresh the nodes after update
//         this.selectedNode = null;
//       },
//       error: (err) => {
//         console.error('Error updating node:', err);
//         alert('Error updating node');
//       },
//     });
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


//   findNodeById(nodes: TreeNode[], id: number | any): TreeNode | null {
//     // function to find node by its id
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
//       error: (err) => alert('Parent Cannot be Child of its Children'),
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
  haschild: boolean;
}


interface ExampleFlatNode { // interface to use i mattree
  expandable: boolean;
  id: number;
  name: string;
  level: number;
  haschild: boolean;
  children ?: ExampleFlatNode[]
}

const processNode = (node: any): TreeNode => ({
  id: node.id || null,
  name: node.attributes?.name || '',
  N_ID: node.attributes?.N_ID || null,
  parent: node.attributes?.parent?.data?.id || null,
  haschild: node.attributes?.hasChild ,  // Use hasChild from backend
  children: node.attributes?.children?.map((child: any) => processNode(child)) || [],
});



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private _transformer = (node: TreeNode, level: number): ExampleFlatNode => ({
    expandable: !!node.haschild,  // Check if haschild is true
    id: node.id,
    name: node.name,
    level: level,
    haschild: node.haschild
  });



  treeFlattener = new MatTreeFlattener( // flattener to transform
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  newNodeName: string = ''; // used in edit functionality to assign name
  nodes: TreeNode[] = []; // nodes of array in tree structure
  expandedNodeIds: Set<number> = new Set(); // used bca to get parent id and fetch children

  treeControl = new FlatTreeControl<ExampleFlatNode|any>( // to expand and collaspe
    node => node.level,
    node => node.expandable
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener); // passing the datasource

  selectedNode: ExampleFlatNode | null = null; // select node to edit
  editNodeName: string = ''; // variable for edited new name
  filteredDataSource: TreeNode[] = []; // return filtered tree structure

  constructor(private localService: LocalService) {}

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable; // to ind out whether it has children or not

  ngOnInit(): void { // on intializes fetch load nodes mainly parents
    this.fetchNodes();
    this.treeControl.expandAll()
  }

  parseStringToInt(value: string): number { // used to get parent id because sometimes it consider as string
    return parseInt(value, 10); // q0 for integer
  }

  fetchNodes(page: number = 1, pageSize: number = 10): void { // used pagination data
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
    const input = event.target as HTMLInputElement; // passed as event
    const filterValue = input.value.trim().toLowerCase();

    // Call the service to get filtered nodes from the backend
    this.localService.getFilterNodes(filterValue).subscribe({ // from all database
      next: (response) => {
        console.log('Fetched Filtered Nodes:', response);
        if (response && response.data) {
          const allNodes = response.data.map((node: any) => processNode(node));
          const filteredNodes = this.filterNodes(allNodes, filterValue); // Local filter for hierarchy
          this.filteredDataSource = filteredNodes;
          this.dataSource.data = this.filteredDataSource;
          this.treeControl.expandAll()
          if(filterValue===""){
            const flattenedData = this.flattenTree(this.nodes);
            this.dataSource.data = flattenedData;
          }

        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching filtered nodes:', err),
    });
  }

  filterNodes(nodes: TreeNode[], filterValue: string): TreeNode[] { // function to findout matched nodes from database
    const filteredNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      if (node.name.toLowerCase().includes(filterValue)) { // convert each to lowercase
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
    this.localService.getChildrenNodes(node.id).subscribe({ // giving parent id find its children
      next: (response) => {
        if (response && response.data) {
          const childrenNodes = response.data.map((child: any) => processNode(child));
          const parentNode = this.findNodeById(this.nodes, node.id);
          if (parentNode) {
            parentNode.children = childrenNodes; // Add fetched children
            this.updateTreeData(); // Update tree data and re-flatten the tree
            this.treeControl.expand(this.treeControl.dataNodes.find(n => n.id === node.id));
          } else {
            console.error('Parent node not found for ID:', node.id);
          }
        }
      },
      error: (err) => console.error('Error fetching children nodes:', err),
    });
  }
  updateTreeData() {
    // console.log("test")
    // console.log('Updating Tree Data...');
    // console.log('Original Nodes Structure:', JSON.stringify(this.nodes, null, 2));

    // Re-flatten the tree structure and update the data source
    const flattenedData = this.flattenTree(this.nodes);
    this.dataSource.data = flattenedData;
    this.treeControl.expandAll()
    this.treeControl.dataNodes = flattenedData;
    this.treeControl.expandAll()
    console.log('Updated Flattened Tree:', this.dataSource.data);
  }

  flattenTree(nodes: TreeNode[], level: number = 0, addedIds: Set<number> = new Set()): ExampleFlatNode[] {
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
        expandable:false,
        children: [] // Initialize as an empty array
      };

      // Add the node's ID to the set to avoid duplicates
      addedIds.add(node.id);
      // Add the flat node to the result list
      result.push(flatNode);

      // Recursively flatten the children, incrementing the level
      if (node.children && node.children.length > 0) {
        const childrenFlatNodes = this.flattenTree(node.children, level + 1, addedIds);
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
    if (parentNode && (!parentNode.children || parentNode.children.length === 0)) {
      this.fetchChildrenNodes(node);
      this.treeControl.toggle(node)
    } else {
      this.treeControl.toggle(node);
      // this.expandNodes(this.expandedNodeIds); // Reapply expanded nodes
    }
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
      const confirmDelete = confirm('Selected node has children. Are you sure you want to delete it and all its children?');
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
      alert("ERROR: Name cannot be empty.");
      return;
    }

    // Find the parent node
    const parentNode = this.findNodeById(this.nodes, node.parent);

    // Check if the new name already exists among the siblings (excluding the node itself)
    if (
      parentNode &&
      parentNode.children?.some((child: TreeNode) =>
        child.name.trim().toLowerCase() === newName.trim().toLowerCase() && child.id !== node.id
      )
    ) {
      alert('A sibling with this name already exists. Please choose a different name.');
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
        this.fetchNodes(); // Refresh the nodes after update
        this.selectedNode = null;
      },
      error: (err) => {
        console.error('Error updating node:', err);
        alert('Error updating node');
      },
    });
  }

  cancelEdit(): void { // will use in future to optimize
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
      error: (err) => alert('Parent Cannot be Child of its Children'),
    });
  }
}
