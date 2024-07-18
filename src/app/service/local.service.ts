import { Injectable, OnInit } from '@angular/core';


@Injectable({
  providedIn: 'root'
})

export class LocalService implements OnInit {

  private TreeData: any[] = [];
  ngOnInit(): void {}
  constructor() {}

  setTreeData(data: any[]) {
    this.TreeData = data;
    return this.TreeData;
  }

  getTreeData() {
    return this.TreeData;
  }

  addTreeNode(data: any) { 
    this.TreeData.push(data);
  }

  addSubNode(parentNodeName: string, subNode: any) {
    const addSubNodeRecursive = (nodes: any[], parentName: string, subNode: any) => { // return tree data
      for (let node of nodes) { 
        if (node.name === parentName) { // no chidren add children
          if (!node.children) {
            node.children = [];
          }
          node.children.push(subNode); // if children add to tht array
          return true;
        } else if (node.children) { // if node itself children add to that 
          if (addSubNodeRecursive(node.children, parentName, subNode)) {
            return true; // if child have a child then again call it
          }
          console.log("test from service addsubnode")
        }
      }
      return false;
    };

    addSubNodeRecursive(this.TreeData, parentNodeName, subNode);
  }  
  nodeExists(name: string, nodes: any[]): boolean {
    for (let node of nodes) {
      if (node.name === name) {
        console.log()
        return true;
      }
      if (node.children && this.nodeExists(name, node.children)) {
        return true;
      }
    }
    return false;
  }
}
