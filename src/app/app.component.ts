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

  constructor(private localService: LocalService) {}

  ngOnInit(): void {
    this.dataSource.data = this.localService.getTreeData();
    console.log(MatTreeFlatDataSource)
    console.log(MatTreeFlattener)
    console.log(MatTreeFlattener)
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  addTreeNode(name: string): void {
    if (name.trim() !== '' && !this.localService.nodeExists(name, this.dataSource.data)) {
      const newNode: FoodNode = { name: name, children: [] };
      this.localService.addTreeNode(newNode);
      this.updateDataSource();
    }
    else{
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

  addTreeNodeWithSubNode(nodeName: string, subNodeName: string): void {
    if (nodeName.trim() !== '' && subNodeName.trim() !== '') {
      if (!this.localService.nodeExists(nodeName, this.dataSource.data)) {
        const newNode: any = { name: nodeName, children: [{ name: subNodeName }] };
        this.localService.addTreeNode(newNode);
        this.updateDataSource();
      }
    
    }
  }

  // DeleteTreeNodeWithSubNode(nodeName: string, subNodeName: string): void {
  //   if (nodeName.trim() !== '' && subNodeName.trim() !== '') {
  //     if (!this.localService.nodeExists(nodeName, this.dataSource.data)) {
  //       const newNode: any = { name: nodeName, children: [{ name: subNodeName }] };
  //       this.localService.deleteTreeNode(newNode.name);
  //       this.updateDataSource();
  //     }
    
  //   }
  // }

  addSubNode(parentNodeName: string, subNodeName: string): void {
    if (parentNodeName.trim() !== '' && subNodeName.trim() !== '') {
      if (!this.localService.nodeExists(subNodeName, this.dataSource.data)) {
        const subNode: FoodNode = { name: subNodeName, children: [] };
        this.localService.addSubNode(parentNodeName, subNode);
        this.updateDataSource();
      }
      else{
        alert("Invalid Node Entered ")
      }
    }
    // console.log("addsubnode not same name")
  }

  private updateDataSource(): void {
    const data = this.localService.getTreeData();
    this.dataSource.data = [];
    this.dataSource.data = data;
  }
}
