module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, shareReplay, catchError, switchMap } from 'rxjs/operators';

/**
 * Smart service for ${featureName}
 * Manages data fetching, caching, and state
 */

@Injectable({ providedIn: 'root' })
export class ${pascalCase}Service {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<any>(null);
  private dataSubject = new BehaviorSubject<any[]>([]);

  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  data$ = this.dataSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadData() {
    this.loadingSubject.next(true);
    this.http.get<any>('/v1/\${featureName}')
      .pipe(
        map(response => response.data),
        tap(data => {
          this.dataSubject.next(data);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.errorSubject.next(error);
          this.loadingSubject.next(false);
          return of([]);
        }),
        shareReplay(1)
      )
      .subscribe();
  }

  create(data: any): Observable<any> {
    return this.http.post<any>('/v1/\${featureName}', data)
      .pipe(
        map(response => response.data),
        tap(created => {
          const current = this.dataSubject.value;
          this.dataSubject.next([created, ...current]);
        })
      );
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(\`/v1/\${featureName}/\${id}\`, data)
      .pipe(
        map(response => response.data),
        tap(updated => {
          const current = this.dataSubject.value.map(item =>
            item._id === id ? updated : item
          );
          this.dataSubject.next(current);
        })
      );
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(\`/v1/\${featureName}/\${id}\`)
      .pipe(
        tap(() => {
          const current = this.dataSubject.value.filter(item => item._id !== id);
          this.dataSubject.next(current);
        })
      );
  }
}
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
