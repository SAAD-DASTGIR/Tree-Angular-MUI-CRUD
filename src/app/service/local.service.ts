import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface FoodNode {
  id?: number;
  name: string;
  parent?: number;
}

// @Injectable({
//   providedIn: 'root'
// })
// export class LocalService {
//   private apiUrl = 'http://localhost:1337/api/trees';

//   constructor(private http: HttpClient) {}
//   getNodes(): Observable<any> {
//     return this.http.get(this.apiUrl).pipe()
//   }

//   getTreeData(): Observable<FoodNode[]> {
//     return this.http.get<FoodNode[]>(this.apiUrl);
//   }

//  addTreeNode(payload: any): Observable<any> {
//   return this.http.post(this.apiUrl, payload)
// }

// updateNode(id: number, node: any): Observable<any> {
//   return this.http.put<any>(`${this.apiUrl}/${id}`, { data: node });
// }

//   deleteTreeNode(id: number): Observable<void> {
//     return this.http.delete<void>(`${this.apiUrl}/${id}`);
//   }

//   editTreeNode(id: number, name: string): Observable<FoodNode> {
//     return this.http.put<FoodNode>(`${this.apiUrl}/${id}`, { data: name });

//   }
//   addNode(node: any): Observable<any> {
//     return this.http.post<any>(this.apiUrl, { data: node });
//   }


//   addSubNode(parentId: number, subNodeName: string): Observable<FoodNode> {
//     return this.http.post<FoodNode>(this.apiUrl, { name: subNodeName, parent: parentId });
//   }

//   moveNode(nodeId: number, newParentId: number): Observable<FoodNode> {
//     return this.http.put<FoodNode>(`${this.apiUrl}/${nodeId}`, { parent: newParentId });
//   }

//   nodeExists(name: string, nodes: any, checkChildren = false): boolean {
//     // Check if nodes is an object with a `data` property and extract the array
//     let nodeArray = Array.isArray(nodes) ? nodes : nodes?.data;

//     if (!Array.isArray(nodeArray)) {
//       console.error('The provided nodes parameter is not an array:', nodes);
//       return false;
//     }

//     for (let node of nodeArray) {
//       if (node.name === name && !checkChildren) {
//         return true;
//       }
//       if (node.children && this.nodeExists(name, node.children, checkChildren)) {
//         return true;
//       }
//     }
//     return false;
//   }
// }


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

  nodeExists(name: string, nodes: TreeNode[]): boolean {
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

