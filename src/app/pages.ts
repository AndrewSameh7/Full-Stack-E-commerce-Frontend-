import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideArrowRight, LucideCheck, LucideChevronLeft, LucideMinus, LucidePackage, LucidePlus, LucideSearch, LucideShoppingBag, LucideTrash2, LucideTruck, LucideWallet } from '@lucide/angular';
import { ApiService, AuthService, Banner, CartService, Category, message, Order, Page, Product, User } from './core';
import { ProductCard } from './product-card';

@Component({
  imports: [FormsModule, ProductCard, LucideSearch, LucideArrowRight],
  template: `
    <section class="hero" [style.background-image]="heroBackground()">
      <div><span class="eyebrow">Independent goods · Summer edit</span><h1>{{hero()?.title || 'Objects worth living with.'}}</h1><p>{{hero()?.subtitle || 'Thoughtful pieces for everyday rituals, selected from independent makers and modern stores.'}}</p><a [href]="hero()?.cta_url || '#catalog'" class="button light">{{hero()?.cta_label || 'Explore collection'}} <svg lucideArrowRight size="18"></svg></a></div>
      <div class="hero-note"><strong>New season</strong><span>{{hero()?.title || 'Natural forms, useful things'}}</span></div>
    </section>
    <section class="benefits"><span>Free delivery over $100</span><span>Independent sellers</span><span>14-day returns</span><span>Secure checkout</span></section>
    <section id="catalog" class="catalog section">
      <div class="section-heading"><div><span class="eyebrow">The collection</span><h2>Made for your everyday</h2></div><p>{{ count() }} considered pieces</p></div>
      <div class="catalog-tools">
        <label class="search"><svg lucideSearch size="18"></svg><input [(ngModel)]="search" (keyup.enter)="load()" placeholder="Search products" /></label>
        <select [(ngModel)]="category" (change)="load()"><option value="">All categories</option>@for (item of categories(); track item.id) {<option [value]="item.id">{{ item.name }}</option>}</select>
        <select [(ngModel)]="ordering" (change)="load()"><option value="">Newest</option><option value="price">Price: low to high</option><option value="-price">Price: high to low</option><option value="-avg_rating">Top rated</option></select>
        <button class="button dark" (click)="load()">Apply</button>
      </div>
      @if (loading()) { <div class="loading">Curating the collectionâ€¦</div> }
      <div class="product-grid">@for (product of products(); track product.id) { <app-product-card [product]="product" /> }</div>
    </section>
  `,
})
export class HomePage {
  private api=inject(ApiService); products=signal<Product[]>([]); categories=signal<Category[]>([]); banners=signal<Banner[]>([]); count=signal(0); loading=signal(true);
  search=''; category=''; ordering='';
  hero=(): Banner | undefined => this.banners().at(0);
  heroBackground(){const image=this.hero()?.image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=85';return `linear-gradient(90deg,rgba(22,34,26,.84),rgba(22,34,26,.12)),url('${image}')`;}
  constructor(){ this.api.get<Page<Category>>('/categories/').subscribe(v=>this.categories.set(v.results)); this.api.get<Page<Banner>>('/banners/').subscribe(v=>this.banners.set(v.results)); this.load(); }
  load(){ this.loading.set(true); this.api.get<Page<Product>>('/products/',{search:this.search,category:this.category,ordering:this.ordering}).subscribe(v=>{this.products.set(v.results);this.count.set(v.count);this.loading.set(false)}); }
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink, LucideChevronLeft, LucideMinus, LucidePlus, LucideShoppingBag, LucideTruck, LucideCheck],
  template: `
    @if (product(); as p) {
      <section class="detail section">
        <div class="gallery">
          <a routerLink="/" class="back"><svg lucideChevronLeft size="18"></svg> Back to shop</a>
          @if (selectedImage()) { <img [src]="selectedImage()" [alt]="p.name" /> } @else { <div class="image-fallback">{{p.category.name}}</div> }
          <div class="thumbs">@for(image of p.images; track image.id){<button (click)="selectedImage.set(image.image)"><img [src]="image.image" [alt]="p.name"/></button>}</div>
        </div>
        <div class="detail-copy"><span class="eyebrow">{{p.category.name}} Â· {{p.seller?.store_name || p.seller?.name}}</span><h1>{{p.name}}</h1><div class="rating">â˜… {{p.avg_rating | number:'1.1-1'}} <span>({{p.reviews?.length || 0}} reviews)</span></div><strong class="price">{{+p.price | currency}}</strong><p>{{p.description || 'A thoughtfully selected piece made for daily life.'}}</p>
          <div class="buy-row"><div class="stepper"><button (click)="quantity=Math.max(1,quantity-1)"><svg lucideMinus size="17"></svg></button><span>{{quantity}}</span><button (click)="quantity=Math.min(p.stock_count,quantity+1)"><svg lucidePlus size="17"></svg></button></div><button class="button dark grow" [disabled]="!p.in_stock" (click)="add(p.id)"><svg lucideShoppingBag size="18"></svg> Add to bag</button></div>
          <div class="service-lines"><span><svg lucideTruck size="19"></svg> Free delivery over $100</span><span><svg lucideCheck size="19"></svg> {{p.stock_count}} available Â· Ready to dispatch</span></div>
        </div>
      </section>
      <section class="reviews section"><div class="section-heading"><div><span class="eyebrow">From the community</span><h2>Customer reviews</h2></div></div><div class="review-grid">@for(review of p.reviews; track review.id){<article><div>â˜…â˜…â˜…â˜…â˜…</div><p>{{review.comment || 'A lovely addition.'}}</p><small>{{review.user_name || 'Customer'}} Â· {{review.created_at | date}}</small></article>}@empty{<p class="muted">No reviews yet. Be the first to share your thoughts.</p>}</div></section>
    }
  `,
})
export class ProductPage {
  private api=inject(ApiService); private route=inject(ActivatedRoute); cart=inject(CartService); product=signal<Product|null>(null); selectedImage=signal(''); quantity=1;
  Math=Math;
  constructor(){this.api.get<Product>(`/products/${this.route.snapshot.paramMap.get('id')}/`).subscribe(p=>{this.product.set(p);this.selectedImage.set(p.images?.find(i=>i.is_primary)?.image || p.images?.[0]?.image || '')})}
  add(id:number){this.cart.add(id,this.quantity)}
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink, LucideTrash2, LucideMinus, LucidePlus],
  template: `
    <section class="section narrow"><div class="section-heading"><div><span class="eyebrow">Your selection</span><h1>Shopping bag</h1></div></div>
      @if(cart.error()){<p class="error">{{cart.error()}}</p>}
      @if(cart.cart()?.items?.length){<div class="cart-layout"><div class="cart-items">@for(item of cart.cart()!.items;track item.id){<article><div class="mini-media">@if(item.product.primary_image){<img [src]="item.product.primary_image" [alt]="item.product.name"/>}@else{<span>{{item.product.category.name}}</span>}</div><div><small>{{item.product.category.name}}</small><h3>{{item.product.name}}</h3><strong>{{+item.product.price|currency}}</strong></div><div class="stepper"><button [disabled]="cart.busy()" (click)="cart.update(item.id, Math.max(1,item.quantity-1))"><svg lucideMinus size="16"></svg></button><span>{{item.quantity}}</span><button [disabled]="cart.busy()" (click)="cart.update(item.id,item.quantity+1)"><svg lucidePlus size="16"></svg></button></div><button class="icon-btn" [disabled]="cart.busy()" (click)="cart.remove(item.id)"><svg lucideTrash2 size="18"></svg></button></article>}</div><aside class="summary"><h2>Order summary</h2><p><span>Subtotal</span><strong>{{+cart.cart()!.summary.subtotal|currency}}</strong></p><p><span>Tax</span><strong>{{+cart.cart()!.summary.tax|currency}}</strong></p><p class="total"><span>Total</span><strong>{{+cart.cart()!.summary.total|currency}}</strong></p><label>Promo code<input [(ngModel)]="promo" placeholder="Enter code"/></label><button class="text-button" [disabled]="cart.busy()" (click)="cart.promo(promo)">Apply code</button><a routerLink="/checkout" class="button dark full">Continue to checkout</a></aside></div>}@else{<div class="empty"><h2>Your bag is waiting</h2><p>Explore the collection and add something considered.</p><a routerLink="/" class="button dark">Browse products</a></div>}
    </section>
  `,
})
export class CartPage { cart=inject(CartService); Math=Math; promo=''; }

@Component({
  imports: [FormsModule, CurrencyPipe, LucideWallet, LucideTruck],
  template: `
    <section class="section narrow"><div class="section-heading"><div><span class="eyebrow">Secure checkout</span><h1>Delivery & payment</h1></div></div>
      <div class="checkout-grid"><form class="form-panel" (ngSubmit)="pay()">@if(!auth.loggedIn()){<h2>Guest contact</h2><div class="field-grid"><label>Name<input [(ngModel)]="guest.guest_name" name="guest_name" required/></label><label>Email<input type="email" [(ngModel)]="guest.guest_email" name="guest_email" required/></label><label>Phone<input [(ngModel)]="guest.guest_phone" name="guest_phone"/></label></div>}<h2>Shipping address</h2><div class="field-grid"><label>Address<input [(ngModel)]="address.line1" name="line1" required/></label><label>Apartment<input [(ngModel)]="address.line2" name="line2"/></label><label>City<input [(ngModel)]="address.city" name="city" required/></label><label>State<input [(ngModel)]="address.state" name="state"/></label><label>Postal code<input [(ngModel)]="address.postal_code" name="postal" required/></label><label>Country<input [(ngModel)]="address.country" name="country" required/></label></div><h2>Payment</h2><div class="payment-options"><label><input type="radio" name="method" [(ngModel)]="method" value="cod"/><svg lucideTruck size="20"></svg><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span></label>@if(auth.loggedIn()){<label><input type="radio" name="method" [(ngModel)]="method" value="wallet"/><svg lucideWallet size="20"></svg><span><strong>Wallet</strong><small>Use your store balance</small></span></label>}</div>@if(error()){<p class="error">{{error()}}</p>}<button class="button dark full" type="submit">Place order · {{+(cart.cart()?.summary?.total || 0)|currency}}</button></form><aside class="summary"><h2>Your order</h2>@for(item of cart.cart()?.items;track item.id){<p><span>{{item.quantity}} x {{item.product.name}}</span><strong>{{+item.line_total|currency}}</strong></p>}<p class="total"><span>Total</span><strong>{{+(cart.cart()?.summary?.total || 0)|currency}}</strong></p></aside></div>
    </section>
  `,
})
export class CheckoutPage {
  api=inject(ApiService);cart=inject(CartService);auth=inject(AuthService);router=inject(Router);method='cod';error=signal('');guest:any={guest_name:'',guest_email:'',guest_phone:''};address:any={line1:'',line2:'',city:'',state:'',postal_code:'',country:''};
  constructor(){const a=this.auth.user()?.address;if(a)this.address={...a}}
  pay(){this.error.set('');if(!this.auth.loggedIn()&&(!this.guest.guest_email||!this.guest.guest_name)){this.error.set('Enter your name and email for guest checkout.');return}const body={...this.guest,shipping_address:this.address};const path=this.auth.loggedIn()?(this.method==='wallet'?'/wallet/pay/':'/payments/cod/'):'/orders/';this.api.post<any>(path,body).subscribe({next:r=>{this.cart.refresh();this.router.navigateByUrl(this.auth.loggedIn()?'/account/orders':'/')},error:e=>this.error.set(message(e))})}
}

@Component({
  imports: [FormsModule],
  template: `<section class="auth-page"><form (ngSubmit)="submit()">
    <span class="eyebrow">{{mode==='verify'?'Email verification':mode==='register'?'Create an account':'Welcome back'}}</span>
    <h1>{{mode==='verify'?'Check your inbox':mode==='register'?'Join North & Co.':'Sign in'}}</h1>
    @if(mode==='verify'){
      <p class="auth-intro">Enter the six-digit code sent to <strong>{{email}}</strong>.</p>
      <label>Verification code<input class="otp-input" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" [(ngModel)]="otp" name="otp" autocomplete="one-time-code" required/></label>
    } @else {
      @if(mode==='register'){
        <label>I want to be a:</label>
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <label style="flex-direction: row; align-items: center; cursor: pointer; font-weight: normal;"><input type="radio" value="customer" [(ngModel)]="role" name="role" style="margin: 0;"> Customer</label>
          <label style="flex-direction: row; align-items: center; cursor: pointer; font-weight: normal;"><input type="radio" value="seller" [(ngModel)]="role" name="role" style="margin: 0;"> Seller</label>
        </div>
        <label>Name<input [(ngModel)]="name" name="name" required autocomplete="name"/></label>
      }
      <label>Email<input type="email" [(ngModel)]="email" name="email" required autocomplete="email"/></label>
      <label>Password<input type="password" minlength="8" [(ngModel)]="password" name="password" required [autocomplete]="mode==='register'?'new-password':'current-password'"/></label>
      @if(mode==='register'){<small class="field-help">Use at least 8 characters. Avoid common or entirely numeric passwords.</small>}
    }
    @if(error()){<div class="alert error"><strong>We could not continue</strong><span>{{error()}}</span></div>}
    @if(success()){<div class="alert success"><strong>All set</strong><span>{{success()}}</span></div>}
    <button class="button dark full" [disabled]="busy()">{{busy()?'Please wait...':mode==='verify'?'Verify email':mode==='register'?'Create account':'Sign in'}}</button>
    @if(mode==='verify'){<button type="button" class="text-button" [disabled]="busy()" (click)="resend()">Send a new code</button><button type="button" class="text-button" (click)="setMode('login')">Back to sign in</button>}
    @else {<button type="button" class="text-button" (click)="setMode(mode==='register'?'login':'register')">{{mode==='register'?'Already registered? Sign in':'New here? Create an account'}}</button>}
  </form></section>`,
})
export class AuthPage {
  api=inject(ApiService);auth=inject(AuthService);cart=inject(CartService);router=inject(Router);route=inject(ActivatedRoute);mode:'login'|'register'|'verify'='login';name='';email='';password='';otp='';role:'customer'|'seller'='customer';error=signal('');success=signal('');busy=signal(false);
  setMode(mode:'login'|'register'|'verify'){this.mode=mode;this.error.set('');this.success.set('')}
  submit(){this.error.set('');this.success.set('');this.busy.set(true);
    if(this.mode==='register'){this.api.post<any>('/auth/register/',{name:this.name,email:this.email,password:this.password,role:this.role}).subscribe({next:r=>{this.email=r.email;this.busy.set(false);this.setMode('verify');this.success.set('We sent a fresh verification code.')},error:e=>{this.busy.set(false);this.error.set(message(e))}});return}
    if(this.mode==='verify'){this.api.post<any>('/auth/verify-email/',{email:this.email,code:this.otp}).subscribe({next:r=>{this.busy.set(false);this.setMode('login');this.success.set(r.detail)},error:e=>{this.busy.set(false);this.error.set(message(e))}});return}
    this.auth.login(this.email,this.password).subscribe({next:()=>{this.busy.set(false);this.cart.refresh();this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl')||'/')},error:e=>{this.busy.set(false);if(e.error?.verification_required){this.email=e.error.email;this.setMode('verify')}this.error.set(message(e))}})
  }
  resend(){this.error.set('');this.success.set('');this.busy.set(true);this.api.post<any>('/auth/resend-verification/',{email:this.email}).subscribe({next:r=>{this.busy.set(false);this.success.set(r.detail)},error:e=>{this.busy.set(false);this.error.set(message(e))}})}
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink, ProductCard, LucidePackage],
  template: `<section class="section narrow account"><aside><h3>My account</h3><a routerLink="/account/profile">Profile</a><a routerLink="/account/orders">Orders</a><a routerLink="/account/wishlist">Wishlist</a>@if(auth.loggedIn()){<button class="text-button" (click)="auth.logout()">Sign out</button>}</aside><div class="account-main">@if(section==='profile'){<span class="eyebrow">Personal details</span><h1>Profile</h1><form class="form-panel" (ngSubmit)="save()"><label>Name<input [(ngModel)]="profile.name" name="name"/></label><label>Avatar URL<input [(ngModel)]="profile.avatar" name="avatar"/></label><div class="field-grid"><label>Address<input [(ngModel)]="profile.address.line1" name="line1"/></label><label>City<input [(ngModel)]="profile.address.city" name="city"/></label><label>Postal code<input [(ngModel)]="profile.address.postal_code" name="postal"/></label><label>Country<input [(ngModel)]="profile.address.country" name="country"/></label></div><button class="button dark">Save profile</button></form>}@else if(section==='wishlist'){<span class="eyebrow">Saved for later</span><h1>Wishlist</h1><div class="product-grid compact">@for(item of wishlist();track item.id){@if(item.product){<app-product-card [product]="item.product" [saved]="true" (wishlistChanged)="loadWishlist()"/>}}@empty{<div class="empty"><h2>No saved items yet</h2><a routerLink="/" class="button dark">Browse products</a></div>}</div>}@else{<span class="eyebrow">Purchase history</span><h1>Orders</h1><div class="orders">@for(order of orders();track order.id){<article><div><svg lucidePackage size="20"></svg><span><strong>Order #{{order.id}}</strong><small>{{order.created_at|date:'mediumDate'}}</small></span></div><span class="status">{{order.status|titlecase}}</span><strong>{{+order.total|currency}}</strong></article>}@empty{<div class="empty"><h2>No orders yet</h2><a routerLink="/" class="button dark">Start shopping</a></div>}</div>}</div></section>`,
})
export class AccountPage {
  api=inject(ApiService);auth=inject(AuthService);section='orders';orders=signal<Order[]>([]);wishlist=signal<any[]>([]);profile:any={name:'',avatar:'',address:{}};
  constructor(){this.section=inject(ActivatedRoute).snapshot.paramMap.get('section')||'orders';if(this.section==='orders')this.api.get<Order[]>('/orders/').subscribe(v=>this.orders.set(v));if(this.section==='wishlist')this.loadWishlist();if(this.section==='profile')this.api.get<User>('/users/me/').subscribe(v=>this.profile={...v,address:v.address||{}})}
  loadWishlist(){this.api.get<any[]>('/users/me/wishlist/').subscribe(v=>this.wishlist.set(v))}
  save(){this.api.put<User>('/users/me/',this.profile).subscribe(v=>this.auth.user.set(v))}
}

@Component({
  imports: [CommonModule, FormsModule, LucidePackage, LucideWallet],
  template: `<section class="section narrow"><div class="section-heading"><div><span class="eyebrow">Store operations</span><h1>Seller dashboard</h1></div></div>@if(error()){<p class="error">{{error()}}</p>}@if(!profile()){<form class="form-panel" (ngSubmit)="register()"><h2>Seller registration</h2><label>Store name<input [(ngModel)]="sellerForm.store_name" name="store_name" required/></label><label>Bio<input [(ngModel)]="sellerForm.bio" name="bio"/></label><label>Upload Logo<input type="file" (change)="onLogoSelected($event)" accept="image/*"/></label><button class="button dark" style="margin-top: 1rem;">Submit for approval</button></form>}@else if(profile()?.status!=='approved'&&!auth.user()?.is_staff){<div class="empty"><h2>{{profile()?.status|titlecase}} seller profile</h2><p>Your storefront is waiting for admin approval.</p></div>}@else{<div class="metric-grid"><article><svg lucideWallet></svg><span>Total sales</span><strong>{{+(earnings()?.total_sales||0)|currency}}</strong></article><article><svg lucidePackage></svg><span>Orders</span><strong>{{earnings()?.total_orders||0}}</strong></article><article><span>Products</span><strong>{{products().length}}</strong></article></div><div class="seller-grid"><section><div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">@if(profile()?.logo){<img [src]="profile()?.logo" alt="Logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">}<h2>Profile</h2></div><label>Store name<input [(ngModel)]="sellerForm.store_name" name="store_edit"/></label><label>Bio<input [(ngModel)]="sellerForm.bio" name="bio_edit"/></label><label>Change Logo<input type="file" (change)="onLogoSelected($event)" accept="image/*"/></label><button class="button dark" style="margin-top: 1rem;" (click)="saveProfile()">Save profile</button><div style="margin-top:2rem;"><h2>New product</h2><label>Name<input [(ngModel)]="productForm.name" name="product_name"/></label><label>Category<select [(ngModel)]="productForm.category" name="category"><option [ngValue]="0">Choose category</option>@for(c of categories();track c.id){<option [ngValue]="c.id">{{c.name}}</option>}</select></label><div class="field-grid"><label>Price<input type="number" [(ngModel)]="productForm.price" name="price"/></label><label>Stock<input type="number" [(ngModel)]="productForm.stock_count" name="stock"/></label></div><label>Upload Image<input type="file" (change)="onProductImageSelected($event)" accept="image/*"/></label><label>Description<input [(ngModel)]="productForm.description" name="description"/></label><button class="button dark" (click)="createProduct()">Add product</button></section><section><h2>Inventory</h2>@for(p of products();track p.id){<article class="row"><span><strong>{{p.name}}</strong><small>{{p.stock_count}} in stock</small></span><input class="stock-input" type="number" [ngModel]="p.stock_count" (ngModelChange)="p.stock_count=$event" [name]="'stock_'+p.id"/><button class="text-button" (click)="updateProduct(p)">Save</button><button class="text-button" (click)="deleteProduct(p.id)">Remove</button></article>}<h2>Recent orders</h2>@for(o of orders();track o.id){<article class="row"><span><strong>Order #{{o.id}}</strong><small>{{o.buyer.email}}</small></span><select [ngModel]="o.status" (ngModelChange)="updateOrder(o,$event)" [name]="'order_'+o.id"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></article>}</section></div>}</section>`,
})
export class SellerPage {
  api=inject(ApiService);auth=inject(AuthService);earnings=signal<any>(null);products=signal<Product[]>([]);orders=signal<any[]>([]);categories=signal<Category[]>([]);profile=signal<any>(null);error=signal('');
  sellerForm:any={store_name:'',bio:'',logo:''};productForm:any={name:'',description:'',price:0,stock_count:1,in_stock:true,category:0};
  logoFile: File | null = null;
  productImageFile: File | null = null;
  
  onLogoSelected(event: any) {
    if (event.target.files.length > 0) {
      this.logoFile = event.target.files[0];
    }
  }

  onProductImageSelected(event: any) {
    if (event.target.files.length > 0) {
      this.productImageFile = event.target.files[0];
    }
  }

  constructor(){this.api.get<Page<Category>>('/categories/').subscribe(v=>this.categories.set(v.results));this.loadProfile()}
  loadProfile(){this.api.get<any>('/sellers/me/').subscribe({next:p=>{this.profile.set(p);this.sellerForm={store_name:p.store_name,bio:p.bio,logo:p.logo};if(p.status==='approved'||this.auth.user()?.is_staff)this.loadDashboard()},error:()=>this.profile.set(null)})}
  register(){
    this.error.set('');
    const form = new FormData();
    form.append('store_name', this.sellerForm.store_name);
    if(this.sellerForm.bio) form.append('bio', this.sellerForm.bio);
    if(this.logoFile) form.append('logo', this.logoFile);
    this.api.post<any>('/sellers/register/', form).subscribe({next:p=>this.profile.set(p),error:e=>this.error.set(message(e))})
  }
  saveProfile(){
    const form = new FormData();
    form.append('store_name', this.sellerForm.store_name);
    if(this.sellerForm.bio) form.append('bio', this.sellerForm.bio);
    if(this.logoFile) form.append('logo', this.logoFile);
    this.api.put<any>('/sellers/me/', form).subscribe({next:p=>{this.profile.set(p);this.logoFile=null;},error:e=>this.error.set(message(e))})
  }
  loadDashboard(){this.api.get<any>('/sellers/me/earnings/').subscribe(v=>this.earnings.set(v));this.api.get<Product[]>('/sellers/me/products/').subscribe(v=>this.products.set(v));this.api.get<any[]>('/sellers/me/orders/').subscribe(v=>this.orders.set(v))}
  createProduct(){
    this.error.set('');
    const form = new FormData();
    form.append('name', this.productForm.name);
    form.append('description', this.productForm.description);
    form.append('price', this.productForm.price.toString());
    form.append('stock_count', this.productForm.stock_count.toString());
    form.append('category', this.productForm.category.toString());
    if (this.productImageFile) form.append('image', this.productImageFile);
    
    this.api.post<Product>('/sellers/me/products/', form).subscribe({next:()=>{this.productForm={name:'',description:'',price:0,stock_count:1,in_stock:true,category:0};this.productImageFile=null;this.loadDashboard()},error:e=>this.error.set(message(e))})
  }
  updateProduct(p:Product, newImageTarget?: any){
    const form = new FormData();
    form.append('stock_count', p.stock_count.toString());
    form.append('in_stock', (p.stock_count > 0).toString());
    if (newImageTarget?.files?.length > 0) form.append('image', newImageTarget.files[0]);
    
    this.api.patch<Product>(`/sellers/me/products/${p.id}/`, form).subscribe({next:()=>this.loadDashboard(),error:e=>this.error.set(message(e))})
  }
  deleteProduct(id:number){this.api.delete(`/sellers/me/products/${id}/`).subscribe({next:()=>this.loadDashboard(),error:e=>this.error.set(message(e))})}
  updateOrder(o:any,status:string){this.api.patch<any>(`/sellers/me/orders/${o.id}/status/`,{status}).subscribe({next:()=>this.loadDashboard(),error:e=>this.error.set(message(e))})}
}

@Component({
  imports: [CommonModule, FormsModule],
  template: `<section class="section narrow admin-panel"><div class="section-heading"><div><span class="eyebrow">Operations</span><h1>Admin panel</h1></div></div>@if(error()){<p class="error">{{error()}}</p>}<div class="admin-tabs"><button (click)="tab='users'">Users</button><button (click)="tab='sellers'">Sellers</button><button (click)="tab='orders'">Orders</button><button (click)="tab='catalog'">Catalog</button><button (click)="tab='promos'">Promos</button><button (click)="tab='content'">Content</button></div>@if(tab==='users'){<section><h2>User management</h2>@for(u of users();track u.id){<article class="row"><span><strong>{{u.email}}</strong><small>{{u.role}} · {{u.is_active?'active':'restricted'}} {{u.is_deleted?'· deleted':''}}</small></span><button class="text-button" (click)="post('/users/admin/users/'+u.id+'/approve/')">Approve</button><button class="text-button" (click)="post('/users/admin/users/'+u.id+'/restrict/')">Restrict</button><button class="text-button" (click)="remove('/users/admin/users/'+u.id+'/')">Soft delete</button></article>}</section>}@if(tab==='sellers'){<section><h2>Seller management</h2>@for(s of sellers();track s.id){<article class="row"><span><strong>{{s.store_name}}</strong><small>{{s.email}} · {{s.status}}</small></span><button class="text-button" (click)="post('/sellers/admin/sellers/'+s.id+'/approve/')">Approve</button><button class="text-button" (click)="post('/sellers/admin/sellers/'+s.id+'/suspend/')">Suspend</button></article>}</section>}@if(tab==='orders'){<section><h2>Order & shipping</h2>@for(o of orders();track o.id){<article class="row"><span><strong>Order #{{o.id}}</strong><small>{{o.buyer?.email}} · {{+o.total|currency}}</small></span><select [ngModel]="o.status" (ngModelChange)="patch('/admin/orders/'+o.id+'/',{status:$event})" [name]="'admin_order_'+o.id"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></article>}</section>}@if(tab==='catalog'){<section class="seller-grid"><div><h2>Categories</h2><label>Name<input [(ngModel)]="categoryForm.name" name="cat_name"/></label><label>Slug<input [(ngModel)]="categoryForm.slug" name="cat_slug"/></label><button class="button dark" (click)="create('/categories/',categoryForm)">Add category</button>@for(c of categories();track c.id){<article class="row"><strong>{{c.name}}</strong><button class="text-button" (click)="remove('/categories/'+c.id+'/')">Remove</button></article>}</div><div><h2>Products</h2>@for(p of products();track p.id){<article class="row"><span><strong>{{p.name}}</strong><small>{{p.stock_count}} in stock</small></span><button class="text-button" (click)="remove('/products/'+p.id+'/')">Soft delete</button></article>}</div></section>}@if(tab==='promos'){<section><h2>Discounts & promo codes</h2><div class="inline-form"><input placeholder="Code" [(ngModel)]="promoForm.code" name="promo_code"/><select [(ngModel)]="promoForm.discount_type" name="promo_type"><option value="percent">Percent</option><option value="flat">Flat</option></select><input type="number" placeholder="Value" [(ngModel)]="promoForm.value" name="promo_value"/><input type="number" placeholder="Minimum" [(ngModel)]="promoForm.minimum_order_amount" name="promo_min"/><button class="button dark" (click)="create('/admin/promo-codes/',promoForm)">Add</button></div>@for(p of promos();track p.id){<article class="row"><span><strong>{{p.code}}</strong><small>{{p.discount_type}} · {{p.value}}</small></span><label class="inline-check"><input type="checkbox" [ngModel]="p.is_active" (ngModelChange)="patch('/admin/promo-codes/'+p.id+'/',{is_active:$event})" [name]="'promo_'+p.id"/> Active</label><button class="text-button" (click)="remove('/admin/promo-codes/'+p.id+'/')">Remove</button></article>}</section>}@if(tab==='content'){<section><h2>Homepage banners</h2><div class="field-grid"><label>Title<input [(ngModel)]="bannerForm.title" name="banner_title"/></label><label>Subtitle<input [(ngModel)]="bannerForm.subtitle" name="banner_subtitle"/></label><label>Upload BG Image<input type="file" (change)="onBannerImageSelected($event)" accept="image/*"/></label><label>CTA URL<input [(ngModel)]="bannerForm.cta_url" name="banner_url"/></label></div><button class="button dark" (click)="createBanner()">Add banner</button>@for(b of banners();track b.id){<article class="row"><span><strong>{{b.title}}</strong><small>{{b.is_active?'active':'hidden'}}</small></span><label class="inline-check"><input type="checkbox" [ngModel]="b.is_active" (ngModelChange)="patch('/banners/'+b.id+'/',{is_active:$event})" [name]="'banner_'+b.id"/> Active</label><button class="text-button" (click)="remove('/banners/'+b.id+'/')">Remove</button></article>}</section>}</section>`,
})
export class AdminPage {
  api=inject(ApiService);tab='users';error=signal('');users=signal<any[]>([]);sellers=signal<any[]>([]);orders=signal<any[]>([]);products=signal<Product[]>([]);categories=signal<Category[]>([]);promos=signal<any[]>([]);banners=signal<Banner[]>([]);
  categoryForm:any={name:'',slug:''};promoForm:any={code:'',discount_type:'percent',value:10,minimum_order_amount:0,is_active:true};bannerForm:any={title:'',subtitle:'',image_url:'',cta_label:'Shop now',cta_url:'#catalog',sort_order:0,is_active:true};
  bannerImageFile: File | null = null;
  onBannerImageSelected(event: any) {
    if (event.target.files.length > 0) this.bannerImageFile = event.target.files[0];
  }
  constructor(){this.loadAll()}
  list(path:string,setter:(items:any[])=>void){this.api.get<any>(path).subscribe({next:v=>setter(v.results||v),error:e=>this.error.set(message(e))})}
  loadAll(){this.list('/users/admin/users/',v=>this.users.set(v));this.list('/sellers/admin/sellers/',v=>this.sellers.set(v));this.list('/admin/orders/',v=>this.orders.set(v));this.list('/products/',v=>this.products.set(v));this.list('/categories/',v=>this.categories.set(v));this.list('/admin/promo-codes/',v=>this.promos.set(v));this.list('/banners/',v=>this.banners.set(v))}
  post(path:string){this.api.post(path,{}).subscribe({next:()=>this.loadAll(),error:e=>this.error.set(message(e))})}
  patch(path:string,body:any){this.api.patch(path,body).subscribe({next:()=>this.loadAll(),error:e=>this.error.set(message(e))})}
  create(path:string,body:any){this.api.post(path,body).subscribe({next:()=>{this.loadAll();this.categoryForm={name:'',slug:''}},error:e=>this.error.set(message(e))})}
  createBanner(){
    const form = new FormData();
    form.append('title', this.bannerForm.title);
    form.append('subtitle', this.bannerForm.subtitle);
    form.append('cta_url', this.bannerForm.cta_url);
    if(this.bannerImageFile) form.append('image', this.bannerImageFile);
    this.api.post('/banners/',form).subscribe({next:()=>{this.loadAll();this.bannerForm={title:'',subtitle:'',image_url:'',cta_label:'Shop now',cta_url:'#catalog',sort_order:0,is_active:true};this.bannerImageFile=null},error:e=>this.error.set(message(e))})
  }
  remove(path:string){this.api.delete(path).subscribe({next:()=>this.loadAll(),error:e=>this.error.set(message(e))})}
}

