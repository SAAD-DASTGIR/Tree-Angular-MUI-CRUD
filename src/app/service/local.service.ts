import { Injectable } from '@angular/core';

interface FoodNode {
  id: number;
  name: string;
  children?: FoodNode[];
}

@Injectable({
  providedIn: 'root'
})
export class LocalService {
  private TreeData: FoodNode[] = [];
  private counter = 1;

  constructor() {}

  setTreeData(data: FoodNode[]) {
    this.TreeData = data;
    return this.TreeData;
  }

  getTreeData(): FoodNode[] {
    return this.TreeData;
  }

  addTreeNode(name: string): void {
    const newNode: FoodNode = { 
      id: this.counter++, 
      name: name, 
      children: [] };
    this.TreeData.push(newNode);
  }

  deleteTreeNode(nodeId: number): void {
    const deleteNodeRecursive = (nodes: FoodNode[], id: number): FoodNode[] => {
      return nodes.filter(node => {
        if (node.children) {
          node.children = deleteNodeRecursive(node.children, id);
        }
        if (node.id === id) {
          if (node.children && node.children.length > 0) {
            alert(`Delete Child First For ${node.name}`);
            return true; // Prevent deletion by returning true
          }
          return false; // Allow deletion by returning false
        }
        return true;
      });
    };

    this.TreeData = deleteNodeRecursive(this.TreeData, nodeId);
  }


  editTreeNode(nodeId: number, newName: string): void {
    const editNodeRecursive = (nodes: FoodNode[]): FoodNode[] => {
      
      return nodes.map(node => {
        if (node.id === nodeId) {
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


  

  addSubNode(parentId: number, subNodeName: string): void {
    const addSubNodeRecursive = (nodes: FoodNode[], parentId: number, subNode: FoodNode): boolean => {
      for (let node of nodes) {
        if (node.id === parentId) {
          if (!node.children) {
            node.children = [];
          }

          const siblingExists = node.children.some(child => child.name === subNode.name);
          if (!siblingExists) {
            node.children.push(subNode);
            return true;
          } else {
            alert(`Error: A sibling with the name ${subNode.name} already exists.`);
            return false;
          }
        } else if (node.children) {
          if (addSubNodeRecursive(node.children, parentId, subNode)) {
            return true;
          }
        }
      }
      return false;
    };

    const newSubNode: FoodNode = { id: this.counter++, name: subNodeName, children: [] };
    addSubNodeRecursive(this.TreeData, parentId, newSubNode);
  }

  nodeExists(name: string, nodes: FoodNode[], checkChildren = false): boolean {
    for (let node of nodes) {
      if (node.name === name && !checkChildren) {
        return true;
      }
      if (node.children && this.nodeExists(name, node.children, checkChildren)) {
        return true;
      }
    }
    return false;
  }
}
