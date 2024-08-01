import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface FoodNode {
  id?: number;
  name: string;
  parent?: number;
}
interface TreeNode { // custom interface according to strapi
  id: number;
  name: string;
  N_ID?: string | null; // optional bcz strapi also generate itself a id
  children?: TreeNode[];
}
@Injectable({
  providedIn: 'root'
})
export class LocalService {
  private apiUrl = 'http://localhost:1337/api/trees';

  constructor(private http: HttpClient) {}

  getNodes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?populate=parent`);
  }


  getTreeData(): Observable<TreeNode[]> {
    return this.http.get<TreeNode[]>(`${this.apiUrl}?populate=*`);
  }


  addTreeNode(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  updateNode(id: number, node: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { data: node });
  }

  deleteTreeNode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addNode(node: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, { data: node });
  }

 addSubNode(subNode: { name: string; parent: number }): Observable<any> {
  const payload = {
    data: {
      name: subNode.name,
      parent: subNode.parent
    }
  };
  console.log('Payload for addSubNode:', payload);
  return this.http.post<any>(this.apiUrl, payload);
}




  moveNode(nodeId: number, newParentId: number): Observable<FoodNode> {
    return this.http.put<FoodNode>(`${this.apiUrl}/${nodeId}`, { parent: newParentId });
  }

  nodeExists(name: string, parentNode: TreeNode | null): boolean {
    if (!parentNode || !parentNode.children) {
      return false;
    }

    for (let node of parentNode.children) {
      if (node.name === name) {
        return true;
      }
    }
    return false;
  }


 nodeExiststest(name: string, nodes: TreeNode[]|any): boolean {
    for (let node of nodes) {
      if (node.name === name) {
        return true;
      }
      // if (node.children && this.nodeExists(name, node.children)) {
      //   return true;
      // }
    }
    return false;
  }
}


