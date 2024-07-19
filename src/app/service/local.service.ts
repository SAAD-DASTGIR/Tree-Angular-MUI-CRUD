import { Injectable, OnInit } from '@angular/core';


@Injectable({
  providedIn: 'root'
})

export class LocalService implements OnInit {

  private TreeData: any[] = [];
  ngOnInit(): void {
    
  }
  constructor() {}

  setTreeData(data: any[]) { // arraylist of tree data
    this.TreeData = data;
    return this.TreeData;
  }

  getTreeData() {
    return this.TreeData;
  }

  addTreeNode(data: any) { 
    this.TreeData.push(data);
  }
  deleteTreeNode(nodeName: string): void {
    const deleteNodeRecursive = (nodes: any[], name: string): any[] => {
      return nodes.filter(node => {
        if (node.name === name) { // if node name matches
          return false;
        }
        if (node.children) { // if its children delete then if it also havw children
          node.children = deleteNodeRecursive(node.children, name);
        }
        return true;
      });
    };

    this.TreeData = deleteNodeRecursive(this.TreeData, nodeName); // call recursivly when found node name 
  }

  editTreeNode(data: any, updatedData: any) {
    const index = this.TreeData.findIndex(edit => edit.data === data);
    if (index !== -1) {
      this.TreeData[index] = updatedData;
    } // not working dont have index right nwo
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
