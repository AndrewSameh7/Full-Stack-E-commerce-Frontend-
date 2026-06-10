import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideHeart, LucidePlus } from '@lucide/angular';
import { ApiService, AuthService, CartService, message, Product } from './core';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, LucideHeart, LucidePlus],
  template: `
    <article class="product-card">
      <a [routerLink]="['/products', product().id]" class="product-media">
        @if (product().primary_image) { <img [src]="product().primary_image" [alt]="product().name" /> }
        @else { <div class="image-fallback">{{ product().category.name }}</div> }
        @if (!product().in_stock) { <span class="stock-badge">Sold out</span> }
      </a>
      <button class="float-action" [class.saved]="saved()" (click)="wishlist()" [attr.aria-label]="saved() ? 'Remove from wishlist' : 'Add to wishlist'"><svg lucideHeart size="18"></svg></button>
      <div class="product-info">
        <a [routerLink]="['/products', product().id]"><small>{{ product().category.name }}</small><h3>{{ product().name }}</h3></a>
        <div><strong>{{ +product().price | currency }}</strong><span>★ {{ product().avg_rating | number:'1.1-1' }}</span></div>
      </div>
      <button class="quick-add" [disabled]="!product().in_stock" (click)="cart.add(product().id)"><svg lucidePlus size="17"></svg> Add to bag</button>
    </article>
  `,
})
export class ProductCard {
  product = input.required<Product>();
  saved = input(false);
  wishlistChanged = output<void>();
  wishlistError = signal('');
  cart = inject(CartService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  wishlist() {
    if (!this.auth.loggedIn()) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.wishlistError.set('');
    const product_id = this.product().id;
    const request = this.saved()
      ? this.api.delete('/users/me/wishlist/', { product_id })
      : this.api.post('/users/me/wishlist/', { product_id });
    request.subscribe({
      next: () => this.wishlistChanged.emit(),
      error: error => this.wishlistError.set(message(error)),
    });
  }
}
