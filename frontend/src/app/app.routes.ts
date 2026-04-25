import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { DashboardPageComponent } from './pages/dashboard.page';
import { DeudasPageComponent } from './pages/deudas.page';
import { LoginPageComponent } from './pages/login.page';
import { MotivosPageComponent } from './pages/motivos.page';
import { PagosPageComponent } from './pages/pagos.page';
import { PuestosPageComponent } from './pages/puestos.page';
import { ReportesPageComponent } from './pages/reportes.page';
import { SociosPageComponent } from './pages/socios.page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [loginGuard]
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'socios', component: SociosPageComponent },
      { path: 'puestos', component: PuestosPageComponent },
      { path: 'motivos', component: MotivosPageComponent },
      { path: 'deudas', component: DeudasPageComponent },
      { path: 'pagos', component: PagosPageComponent },
      { path: 'reportes', component: ReportesPageComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
