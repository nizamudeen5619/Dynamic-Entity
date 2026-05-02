import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideNgxDynamicEntity } from 'ngx-dynamic-entity';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideNgxDynamicEntity({
      apiUrl: 'http://127.0.0.1:3001/api/entities'
    })
  ]
};
