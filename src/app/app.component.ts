import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { LocalService } from './service/local.service';

interface FoodNode {
  name: string;
  children?: FoodNode[];
}

/** Flat node with expandable and level information */
interface ExampleFlatNode {
  expandable: boolean;
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
      name: node.name,
      level: level,
    };
  };

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
      const newNode: FoodNode = { name: name, children: [] };
      this.localService.addTreeNode(newNode);
      this.updateDataSource();
    } else {
      alert("ERROR : Node Already Exists Or You've entered Invalid Node")
    }
  }

  deleteTreeNode(name: string): void {
    if (name.trim() !== '') {
      this.localService.deleteTreeNode(name);
      this.updateDataSource();
    } else {
      alert("ERROR : No Node Exists!!!");
    }
  }

  editNode(node: any): void {
    if (!this.localService.nodeExists(node, this.dataSource.data)) {
      this.selectedNode = node;
      this.editNodeName = node.name;
    }
  }
  reloadData() : any{
    return this.updateDataSource()
  }

  updateNodeName(): void {
    if (this.selectedNode && this.editNodeName.trim() !== '') {
      if (!this.localService.nodeExists(this.editNodeName, this.dataSource.data)) {
      this.localService.editTreeNode(this.selectedNode.name, this.editNodeName.trim());
      this.selectedNode = null;
      this.editNodeName = '';
      this.updateDataSource();
    }
    else{
      alert("ERROR : Node Already Present");
    }
    } else {
      alert("ERROR : Invalid Node Name");
    }
  }

  addTreeNodeWithSubNode(nodeName: string, subNodeName: string): void {
    if (nodeName.trim() !== '' && subNodeName.trim() !== '') {
      if (!this.localService.nodeExists(nodeName, this.dataSource.data)) {
        const newNode: any = { name: nodeName, children: [{ name: subNodeName }] };
        this.localService.addTreeNode(newNode);
        this.updateDataSource();
      }
    }
  }

  addSubNode(parentNodeName: string, subNodeName: string): void {
    if (parentNodeName.trim() !== '' && subNodeName.trim() !== '') {
      if (!this.localService.nodeExists(subNodeName, this.dataSource.data)) {
        const subNode: FoodNode = { name: subNodeName, children: [] };
        this.localService.addSubNode(parentNodeName, subNode);
        this.updateDataSource();
      } else {
        alert("Invalid Node Entered ")
      }
    }
  }

   updateDataSource(): any {
    const data = this.localService.getTreeData();
    this.dataSource.data = [];
    this.dataSource.data = data;
  }
}
