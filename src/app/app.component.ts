import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface FoodNode {
  id: number;
  name: string;
  children?: FoodNode[];
}

/** Flat node with expandable and level information */
interface ExampleFlatNode {
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
    return {
      expandable: !!node.children && node.children.length > 0,
      id: node.id,
      name: node.name,
      level: level,
    };
  };
  parseStringToInt(value: string): number {
    return parseInt(value, 10);
  }
  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level, 
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  selectedNode: ExampleFlatNode | null = null;
  editNodeName: string = '';

  constructor(private localService: LocalService) {}

  ngOnInit(): void {
    this.dataSource.data = this.localService.getTreeData();
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  addTreeNode(name: string): void {
    if (name.trim() !== '' && !this.localService.nodeExists(name, this.dataSource.data)) {
      this.localService.addTreeNode(name);
      this.updateDataSource();
    } else {
      alert("ERROR : Node Already Exists Or You've entered Invalid Node")
    }
  }

  deleteTreeNode(id: number): void {
    this.localService.deleteTreeNode(id);
    this.updateDataSource();
  }

  editNode(node: ExampleFlatNode): void {
    this.selectedNode = node;
    this.editNodeName = node.name;
  }

  updateNodeName(): void {
    if (this.selectedNode && this.editNodeName.trim() !== '') {
      if (!this.localService.nodeExists(this.editNodeName, this.dataSource.data)) {
        this.localService.editTreeNode(this.selectedNode.id, this.editNodeName.trim());
        this.selectedNode = null;
        this.editNodeName = '';
        this.updateDataSource();
      } else {
        alert("ERROR : Node Already Present");
      }
    } else {
      alert("ERROR : Invalid Node Name");
    }
  }
// checks not working properly
  addSubNode(parentId: number, subNodeName: string): void {
    if (subNodeName.trim() !== '') {
      this.localService.addSubNode(parentId, subNodeName);
      this.updateDataSource();
    } else {
      alert("Invalid Node Entered ");
    }
  }
  
// checks not working properly sercvice need to show alert when swaping parenet with child

  moveNode(nodeId: number, newParentId: number): void {
    this.localService.moveNode(nodeId, newParentId);
    this.updateDataSource();
  }

  updateDataSource(): void {
    const data = this.localService.getTreeData();
    this.dataSource.data = [];
    this.dataSource.data = data;
  }

  
}
