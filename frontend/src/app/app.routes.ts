import { Routes } from '@angular/router';
import { authGuard, loginGuard, sectionGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { DashboardPageComponent } from './pages/dashboard.page';
import { DeudasPageComponent } from './pages/deudas.page';
import { LoginPageComponent } from './pages/login.page';
import { MotivosPageComponent } from './pages/motivos.page';
import { PagosPageComponent } from './pages/pagos.page';
import { PuestosPageComponent } from './pages/puestos.page';
import { ReportesPageComponent } from './pages/reportes.page';
import { SociosPageComponent } from './pages/socios.page';
import { UsuariosPageComponent } from './pages/usuarios.page';

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
      { path: 'dashboard', component: DashboardPageComponent, canActivate: [sectionGuard('dashboard')] },
      { path: 'socios', component: SociosPageComponent, canActivate: [sectionGuard('socios')] },
      { path: 'puestos', component: PuestosPageComponent, canActivate: [sectionGuard('puestos')] },
      { path: 'motivos', component: MotivosPageComponent, canActivate: [sectionGuard('motivos')] },
      { path: 'deudas', component: DeudasPageComponent, canActivate: [sectionGuard('deudas')] },
      { path: 'pagos', component: PagosPageComponent, canActivate: [sectionGuard('pagos')] },
      { path: 'reportes', component: ReportesPageComponent, canActivate: [sectionGuard('reportes')] },
      { path: 'usuarios', component: UsuariosPageComponent, canActivate: [sectionGuard('usuarios')] }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
