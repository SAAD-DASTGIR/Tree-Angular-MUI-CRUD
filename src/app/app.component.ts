import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
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
  children:
    node.attributes?.children?.map((child: any) => processNode(child)) || [],
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

  treeControl = new FlatTreeControl<ExampleFlatNode | any>(
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
          this.treeControl.expandAll();
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (err) => console.error('Error fetching nodes:', err),
    });
  }

  filterNodes(nodes: TreeNode[], filterValue: string): TreeNode[] {
    const filteredNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      if (node.name.toLowerCase().includes(filterValue)) {
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
 //  USED IN PAGINATION   //
  fetchChildrenNodes(node: ExampleFlatNode): void {
    console.log('fetchChildrenNodes called for node id:', node.id); // Debug line
    this.localService.getChildrenNodes(node.id).subscribe({
      next: (response: any) => {
        console.log('Fetched children nodes:', response); // Debug line
        const parent = this.findNodeById(this.nodes, node.id);
        if (parent) {
          parent.children = response.data.map((child: any) =>
            processNode(child)
          );
          this.treeControl.expand(node); // Expand after updating children
          this.dataSource.data = [...this.nodes]; // Refresh dataSource to reflect changes
        }
      },
      error: (err) => console.error('Error fetching children nodes:', err),
    });
  }
 // CUSTOM TOGGLE BECAUSE WILL REUSE IN PAGINATION //
  toggleNode(node: ExampleFlatNode): void {
    console.log('Toggling node:', node); // Debug line
    if (this.treeControl.isExpanded(node)) {
      this.treeControl.collapse(node);
    } else {
      const parentNode = this.findNodeById(this.nodes, node.id);
      console.log('Parent node:', parentNode); // Debug line
      if (
        parentNode &&
        (!parentNode.children || parentNode.children.length === 0)
      ) {
        console.log('Fetching children for node:', node.id); // Debug line
        this.fetchChildrenNodes(node); // Fetch children if they are not already loaded
      } else {
        this.treeControl.expand(node); // Expand node if children are already present
      }
    }
  }

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
