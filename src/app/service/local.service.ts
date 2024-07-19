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

  deleteTreeNode(nodeName: string): void {
    const deleteNodeRecursive = (nodes: any[], name: string): any[] => {
      return nodes.filter(node => {
        if (node.name === name) {
          return false;
        }
        if (node.children) {
          node.children = deleteNodeRecursive(node.children, name);
        }
        return true;
      });
    };

    this.TreeData = deleteNodeRecursive(this.TreeData, nodeName);
  }

  editTreeNode(oldName: string, newName: string): void {
    const editNodeRecursive = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (node.name === oldName) {
          node.name = newName;
        }
        if (node.children) {
          node.children = editNodeRecursive(node.children);
        }
        return node;
      });
    };

    this.TreeData = editNodeRecursive(this.TreeData);
  }

  addSubNode(parentNodeName: string, subNode: any) {
    const addSubNodeRecursive = (nodes: any[], parentName: string, subNode: any) => {
      for (let node of nodes) {
        if (node.name === parentName) {
          if (!node.children) {
            node.children = [];
          }
          node.children.push(subNode);
          return true;
        } else if (node.children) {
          if (addSubNodeRecursive(node.children, parentName, subNode)) {
            return true;
          }
        }
      }
      return false;
    };

    addSubNodeRecursive(this.TreeData, parentNodeName, subNode);
  }

  nodeExists(name: string, nodes: any[]): boolean {
    for (let node of nodes) {
      if (node.name === name) {
        return true;
      }
      if (node.children && this.nodeExists(name, node.children)) {
        return true;
      }
    }
    return false;
  }
}
