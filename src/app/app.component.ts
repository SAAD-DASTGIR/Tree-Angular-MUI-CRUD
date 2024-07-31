import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface FoodNode { // interface from angular mui taken
  id?: number;
  name: string;
  children?: FoodNode[];
}

interface TreeNode { // custom interface according to strapi
  id: number;
  name: string;
  N_ID?: string | null; // optional bcz strapi also generate itself a id
  children?: TreeNode[];
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
  fetchNodes(): void { // function to the load the node data
    this.localService.getNodes().subscribe({
      next: (response) => {
        this.nodes = response.data.map((item: any) => ({
          id: item.id, // fetch its id, used for adding subnode
          name: item.attributes.name, // fetch name, also attributes is used bcz api response from strapi give this in default
          children: item.attributes.children || [] // fetch children or give empty array
        }));
        this.dataSource.data = this.nodes; // loads data in the datasource
        this.treeControl.dataNodes = this.dataSource.data; // passed that datasource to treecontrol
        this.treeControl.expandAll(); // Optional: Expand all nodes
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
      if (this.localService.nodeExists(name, this.nodes)) { // need fixing
        console.error('Node name already exists');
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

  deleteTreeNode(id: number): void { // passing id to delete the node
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
    if (this.localService.nodeExists(newName, this.nodes)) {
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

  // addSubNode(parentNodeId: number | TreeNode, subNodeName: string) { // function to add subnode
  //   let parentNode: TreeNode | undefined | any; // defining parent node
  //   if (typeof parentNodeId === 'number') {// checking type of node bcz sometimes it gives it as string
  //     parentNode = this.findNodeById(this.nodes, parentNodeId);
  //   } else {
  //     parentNode = parentNodeId;
  //   }

  //   console.log('Parent node:', parentNode);

  //   if (!parentNode || typeof parentNode !== 'object') { //check for vailidating parentnode ID
  //     console.error('Invalid parent node:', parentNode);
  //     return;
  //   }

  //   if (!Array.isArray(parentNode.children)) {
  //     parentNode.children = [];
  //   }

  //   if (this.localService.nodeExists(subNodeName, parentNode.children)) {
  //     console.error('Subnode name already exists under this parent');
  //     return;
  //   }

  //   const newSubNode = { // object for adding new subnode bcz on frontend we have name and parentid
  //     name: subNodeName,
  //     parentId: parentNode.id
  //   };

  //   this.localService.addSubNode(newSubNode).subscribe({ // calling the service and passing the newSubNode data
  //     next: (data: any) => {
  //       console.log('Subnode added successfully:', data);
  //       const newNode = {
  //         id: data.data.id,
  //         name: data.data.attributes.name,
  //         N_ID: data.data.attributes.N_ID,
  //         children: []
  //       };
  //       parentNode.children.push(newNode);// adds to children of the parents
  //       this.dataSource.data = this.nodes;
  //       this.treeControl.dataNodes = this.dataSource.data; // pass that datasource to the tree control
  //       // this.fetchNodes()
  //     },
  //     error: (error: any) => {
  //       console.error('Error adding subnode:', error);
  //     }
  //   });
  // }

  // findNodeById(nodes: TreeNode[], id: number): TreeNode | undefined { // fc to identify the node from its id in array of ojects
  //   for (let node of nodes) {
  //     if (node.id === id) {
  //       return node;
  //     }
  //     if (node.children) {
  //       const childNode = this.findNodeById(node.children, id);
  //       if (childNode) {
  //         return childNode;
  //       }
  //     }
  //   }
  //   return undefined;
  // }

  addSubNode(parentNodeId: number, subNodeName: string): void {
    let parentNode: TreeNode | undefined = this.findNodeById(this.nodes, parentNodeId);

    if (!parentNode) {

      console.error('Invalid parent node:', parentNodeId);
      alert(`Invalid parent node: ${parentNodeId}`)
      return;
    }

    if (!subNodeName.trim()) {
      console.error('Invalid sub node name');
      return;
    }

    if (this.localService.nodeExists(subNodeName, parentNode.children || [])) {
      console.error('Subnode name already exists under this parent');
      return;
    }

    const newSubNode = {
      name: subNodeName,
      parent: parentNodeId
    };

    this.localService.addSubNode(newSubNode).subscribe({
      next: (response) => {
        console.log('Response from addSubNode:', response); // Log the response
        const addedNode = response.data;
        const newNode: TreeNode = {
          id: addedNode.id,
          name: addedNode.attributes.name,
          N_ID: addedNode.attributes.N_ID, // optional
          children: addedNode.attributes.children || [] //optional
        };
        if(parentNode){
          parentNode.children = parentNode?.children || []
        }
        else{
          console.log("test")//test
        }
        parentNode?.children?.push(newNode); // Add the new subnode to the parent's children array
        this.dataSource.data = [...this.dataSource.data]; // Refresh the data source
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
