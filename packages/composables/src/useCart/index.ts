/* istanbul ignore file */
import {
  Context,
  useCartFactory,
  UseCartFactoryParams
} from '@vue-storefront/core';
import { Cart, CartItem, Coupon, Product } from '../types';

const params: UseCartFactoryParams<Cart, CartItem, Product> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  load: async (context: Context) => {
    // check if cart is already initiated
    const appKey = context.$shopify.config.app.$config.appKey;
    let existingLocale = context.$shopify.config.app.$cookies.get('cur-vsf-locale');
    let isLocaleSwitched = false;
    if (existingLocale === undefined || existingLocale === '' || existingLocale !== context.$shopify.config.app.$cookies.get('vsf-locale')) {
      context.$shopify.config.app.$cookies.set('cur-vsf-locale', context.$shopify.config.app.$cookies.get('vsf-locale'));
      existingLocale = context.$shopify.config.app.$cookies.get('cur-vsf-locale');
      isLocaleSwitched = true;
    } 
    let existngCartId = context.$shopify.config.app.$cookies.get(appKey + '_cart_id');
    if ((existngCartId === undefined || existngCartId === '' || isLocaleSwitched)) {
      // Initiate new cart
      existngCartId = await context.$shopify.api.createCart().then((checkout) => {
        context.$shopify.config.app.$cookies.set(appKey + '_cart_id', checkout, {maxAge: 60 * 60 * 24 * 365, path: '/'});
        return checkout;
      });
    }
    const checkoutId = existngCartId;
    // Keep existing cart
    const plainResp = await context.$shopify.api.checkOut(checkoutId).then((checkout) => {
      // Do something with the checkout
      return checkout;
    });
    return JSON.parse(JSON.stringify(plainResp));
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addItem: async (context: Context, { currentCart, product, quantity, customQuery }) => {
    const appKey = context.$shopify.config.app.$config.appKey;
    return await context.$shopify.api.addToCart({ currentCart, product, quantity, customQuery }).then((checkout) => {
      // store cart id
      if (!context.$shopify.config.app.$cookies.get(appKey + '_cart_id', currentCart.id)) {
        context.$shopify.config.app.$cookies.set(appKey + '_cart_id', currentCart.id, { maxAge: 60 * 60 * 24 * 365, path: '/' });  
      }
      return JSON.parse(JSON.stringify(checkout));
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeItem: async (context: Context, { currentCart, product, customQuery }) => {
    // Remove an item from the checkout
    return await context.$shopify.api.removeFromCart({currentCart, product}).then((checkout) => {
      // return updated cart data
      return JSON.parse(JSON.stringify(checkout));
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateItemQty: async (context: Context, { currentCart, product, quantity, customQuery }) => {
    // Update an item Quantity
    return await context.$shopify.api.updateCart({currentCart, product, quantity}).then((checkout) => {
      // return updated cart data
      return JSON.parse(JSON.stringify(checkout));
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clear: async (context: Context, { currentCart }) => {
    return {};
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyCoupon: async (context: Context, { currentCart, couponCode, customQuery }) => {
    console.log('Mocked: useCart.applyCoupon');
    return {
      updatedCart: {},
      updatedCoupon: {}
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeCoupon: async (context: Context, { currentCart, couponCode, customQuery }) => {
    console.log('Mocked: useCart.removeCoupon');
    return {
      updatedCart: {}
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInCart: (context: Context, { currentCart, product }) => {
    const getBasketItemByProduct = ({ currentCart, product }) => {
      if (product) {
        let variantId;
        if (product && product.variantBySelectedOptions && product.variantBySelectedOptions !== null) {
          variantId = product.variantBySelectedOptions.id;
        }
        if (product.variants) {
          variantId = product.variants[0].id;
        }
        if (product.barcodes) {
          // handle & convert plain product Id from BCapp to base64
          const variationIDPlain = 'gid://shopify/ProductVariant/' + variantId;
          const buff = Buffer.from(variationIDPlain);
          variantId = buff.toString('base64');
        }
          return currentCart?.lineItems?.find?.((item) => item.variant.id === variantId);

      }
      return false;
    };

    return Boolean(currentCart && getBasketItemByProduct({ currentCart, product }));
  }
};

export default useCartFactory<Cart, CartItem, Product>(params);
