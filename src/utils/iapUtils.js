import * as IAP from 'expo-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product IDs - These need to be configured in App Store Connect and Google Play Console
const PRODUCT_IDS = {
  UNLOCK_ALL: 'unlock_all_boards', // Product ID for unlocking all boards
};

const PURCHASE_STORAGE_KEY = '@purchases';

let isConnected = false;
let purchaseUpdateSubscription = null;
let purchaseErrorSubscription = null;

/**
 * Initialize IAP connection
 * Returns true if connection successful, false otherwise
 */
export async function initializeIAP() {
  try {
    if (isConnected) {
      return true;
    }

    // Initialize connection - returns boolean indicating success
    const connected = await IAP.initConnection();
    
    if (connected) {
      isConnected = true;
      
      // Set up purchase event listeners
      setupPurchaseListeners();
      
      return true;
    } else {
      console.warn('In-app purchases are not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Error initializing IAP:', error);
    isConnected = false;
    return false;
  }
}

/**
 * Set up purchase event listeners
 */
function setupPurchaseListeners() {
  // Clean up existing listeners
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
  }

  // Listen for successful purchases
  purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase) => {
    try {
      console.log('Purchase updated:', purchase);
      
      // Verify purchase state
      if (purchase.purchaseState === 'purchased') {
        // Save purchase locally
        if (purchase.productId === PRODUCT_IDS.UNLOCK_ALL) {
          await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
        }
        
        // Finish transaction (mark as consumed for non-consumable)
        // For non-consumable products, we still need to finish the transaction
        await IAP.finishTransaction({
          purchase,
          isConsumable: false, // Non-consumable product
        });
      }
    } catch (error) {
      console.error('Error handling purchase update:', error);
    }
  });

  // Listen for purchase errors
  purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
    console.error('Purchase error:', error);
    // Errors are handled in the calling code
  });
}

/**
 * Disconnect from IAP
 */
export async function disconnectIAP() {
  try {
    // Remove listeners
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }

    if (isConnected) {
      await IAP.endConnection();
      isConnected = false;
    }
  } catch (error) {
    console.error('Error disconnecting IAP:', error);
  }
}

/**
 * Get available products from the store
 * Returns array of Product objects
 */
export async function getProducts() {
  try {
    if (!isConnected) {
      const connected = await initializeIAP();
      if (!connected) {
        return [];
      }
    }
    
    // Fetch products using new API
    // type: 'in-app' for non-consumable/consumable products
    const products = await IAP.fetchProducts({
      skus: [PRODUCT_IDS.UNLOCK_ALL],
      type: 'in-app',
    });
    
    return products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Purchase unlock all boards
 * Returns { success: boolean, error?: string, purchase?: Purchase }
 * 
 * Note: The purchase flow uses event listeners, but we also check available purchases
 * after initiating to provide immediate feedback to the caller.
 */
export async function purchaseUnlockAll() {
  try {
    if (!isConnected) {
      const connected = await initializeIAP();
      if (!connected) {
        return { success: false, error: 'Could not connect to store' };
      }
    }

    // Get products first to ensure they're available
    const products = await getProducts();
    const unlockAllProduct = products.find(p => p.id === PRODUCT_IDS.UNLOCK_ALL);
    
    if (!unlockAllProduct) {
      return { success: false, error: 'Unlock All product not found in store' };
    }

    // Request purchase using new API
    // The direct API may return a Purchase or void depending on platform
    const purchaseResult = await IAP.requestPurchase({
      request: {
        apple: { sku: PRODUCT_IDS.UNLOCK_ALL },
        google: { skus: [PRODUCT_IDS.UNLOCK_ALL] },
      },
      type: 'in-app',
    });
    
    // Handle purchase result
    // The purchaseUpdatedListener will also handle this, but we can process it here too
    if (purchaseResult) {
      const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
      
      if (purchase && purchase.purchaseState === 'purchased') {
        // Save purchase locally
        await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
        
        // Finish transaction
        await IAP.finishTransaction({
          purchase,
          isConsumable: false,
        });
        
        return { success: true, purchase };
      }
    }
    
    // If no immediate result, check available purchases after a short delay
    // This handles cases where the purchase completes asynchronously
    await new Promise(resolve => setTimeout(resolve, 500));
    const availablePurchases = await IAP.getAvailablePurchases();
    const recentPurchase = availablePurchases.find(
      p => p.productId === PRODUCT_IDS.UNLOCK_ALL && p.purchaseState === 'purchased'
    );
    
    if (recentPurchase) {
      await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
      await IAP.finishTransaction({
        purchase: recentPurchase,
        isConsumable: false,
      });
      return { success: true, purchase: recentPurchase };
    }
    
    // Purchase may still be processing (pending state)
    return { success: true };
  } catch (error) {
    console.error('Error purchasing unlock all:', error);
    
    // Handle user cancellation gracefully
    if (IAP.isUserCancelledError && IAP.isUserCancelledError(error) || error.code === IAP.ErrorCode?.UserCancelled) {
      return { success: false, error: 'Purchase was cancelled' };
    }
    
    // Handle other error codes
    if (error.code === IAP.ErrorCode?.NetworkError) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
    if (error.code === IAP.ErrorCode?.ItemUnavailable) {
      return { success: false, error: 'Product is not available' };
    }
    if (error.code === IAP.ErrorCode?.AlreadyOwned) {
      // Already owned - restore it
      await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
      return { success: true, error: 'Already purchased' };
    }
    
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 * Returns { success: boolean, restored: number, error?: string }
 */
export async function restorePurchases() {
  try {
    if (!isConnected) {
      const connected = await initializeIAP();
      if (!connected) {
        return { success: false, error: 'Could not connect to store' };
      }
    }

    // Get available purchases (restorable items)
    const purchases = await IAP.getAvailablePurchases();
    
    if (purchases && purchases.length > 0) {
      // Restore all purchases
      let restoredCount = 0;
      for (const purchase of purchases) {
        if (purchase.productId === PRODUCT_IDS.UNLOCK_ALL) {
          // Save purchase locally
          await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
          
          // Finish transaction if needed
          if (purchase.purchaseState === 'purchased') {
            await IAP.finishTransaction({
              purchase,
              isConsumable: false,
            });
          }
          
          restoredCount++;
        }
      }
      return { success: true, restored: restoredCount };
    }
    
    return { success: true, restored: 0 };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error: error.message || 'Failed to restore purchases' };
  }
}

/**
 * Check if unlock all has been purchased
 * Returns boolean
 */
export async function hasUnlockedAll() {
  try {
    // Check local storage first
    const purchases = await AsyncStorage.getItem(PURCHASE_STORAGE_KEY);
    if (purchases) {
      const purchaseList = JSON.parse(purchases);
      if (purchaseList.includes(PRODUCT_IDS.UNLOCK_ALL)) {
        return true;
      }
    }
    
    // Also check with store to verify (optional but recommended)
    if (isConnected) {
      try {
        const availablePurchases = await IAP.getAvailablePurchases();
        const hasPurchase = availablePurchases.some(
          p => p.productId === PRODUCT_IDS.UNLOCK_ALL && p.purchaseState === 'purchased'
        );
        if (hasPurchase) {
          // Sync with local storage
          await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
          return true;
        }
      } catch (error) {
        // If store check fails, fall back to local storage
        console.warn('Could not verify purchase with store:', error);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking unlock status:', error);
    return false;
  }
}

/**
 * Save purchase to local storage
 */
async function savePurchase(productId) {
  try {
    const existing = await AsyncStorage.getItem(PURCHASE_STORAGE_KEY);
    const purchases = existing ? JSON.parse(existing) : [];
    
    if (!purchases.includes(productId)) {
      purchases.push(productId);
      await AsyncStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchases));
    }
  } catch (error) {
    console.error('Error saving purchase:', error);
    throw error;
  }
}

/**
 * Get purchase info (price, etc.)
 * Returns { price: string, currency: string, title: string, description: string } or null
 */
export async function getPurchaseInfo() {
  try {
    if (!isConnected) {
      const connected = await initializeIAP();
      if (!connected) {
        return null;
      }
    }
    
    const products = await getProducts();
    const unlockAllProduct = products.find(p => p.id === PRODUCT_IDS.UNLOCK_ALL);
    
    if (unlockAllProduct) {
      return {
        price: unlockAllProduct.displayPrice || unlockAllProduct.price?.toString() || 'N/A',
        currency: unlockAllProduct.currency || '',
        title: unlockAllProduct.title || unlockAllProduct.displayNameIOS || '',
        description: unlockAllProduct.description || '',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting purchase info:', error);
    return null;
  }
}
