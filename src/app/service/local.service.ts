import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalService {
  private apiUrl = 'http://localhost:1337/api/trees';

  constructor(private http: HttpClient) {}

  getNodes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?populate=parent`);
  }

  getChildrenNodes(parentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/children/${parentId}`);
  }

  addTreeNode(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  getFilteredNodes(filter: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}?filters[name][$contains]=${filter}`
    );
  }
  deleteTreeNode(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  updateNode(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { data: payload });
  }

  addSubNode(subNode: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, { data: subNode });
  }


  nodeExists(name: string, node: any): boolean {
    if (!node || !node.children) {
      return false;
    }
    return node.children.some((child: any) => child.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  // Check for sibling node existence in the parent node list
  nodeExistsinParent(name: string, nodes: any[]): boolean {
    return nodes.some((node: any) => node.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  moveNode(nodeId: number, newParentId: number): Observable<any> {
    const payload = {
      nodeId,
      newParentId,
    };
    return this.http.post<any>(`${this.apiUrl}/move`, payload);
  }
}
