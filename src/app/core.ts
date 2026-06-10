import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';

export const API = 'http://127.0.0.1:8000/api';
export type Category = { id: number; name: string; slug: string };
export type Product = { id: number; name: string; description?: string; price: string; avg_rating: number; in_stock: boolean; stock_count: number; category: Category; primary_image?: string | null; images?: {id:number;image:string;is_primary:boolean}[]; reviews?: any[]; seller?: {id:number;name:string;store_name:string} };
export type Cart = { items: {id:number;product:Product;quantity:number;line_total:string}[]; summary: {item_count:number;subtotal:string;discount:string;tax:string;total:string;promo_code?:string}; promo_code?:string };
export type User = { id:number;email:string;name:string;avatar:string;role:string;is_staff?:boolean;address?:any };
export type Order = { id:number;status:string;subtotal:string;discount:string;tax:string;total:string;created_at:string;items:any[];shipping_address:any;status_history:any[] };
export type Banner = { id:number;title:string;subtitle:string;image_url:string;cta_label:string;cta_url:string;sort_order:number;is_active:boolean };
export type Page<T> = { count:number; next:string|null; previous:string|null; results:T[] };

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const backend = inject(HttpBackend);
  const token = localStorage.getItem('access');
  const request = req.clone({ withCredentials: true, setHeaders: token ? { Authorization: `Bearer ${token}` } : {} });
  return next(request).pipe(
    catchError(error => {
      const refresh = localStorage.getItem('refresh');
      const canRefresh = error instanceof HttpErrorResponse && error.status === 401 && refresh && !req.url.includes('/auth/');
      if (!canRefresh) return throwError(() => error);

      const rawHttp = new HttpClient(backend);
      return rawHttp.post<{ access: string }>(`${API}/auth/refresh/`, { refresh }, { withCredentials: true }).pipe(
        switchMap(tokens => {
          localStorage.setItem('access', tokens.access);
          return next(req.clone({ withCredentials: true, setHeaders: { Authorization: `Bearer ${tokens.access}` } }));
        }),
        catchError(refreshError => {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  get<T>(path:string, params?:any) { return this.http.get<T>(`${API}${path}`, { params }); }
  post<T>(path:string, body:any = {}) { return this.http.post<T>(`${API}${path}`, body); }
  put<T>(path:string, body:any) { return this.http.put<T>(`${API}${path}`, body); }
  patch<T>(path:string, body:any) { return this.http.patch<T>(`${API}${path}`, body); }
  delete<T>(path:string, body?:any) { return this.http.delete<T>(`${API}${path}`, { body }); }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  user = signal<User|null>(null);
  loggedIn = computed(() => !!this.user());

  restore() {
    if (!localStorage.getItem('access')) return;
    this.api.get<User>('/users/me/').subscribe({ next: user => this.user.set(user), error: () => this.logout(false) });
  }
  login(email:string, password:string) {
    return new Observable<void>(observer => this.api.post<any>('/auth/login/', {email,password}).subscribe({
      next: tokens => { localStorage.setItem('access', tokens.access); localStorage.setItem('refresh', tokens.refresh); this.restore(); observer.next(); observer.complete(); },
      error: error => observer.error(error),
    }));
  }
  logout(navigate = true) {
    const refresh = localStorage.getItem('refresh');
    if (refresh) this.api.post('/auth/logout/', { refresh }).subscribe({ error: () => undefined });
    localStorage.removeItem('access'); localStorage.removeItem('refresh'); this.user.set(null);
    if (navigate) this.router.navigateByUrl('/');
  }
}

export const authGuard: CanActivateFn = (_, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const api = inject(ApiService);
  if (!localStorage.getItem('access')) {
    return router.createUrlTree(['/auth'], { queryParams: { returnUrl: state.url } });
  }
  return api.get<User>('/users/me/').pipe(
    map(user => { auth.user.set(user); return true; }),
    catchError(() => {
      auth.logout(false);
      return of(router.createUrlTree(['/auth'], { queryParams: { returnUrl: state.url } }));
    }),
  );
};

export const sellerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const api = inject(ApiService);
  if (!localStorage.getItem('access')) return router.createUrlTree(['/auth']);
  return api.get<User>('/users/me/').pipe(
    map(user => {
      auth.user.set(user);
      return true;
    }),
    catchError(() => { auth.logout(false); return of(router.createUrlTree(['/auth'])); }),
  );
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const api = inject(ApiService);
  if (!localStorage.getItem('access')) return router.createUrlTree(['/auth']);
  return api.get<User>('/users/me/').pipe(
    map(user => {
      auth.user.set(user);
      return user.role === 'admin' || user.is_staff ? true : router.createUrlTree(['/account/profile']);
    }),
    catchError(() => { auth.logout(false); return of(router.createUrlTree(['/auth'])); }),
  );
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);
  cart = signal<Cart|null>(null);
  error = signal('');
  busy = signal(false);
  count = computed(() => this.cart()?.summary.item_count || 0);
  refresh() {
    this.api.get<Cart>('/cart/').subscribe({
      next: cart => { this.cart.set(cart); this.error.set(''); },
      error: error => this.error.set(message(error)),
    });
  }
  add(product_id:number, quantity=1) { this.mutate(this.api.post('/cart/items/', {product_id,quantity})); }
  update(id:number, quantity:number) { this.mutate(this.api.patch(`/cart/items/${id}/`, {quantity})); }
  remove(id:number) { this.mutate(this.api.delete(`/cart/items/${id}/`)); }
  promo(code:string) {
    if (!code.trim()) { this.error.set('Enter a promo code first.'); return; }
    this.mutate(this.api.post('/cart/promo/', {code}));
  }

  private mutate(request: Observable<unknown>) {
    this.busy.set(true);
    this.error.set('');
    request.subscribe({
      next: () => { this.busy.set(false); this.refresh(); },
      error: error => { this.busy.set(false); this.error.set(message(error)); },
    });
  }
}

export function message(error: unknown) {
  if (!(error instanceof HttpErrorResponse)) return 'Something went wrong. Please try again.';
  const body = error.error;
  if (typeof body === 'string') return body;
  if (typeof body?.detail === 'string') return body.detail;
  return flattenMessage(body?.detail || body) || 'Something went wrong. Please try again.';
}

function flattenMessage(value: any): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenMessage).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => !['verification_required', 'email'].includes(key))
      .map(([key, item]) => `${key === 'non_field_errors' ? '' : `${key.replaceAll('_', ' ')}: `}${flattenMessage(item)}`)
      .filter(Boolean)
      .join(' ');
  }
  return '';
}
