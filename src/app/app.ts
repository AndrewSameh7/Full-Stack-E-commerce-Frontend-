import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideHeart, LucideSearch, LucideShoppingBag, LucideUserRound } from '@lucide/angular';
import { AuthService, CartService } from './core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideSearch, LucideShoppingBag, LucideUserRound, LucideHeart],
  template: `
    <header class="site-header">
      <a routerLink="/" class="brand">NORTH<span>&</span>CO.</a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Shop</a>
        @if (auth.loggedIn()) { <a routerLink="/account/orders" routerLinkActive="active">Orders</a> }
        @if (auth.user()?.role === 'seller' || auth.user()?.role === 'admin') {
          <a routerLink="/seller" routerLinkActive="active">Seller</a>
        }
        @if (auth.user()?.role === 'admin') { <a routerLink="/admin" routerLinkActive="active">Admin</a> }
      </nav>
      <div class="header-actions">
        <a routerLink="/" fragment="catalog" class="icon-btn" aria-label="Search"><svg lucideSearch size="19"></svg></a>
        @if (auth.loggedIn()) { <a routerLink="/account/wishlist" class="icon-btn" aria-label="Wishlist"><svg lucideHeart size="19"></svg></a> }
        <a [routerLink]="auth.user() ? '/account/profile' : '/auth'" class="icon-btn" aria-label="Account"><svg lucideUserRound size="19"></svg></a>
        <a routerLink="/cart" class="icon-btn bag" aria-label="Cart"><svg lucideShoppingBag size="19"></svg><span>{{ cart.count() }}</span></a>
      </div>
    </header>
    <main><router-outlet /></main>
    <footer><span class="brand">NORTH<span>&</span>CO.</span><p>Considered goods from independent stores.</p><small>© 2026 North & Co.</small></footer>
  `,
})
export class App {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  constructor() {
    this.cart.refresh();
    this.auth.restore();
  }
}
