import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface TreeNode {
  id: number;
  name: string | any;
  N_ID?: string | null;
  children?: TreeNode[];
  parent?: number | null;
}
@Injectable({
  providedIn: 'root',
})
export class LocalService {
  private apiUrl = 'http://localhost:1337/api/trees';

  constructor(private http: HttpClient) {}

  getNodes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?populate=parent`);
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

  addSubNode(subNode: { name: string; parent: number }): Observable<any> {
    const payload = {
      data: {
        name: subNode.name,
        parent: subNode.parent,
      },
    };
    return this.http.post<any>(this.apiUrl, payload);
  }


  moveNode(nodeId: number, newParentId: number): Observable<any> {
    const payload = {
      nodeId,
      newParentId,
    };
    return this.http.post<any>(`${this.apiUrl}/move`, payload);
  }

  nodeExists(name: string, parentNode: TreeNode[] | null | any): boolean {
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

  nodeExistsinParent(name: string, nodes: TreeNode[] | any): boolean {
    for (let node of nodes) {
      if (node.name === name) {
        return true;
      }
    }
    return false;
  }
}
