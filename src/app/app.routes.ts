import { Routes } from '@angular/router';
import { AccountPage, AdminPage, AuthPage, CartPage, CheckoutPage, HomePage, ProductPage, SellerPage } from './pages';
import { adminGuard, authGuard, sellerGuard } from './core';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'products/:id', component: ProductPage },
  { path: 'cart', component: CartPage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'auth', component: AuthPage },
  { path: 'account/:section', component: AccountPage, canActivate: [authGuard] },
  { path: 'seller', component: SellerPage, canActivate: [sellerGuard] },
  { path: 'admin', component: AdminPage, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
